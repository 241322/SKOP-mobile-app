import { SkopColors } from '@/constants/skop-theme';

// limits movement to the four grid directions
export type Direction = 'up' | 'down' | 'left' | 'right';

export type GridPoint = {
  x: number;
  y: number;
};

export type GameRoute = {
  cells: GridPoint[];
  obstacles: GridPoint[];
  progressByCell: Map<string, number>;
  safeCells: Set<string>;
  obstacleCells: Set<string>;
};

// keeps the game rules away from the screen code
export const GRID_ROWS = 9;
export const GAME_FPS = 30;
export const SCORE_PER_CELL = 25;
export const LEVEL_COLOURS = [SkopColors.green, SkopColors.blue, SkopColors.yellow, SkopColors.pink];
const TRANSITION_CELL_COUNT = 20;

// turns a direction into a grid step
export const directionVector: Record<Direction, GridPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// gives each cell a key that works in maps and sets
export function cellKey(point: GridPoint) {
  return `${point.x}:${point.y}`;
}

// sets the score needed for each level
export function levelTarget(level: number) {
  const openingTargets = [2000, 5000, 9000, 15000];
  return openingTargets[level - 1] ?? 15000 + (level - 4) * 15000;
}

// loops through the brand colours as levels continue
export function levelColour(level: number) {
  return LEVEL_COLOURS[(level - 1) % LEVEL_COLOURS.length];
}

// makes the green and blue routes wider
export function routeWidthScale(level: number) {
  if (levelColour(level) === SkopColors.green) return 1.7;
  if (levelColour(level) === SkopColors.blue) return 1.3;
  return 1;
}

// raises the movement speed as the level goes up
export function stepDelay(level: number) {
  return Math.max(165, 430 - (level - 1) * 28);
}

// uses the strongest swipe axis as the direction
export function directionFromSwipe(dx: number, dy: number): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// builds one route that can keep going through each level
export function generateRoute(length = 1800): GameRoute {
  const main: GridPoint[] = [{ x: 0, y: 4 }];
  const mainProgress = [0];
  const transitionIndexes = new Set<number>();
  const insertedTransitions = new Set<number>();
  let x = 0;
  let y = 4;
  let scoreProgress = 0;

  // records where each rest section must start
  for (let routeLevel = 1; routeLevel <= 12; routeLevel += 1) {
    transitionIndexes.add(levelTarget(routeLevel) / SCORE_PER_CELL);
  }

  const pushScoredPoint = (point: GridPoint) => {
    main.push(point);
    scoreProgress += 1;
    mainProgress.push(scoreProgress);
  };

  const transitionIsDue = () =>
    transitionIndexes.has(scoreProgress) && !insertedTransitions.has(scoreProgress);

  // joins random horizontal and vertical route parts
  while (main.length < length) {
    // adds a straight part without raising the score
    if (transitionIsDue()) {
      insertedTransitions.add(scoreProgress);
      for (let step = 0; step < TRANSITION_CELL_COUNT && main.length < length; step += 1) {
        x += 1;
        main.push({ x, y });
        mainProgress.push(scoreProgress);
      }
      continue;
    }

    const horizontalLength = 5 + Math.floor(Math.random() * 6);
    for (let step = 0; step < horizontalLength && main.length < length; step += 1) {
      x += 1;
      pushScoredPoint({ x, y });
      if (transitionIsDue()) break;
    }

    if (transitionIsDue()) continue;

    const roomAbove = y - 1;
    const roomBelow = GRID_ROWS - 2 - y;
    const goDown = roomBelow > 1 && (roomAbove <= 1 || Math.random() > 0.5);
    const available = goDown ? roomBelow : roomAbove;
    const verticalLength = Math.max(1, Math.min(available, 1 + Math.floor(Math.random() * 3)));

    for (let step = 0; step < verticalLength && main.length < length; step += 1) {
      y += goDown ? 1 : -1;
      pushScoredPoint({ x, y });
      if (transitionIsDue()) break;
    }
  }

  const safeCells = new Set<string>();
  const progressByCell = new Map<string, number>();
  const obstacles: GridPoint[] = [];

  // widens the path and places obstacles away from turns
  main.forEach((point, index) => {
    safeCells.add(cellKey(point));
    progressByCell.set(cellKey(point), mainProgress[index]);

    const previous = main[Math.max(0, index - 1)];
    const next = main[Math.min(main.length - 1, index + 1)];
    const horizontal = previous.y === point.y && next.y === point.y;
    const sidePoint = horizontal
      ? { x: point.x, y: point.y < GRID_ROWS - 2 ? point.y + 1 : point.y - 1 }
      : { x: point.x + 1, y: point.y };

    safeCells.add(cellKey(sidePoint));
    progressByCell.set(cellKey(sidePoint), mainProgress[index]);

    const isTransitionCell = index > 0 && mainProgress[index] === mainProgress[index - 1];
    if (index > 16 && index % 37 === 0 && previous && next && horizontal && !isTransitionCell) {
      obstacles.push(point);
    }
  });

  const cells = Array.from(safeCells, (key) => {
    const [cellX, cellY] = key.split(':').map(Number);
    return { x: cellX, y: cellY };
  });
  const obstacleCells = new Set(obstacles.map(cellKey));

  return { cells, obstacles, progressByCell, safeCells, obstacleCells };
}
