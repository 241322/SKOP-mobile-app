import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { useSkopSession } from '@/context/skop-session';
import {
  cellKey,
  directionFromSwipe,
  directionVector,
  Direction,
  GameRoute,
  generateRoute,
  GAME_FPS,
  GridPoint,
  GRID_ROWS,
  levelColour,
  levelTarget,
  routeWidthScale,
  SCORE_PER_CELL,
  stepDelay,
} from '@/lib/urge-game';

type GamePhase = 'ready' | 'playing' | 'transition' | 'crashed' | 'feeling';

type MovementSegment = {
  from: GridPoint;
  to: GridPoint;
  progress: number;
  crashProgress?: number;
};

// controls the marker size, route shape and rest time
const INITIAL_PLAYER = { x: 1, y: 4 };
const MARKER_SCALE = 0.34;
const ROUTE_BORDER_WIDTH = 3;
const ROUTE_RADIUS = 4;
const ROUTE_SHADOW_Y = 4;
const LEVEL_TRANSITION_MS = 5000;

// rounds corners that sit on the outside of the route
function routeCellRadii(cell: GridPoint, safeCells: Set<string>, radius = ROUTE_RADIUS) {
  const hasTop = safeCells.has(cellKey({ x: cell.x, y: cell.y - 1 }));
  const hasRight = safeCells.has(cellKey({ x: cell.x + 1, y: cell.y }));
  const hasBottom = safeCells.has(cellKey({ x: cell.x, y: cell.y + 1 }));
  const hasLeft = safeCells.has(cellKey({ x: cell.x - 1, y: cell.y }));

  return {
    borderTopLeftRadius: !hasTop && !hasLeft ? radius : 0,
    borderTopRightRadius: !hasTop && !hasRight ? radius : 0,
    borderBottomRightRadius: !hasBottom && !hasRight ? radius : 0,
    borderBottomLeftRadius: !hasBottom && !hasLeft ? radius : 0,
  };
}

// checks whether a point sits inside any route cell
function routeContainsPoint(point: GridPoint, safeCells: Set<string>, padding: number) {
  const firstX = Math.ceil(point.x - 1 - padding);
  const lastX = Math.floor(point.x + padding);
  const firstY = Math.ceil(point.y - 1 - padding);
  const lastY = Math.floor(point.y + padding);

  for (let x = firstX; x <= lastX; x += 1) {
    for (let y = firstY; y <= lastY; y += 1) {
      if (safeCells.has(cellKey({ x, y }))) return true;
    }
  }

  return false;
}

// samples the marker edges so it only crashes on contact
function markerFitsRoute(position: GridPoint, safeCells: Set<string>, padding: number) {
  const markerStart = (1 - MARKER_SCALE) / 2;
  const markerEnd = markerStart + MARKER_SCALE;
  const samples = [markerStart, 0.5, markerEnd];

  return samples.every((sampleX) =>
    samples.every((sampleY) =>
      routeContainsPoint(
        { x: position.x + sampleX, y: position.y + sampleY },
        safeCells,
        padding
      )
    )
  );
}

// finds the point where the marker reaches a wall
function findWallContact(from: GridPoint, to: GridPoint, route: GameRoute, padding: number) {
  const positionAt = (progress: number) => ({
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  });
  let safeProgress = 0;
  let blockedProgress = 0.25;

  while (blockedProgress < 3 && markerFitsRoute(positionAt(blockedProgress), route.safeCells, padding)) {
    safeProgress = blockedProgress;
    blockedProgress += 0.25;
  }

  for (let step = 0; step < 10; step += 1) {
    const midpoint = (safeProgress + blockedProgress) / 2;
    if (markerFitsRoute(positionAt(midpoint), route.safeCells, padding)) safeProgress = midpoint;
    else blockedProgress = midpoint;
  }

  return safeProgress;
}

// finds the score linked to the marker's route position
function routeProgressAt(position: GridPoint, route: GameRoute, padding: number) {
  const directProgress = route.progressByCell.get(cellKey(position));
  if (directProgress !== undefined) return directProgress;

  const searchRadius = Math.ceil(padding) + 1;
  let nearestDistance = Number.POSITIVE_INFINITY;
  let nearestProgress = 0;

  for (let x = position.x - searchRadius; x <= position.x + searchRadius; x += 1) {
    for (let y = position.y - searchRadius; y <= position.y + searchRadius; y += 1) {
      const progress = route.progressByCell.get(cellKey({ x, y }));
      if (progress === undefined) continue;

      const distance = (position.x - x) ** 2 + (position.y - y) ** 2;
      if (distance < nearestDistance || (distance === nearestDistance && progress > nearestProgress)) {
        nearestDistance = distance;
        nearestProgress = progress;
      }
    }
  }

  return nearestProgress;
}

export default function UrgeGameScreen() {
  const { completeUrge, highScore, recordHighScore } = useSkopSession();

  // state updates parts that must appear on screen
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [route, setRoute] = useState<GameRoute>(() => generateRoute());
  const [playerPosition, setPlayerPosition] = useState<GridPoint>(INITIAL_PLAYER);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [transitionElapsedMs, setTransitionElapsedMs] = useState(0);
  const [boardSize, setBoardSize] = useState({ width: 760, height: 300 });

  // refs hold game values without waiting for a render
  const sessionStartedAt = useRef(Date.now());
  const completedSession = useRef(false);
  const scoreRef = useRef(0);
  const directionRef = useRef<Direction>('right');
  const queuedDirectionRef = useRef<Direction | null>(null);
  const swipeHandledRef = useRef(false);
  const transitionStartedAt = useRef(0);
  const segmentRef = useRef<MovementSegment>({
    from: INITIAL_PLAYER,
    to: { x: INITIAL_PLAYER.x + 1, y: INITIAL_PLAYER.y },
    progress: 0,
  });

  // puts the marker back at the route entrance
  const resetMovement = useCallback(() => {
    directionRef.current = 'right';
    queuedDirectionRef.current = null;
    segmentRef.current = {
      from: INITIAL_PLAYER,
      to: { x: INITIAL_PLAYER.x + 1, y: INITIAL_PLAYER.y },
      progress: 0,
    };
    setPlayerPosition(INITIAL_PLAYER);
  }, []);

  // uses landscape for the game and restores portrait on exit
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => undefined);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    };
  }, []);

  // counts how long the user stays in the urge screen
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(Math.floor((Date.now() - sessionStartedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // moves the marker and checks the route at the game frame rate
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'transition') return;

    let lastFrameAt = Date.now();
    const frameDuration = 1000 / GAME_FPS;
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(100, now - lastFrameAt);
      lastFrameAt = now;

      let segment = segmentRef.current;
      let segmentProgress = segment.progress + elapsed / (phase === 'transition' ? 300 : stepDelay(level));

      // stops at the contact point before opening the crash dialog
      const crashAtWall = () => {
        const crashProgress = segment.crashProgress ?? 1;
        segment.progress = crashProgress;
        segmentRef.current = segment;
        setPlayerPosition({
          x: segment.from.x + (segment.to.x - segment.from.x) * crashProgress,
          y: segment.from.y + (segment.to.y - segment.from.y) * crashProgress,
        });
        recordHighScore(scoreRef.current);
        setPhase('crashed');
      };

      if (segment.crashProgress !== undefined && segmentProgress >= segment.crashProgress) {
        crashAtWall();
        return;
      }

      if (segment.crashProgress !== undefined) {
        segment.progress = segmentProgress;
        segmentRef.current = segment;
        setPlayerPosition({
          x: segment.from.x + (segment.to.x - segment.from.x) * segmentProgress,
          y: segment.from.y + (segment.to.y - segment.from.y) * segmentProgress,
        });
        return;
      }

      while (segmentProgress >= 1) {
        const arrived = segment.to;
        segmentProgress -= 1;

        // turns route progress into score and level changes
        if (phase === 'playing') {
          const routePadding = routeWidthScale(level) - 1;
          const routeProgress = routeProgressAt(arrived, route, routePadding);
          const nextScore = Math.max(scoreRef.current, routeProgress * SCORE_PER_CELL);

          if (nextScore !== scoreRef.current) {
            scoreRef.current = nextScore;
            setScore(nextScore);
            recordHighScore(nextScore);
          }

          if (nextScore >= levelTarget(level)) {
            transitionStartedAt.current = Date.now();
            setTransitionElapsedMs(0);
            directionRef.current = 'right';
            queuedDirectionRef.current = null;
            segmentRef.current = {
              from: arrived,
              to: { x: arrived.x + 1, y: arrived.y },
              progress: 0,
            };
            setPlayerPosition(arrived);
            setPhase('transition');
            return;
          }
        }

        const queuedDirection = queuedDirectionRef.current;

        // checks the route and obstacles before each grid step
        const canMove = (candidate: Direction) => {
          const vector = directionVector[candidate];
          const candidatePoint = { x: arrived.x + vector.x, y: arrived.y + vector.y };
          const candidateKey = cellKey(candidatePoint);
          const collisionLevel = phase === 'transition' ? level + 1 : level;
          const routePadding = routeWidthScale(collisionLevel) - 1;
          return (
            markerFitsRoute(candidatePoint, route.safeCells, routePadding) &&
            !route.obstacleCells.has(candidateKey)
          );
        };

        if (phase !== 'transition' && queuedDirection && canMove(queuedDirection)) {
          directionRef.current = queuedDirection;
          queuedDirectionRef.current = null;
        }

        const activeDirection: Direction = phase === 'transition' ? 'right' : directionRef.current;
        if (!canMove(activeDirection)) {
          const vector = directionVector[activeDirection];
          const target = { x: arrived.x + vector.x, y: arrived.y + vector.y };
          const targetKey = cellKey(target);
          const routePadding = routeWidthScale(level) - 1;
          const wallContact = findWallContact(arrived, target, route, routePadding);

          const collisionProgress = route.obstacleCells.has(targetKey) ? 0.54 : wallContact;
          segment = {
            from: arrived,
            to: target,
            progress: 0,
            crashProgress: collisionProgress,
          };

          if (segmentProgress >= collisionProgress) {
            crashAtWall();
            return;
          }
          break;
        }

        const vector = directionVector[activeDirection];
        segment = {
          from: arrived,
          to: { x: arrived.x + vector.x, y: arrived.y + vector.y },
          progress: 0,
        };
      }

      segment.progress = segmentProgress;
      segmentRef.current = segment;
      setPlayerPosition({
        x: segment.from.x + (segment.to.x - segment.from.x) * segmentProgress,
        y: segment.from.y + (segment.to.y - segment.from.y) * segmentProgress,
      });
    }, frameDuration);

    return () => clearInterval(timer);
  }, [level, phase, recordHighScore, resetMovement, route]);

  // ends the five second rest and keeps the same route
  useEffect(() => {
    if (phase !== 'transition') return;

    const updateTransition = () => {
      const elapsed = Math.min(LEVEL_TRANSITION_MS, Date.now() - transitionStartedAt.current);
      setTransitionElapsedMs(elapsed);

      if (elapsed < LEVEL_TRANSITION_MS) return;

      setLevel((current) => current + 1);
      setPhase('playing');
    };

    const timer = setInterval(updateTransition, 100);
    updateTransition();

    return () => {
      clearInterval(timer);
    };
  }, [phase]);

  // starts the game or queues the next turn
  const onSwipe = useCallback(
    (dx: number, dy: number) => {
      const nextDirection = directionFromSwipe(dx, dy);
      if (!nextDirection) return;

      if (phase === 'ready') {
        if (nextDirection === 'right') setPhase('playing');
        return;
      }

      if (phase === 'playing') queuedDirectionRef.current = nextDirection;
    },
    [phase]
  );

  // catches a swipe once it moves six pixels
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          (phase === 'ready' || phase === 'playing') &&
          Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) >= 6,
        onPanResponderGrant: (_, gesture) => {
          swipeHandledRef.current = false;
          if (directionFromSwipe(gesture.dx, gesture.dy)) {
            onSwipe(gesture.dx, gesture.dy);
            swipeHandledRef.current = true;
          }
        },
        onPanResponderMove: (_, gesture) => {
          if (!swipeHandledRef.current && directionFromSwipe(gesture.dx, gesture.dy)) {
            onSwipe(gesture.dx, gesture.dy);
            swipeHandledRef.current = true;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (!swipeHandledRef.current) onSwipe(gesture.dx, gesture.dy);
          swipeHandledRef.current = false;
        },
        onPanResponderTerminate: () => {
          swipeHandledRef.current = false;
        },
      }),
    [onSwipe, phase]
  );

  // starts a new run with a new route
  const respawn = () => {
    const nextRoute = generateRoute();
    scoreRef.current = 0;
    setScore(0);
    setLevel(1);
    setRoute(nextRoute);
    resetMovement();
    setPhase('ready');
  };

  // records a completed urge after three minutes
  const finishSession = () => {
    recordHighScore(score);
    if (sessionSeconds >= 180 && !completedSession.current) {
      completeUrge();
      completedSession.current = true;
    }
    router.replace('/');
  };

  // asks how the user feels when they leave before three minutes
  const requestLeave = () => {
    if (sessionSeconds >= 180) finishSession();
    else setPhase('feeling');
  };

  // stores the board size used to scale the grid
  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  // keeps the marker fixed while the route moves past it
  const cellSize = Math.min(boardSize.height / GRID_ROWS, boardSize.width / 22);
  const cameraX = boardSize.width * 0.27;
  const gridTop = (boardSize.height - GRID_ROWS * cellSize) / 2;
  const visibleCells = route.cells.filter((cell) => Math.abs(cell.x - playerPosition.x) < 16);
  const visibleObstacles = route.obstacles.filter((cell) => Math.abs(cell.x - playerPosition.x) < 16);
  const displayedLevel = phase === 'transition' ? level + 1 : level;
  const routeColour = levelColour(displayedLevel);
  const routeScale = routeWidthScale(displayedLevel);
  const routeOutset = (routeScale - 1) * cellSize;
  const outlineOutset = routeOutset + ROUTE_BORDER_WIDTH;
  const displayedHighScore = Math.max(highScore, score);
  const levelBaseScore = level === 1 ? 0 : levelTarget(level - 1);
  const levelScoreRange = levelTarget(level) - levelBaseScore;
  const levelProgress =
    phase === 'transition'
      ? 0
      : Math.min(100, Math.max(0, ((score - levelBaseScore) / levelScoreRange) * 100));
  const transitionSeconds = Math.max(
    1,
    Math.ceil((LEVEL_TRANSITION_MS - transitionElapsedMs) / 1000)
  );
  const transitionStage =
    transitionElapsedMs < 900 ? 'complete' : transitionElapsedMs < 4100 ? 'rest' : 'ready';

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <StatusBar hidden />
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <View style={styles.logoWrap}>
              <Image source={require('../assets/figma/game-logo-shadow.png')} style={styles.logoShadow} />
              <Image source={require('../assets/figma/game-logo.png')} style={styles.logo} contentFit="cover" />
            </View>
            <View>
              <Text style={styles.title}>BREAKOUT</Text>
              <Text style={[styles.level, { color: routeColour }]}>LEVEL {displayedLevel}</Text>
            </View>
          </View>

          <Text style={styles.sessionTime}>{formatTime(sessionSeconds)}</Text>

          <View style={styles.scoreBlock}>
            <Text style={[styles.score, { color: routeColour }]}>{score}</Text>
            <Text style={styles.highScore}>{displayedHighScore}</Text>
          </View>
        </View>

        {/* draws the route shadow before its outline and colour */}
        <View style={styles.board} onLayout={onBoardLayout} {...panResponder.panHandlers}>
          <Pressable
            accessibilityLabel="Leave urge session"
            accessibilityRole="button"
            hitSlop={8}
            onPress={requestLeave}
            style={({ pressed }) => [styles.exitButton, pressed && styles.buttonPressed]}>
            <Ionicons name="close" size={22} color={SkopColors.surface} />
          </Pressable>
          {visibleCells.map((cell) => (
            <View
              key={`shadow-${cellKey(cell)}`}
              pointerEvents="none"
              style={[
                styles.routeShadowCell,
                routeCellRadii(cell, route.safeCells),
                {
                  height: cellSize + outlineOutset * 2 + 1,
                  left: cameraX + (cell.x - playerPosition.x) * cellSize - outlineOutset,
                  top: gridTop + cell.y * cellSize - outlineOutset,
                  width: cellSize + outlineOutset * 2 + 1,
                },
              ]}
            />
          ))}
          {visibleCells.map((cell) => (
            <View
              key={`outline-${cellKey(cell)}`}
              pointerEvents="none"
              style={[
                styles.routeOutlineCell,
                routeCellRadii(cell, route.safeCells),
                {
                  height: cellSize + outlineOutset * 2 + 1,
                  left: cameraX + (cell.x - playerPosition.x) * cellSize - outlineOutset,
                  top: gridTop + cell.y * cellSize - outlineOutset,
                  width: cellSize + outlineOutset * 2 + 1,
                },
              ]}
            />
          ))}
          {visibleCells.map((cell) => (
            <View
              key={cellKey(cell)}
              pointerEvents="none"
              style={[
                styles.routeCell,
                routeCellRadii(cell, route.safeCells, Math.max(0, ROUTE_RADIUS - ROUTE_BORDER_WIDTH)),
                {
                  backgroundColor: routeColour,
                  height: cellSize + routeOutset * 2 + 1,
                  left: cameraX + (cell.x - playerPosition.x) * cellSize - routeOutset,
                  top: gridTop + cell.y * cellSize - routeOutset,
                  width: cellSize + routeOutset * 2 + 1,
                },
              ]}
            />
          ))}
          {visibleObstacles.map((cell) => (
            <View
              key={`obstacle-${cellKey(cell)}`}
              style={[
                styles.obstacle,
                {
                  height: cellSize * 0.58,
                  left: cameraX + (cell.x - playerPosition.x) * cellSize + cellSize * 0.21,
                  top: gridTop + cell.y * cellSize + cellSize * 0.21,
                  width: cellSize * 0.58,
                },
              ]}
            />
          ))}
          {/* keeps the marker at the camera point */}
          <View
            style={[
              styles.marker,
              {
                backgroundColor: routeColour === SkopColors.pink ? SkopColors.blue : SkopColors.pink,
                height: cellSize * MARKER_SCALE,
                left: cameraX + cellSize * ((1 - MARKER_SCALE) / 2),
                top: gridTop + playerPosition.y * cellSize + cellSize * ((1 - MARKER_SCALE) / 2),
                width: cellSize * MARKER_SCALE,
              },
            ]}
          />

          {/* waits for a right swipe before movement starts */}
          {phase === 'ready' && (
            <View style={styles.startPrompt} pointerEvents="none">
              <Image source={require('../assets/figma/game-start-label.svg')} style={styles.startLabel} />
              <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.startText}>
                Swipe Right to Start
              </Text>
              <Image source={require('../assets/figma/game-swipe-hand.svg')} style={styles.swipeHand} />
            </View>
          )}

          {/* shows level messages on the game board */}
          {phase === 'transition' && (
            <View style={styles.transitionMessage} pointerEvents="none">
              <Text style={styles.transitionEyebrow}>
                {transitionStage === 'complete'
                  ? `LEVEL ${level} COMPLETE`
                  : transitionStage === 'rest'
                    ? 'REST'
                    : 'GET READY'}
              </Text>
              <Text style={styles.transitionTitle}>LEVEL {level + 1}</Text>
              <View style={styles.transitionCountSlot}>
                <Text style={styles.transitionCount}>
                  {transitionStage === 'complete' ? 'ROUTE CLEARED' : transitionSeconds}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* shows progress towards the next level */}
        <View style={styles.progressRail}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: routeColour,
                width: `${levelProgress}%`,
              },
            ]}
          />
        </View>

        {/* gives the user a new run or a way out */}
        {phase === 'crashed' && (
          <GameDialog title="ROUTE LOST" body={`Score ${score}`}>
            <DialogButton label="RESPAWN" colour={routeColour} onPress={respawn} />
            <DialogButton label="LEAVE" colour={SkopColors.surface} onPress={requestLeave} />
          </GameDialog>
        )}

        {/* checks in when a short session ends */}
        {phase === 'feeling' && (
          <GameDialog title="HOW ARE YOU FEELING?" body="Choose what feels closest right now.">
            <DialogButton label="CALMER" colour={SkopColors.green} onPress={finishSession} />
            <DialogButton label="STILL RESTLESS" colour={SkopColors.blue} onPress={finishSession} />
            <DialogButton label="NOT SURE" colour={SkopColors.surface} onPress={finishSession} />
          </GameDialog>
        )}
      </View>
    </SafeAreaView>
  );
}

// keeps each popup using the same frame
function GameDialog({ children, title, body }: { children: React.ReactNode; title: string; body: string }) {
  return (
    <View style={styles.dialogBackdrop}>
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <Text style={styles.dialogBody}>{body}</Text>
        <View style={styles.dialogActions}>{children}</View>
      </View>
    </View>
  );
}

// keeps each popup action using the same button
function DialogButton({ label, colour, onPress }: { label: string; colour: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.dialogButton, { backgroundColor: colour }, pressed && styles.buttonPressed]}>
      <Text style={styles.dialogButtonText}>{label}</Text>
    </Pressable>
  );
}

// turns seconds into the timer shown in the header
function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  shell: { flex: 1, backgroundColor: SkopColors.background, overflow: 'hidden' },
  header: {
    height: 96,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 255 },
  logoWrap: { width: 46, height: 46 },
  logoShadow: { position: 'absolute', width: 46, height: 46, opacity: 0.2 },
  logo: { position: 'absolute', left: 2, top: 2, width: 42, height: 42 },
  title: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 34, lineHeight: 34 },
  level: { fontFamily: SkopFonts.score, fontSize: 25, lineHeight: 27 },
  sessionTime: {
    minWidth: 92,
    color: SkopColors.ink,
    fontFamily: SkopFonts.scoreAlt,
    fontSize: 27,
    textAlign: 'center',
  },
  scoreBlock: { minWidth: 140, alignItems: 'flex-end' },
  score: { fontFamily: SkopFonts.score, fontSize: 34, lineHeight: 36 },
  highScore: { color: '#8bb2b4', fontFamily: SkopFonts.scoreAlt, fontSize: 24, lineHeight: 25 },
  board: { flex: 1, overflow: 'hidden', position: 'relative' },
  exitButton: {
    position: 'absolute',
    left: 8,
    top: '42%',
    width: 32,
    height: 48,
    borderRadius: 8,
    backgroundColor: SkopColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  routeShadowCell: {
    position: 'absolute',
    backgroundColor: SkopColors.shadow,
    transform: [{ translateX: 0 }, { translateY: ROUTE_SHADOW_Y }],
    zIndex: 0,
  },
  routeOutlineCell: {
    position: 'absolute',
    backgroundColor: SkopColors.ink,
    zIndex: 1,
  },
  routeCell: {
    position: 'absolute',
    zIndex: 2,
  },
  obstacle: {
    position: 'absolute',
    backgroundColor: SkopColors.ink,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: SkopColors.surface,
  },
  marker: {
    position: 'absolute',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: SkopColors.ink,
    zIndex: 4,
  },
  startPrompt: { position: 'absolute', left: 22, bottom: 12, width: 210, height: 76 },
  startLabel: { position: 'absolute', left: 0, top: 0, width: 168, height: 43 },
  startText: {
    position: 'absolute',
    left: 12,
    top: 13,
    width: 132,
    color: SkopColors.surface,
    fontFamily: SkopFonts.bold,
    fontSize: 12,
  },
  swipeHand: { position: 'absolute', left: 126, top: 34, width: 78, height: 38 },
  progressRail: { height: 8, marginHorizontal: 22, marginBottom: 10, borderWidth: 1, borderColor: SkopColors.ink },
  progressFill: { height: '100%' },
  transitionMessage: {
    position: 'absolute',
    right: 28,
    top: 18,
    minWidth: 230,
    alignItems: 'flex-end',
    zIndex: 6,
  },
  transitionEyebrow: { color: SkopColors.ink, fontFamily: SkopFonts.medium, fontSize: 13 },
  transitionTitle: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 38 },
  transitionCountSlot: { height: 34, minWidth: 190, alignItems: 'flex-end', justifyContent: 'center' },
  transitionCount: { color: SkopColors.ink, fontFamily: SkopFonts.score, fontSize: 24 },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(33,23,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: 390,
    maxWidth: '78%',
    backgroundColor: SkopColors.background,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    ...skopShadow,
  },
  dialogTitle: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 28, textAlign: 'center' },
  dialogBody: { color: SkopColors.ink, fontFamily: SkopFonts.body, fontSize: 16, marginTop: 5, textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' },
  dialogButton: {
    minWidth: 112,
    height: 43,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...skopShadow,
  },
  dialogButtonText: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 14 },
  buttonPressed: {
    transform: [{ translateY: 3 }],
    boxShadow: `0px 1px 0px 0px ${SkopColors.shadow}`,
  },
});
