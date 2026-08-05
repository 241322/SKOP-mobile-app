import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/skop/AppHeader';
import { BottomNav } from '@/components/skop/BottomNav';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { type SkopSessionRecord, useSkopSession } from '@/context/skop-session';

const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const weekdayColours = [
  SkopColors.blue,
  SkopColors.green,
  SkopColors.pink,
  SkopColors.blue,
  SkopColors.green,
  SkopColors.pink,
  SkopColors.blue,
];

export default function InsightsScreen() {
  const { averageSessionSeconds, sessions, skopSessionCount, totalSessionSeconds } = useSkopSession();
  const { height, width } = useWindowDimensions();
  const wideLayout = width >= 700 || width > height;
  const longestSessionSeconds = sessions.reduce(
    (longest, session) => Math.max(longest, session.durationSeconds),
    0
  );
  const days = buildWeekdayData(sessions);
  const summary = [
    { label: 'SKOP SESSIONS', value: String(skopSessionCount), colour: SkopColors.yellow },
    { label: 'TIME IN SKOP', value: formatDuration(totalSessionSeconds), colour: SkopColors.green },
    { label: 'AVERAGE SESSION', value: formatDuration(averageSessionSeconds), colour: SkopColors.blue },
    { label: 'LONGEST SESSION', value: formatDuration(longestSessionSeconds), colour: SkopColors.pink },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <AppHeader title="Learn the URGE" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* these cards only use sessions recorded after the game starts */}
          <View style={styles.summaryGrid}>
            {summary.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.summaryCard,
                  { backgroundColor: item.colour, width: wideLayout ? '23%' : '47%' },
                ]}>
                <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.summaryLabel}>
                  {item.label}
                </Text>
                <Text adjustsFontSizeToFit minimumFontScale={0.65} numberOfLines={1} style={styles.summaryValue}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* groups session start times by weekday */}
          <View style={styles.chartWrap}>
            <Text style={styles.sectionTitle}>SESSIONS BY DAY</Text>
            <View style={styles.chart}>
              {days.map((item, index) => (
                <View key={`${item.day}-${index}`} style={styles.dayCard}>
                  <Text style={styles.value}>{item.value}</Text>
                  <View style={styles.pinWrap}>
                    <View style={[styles.pinLine, { height: item.height }]} />
                    <View style={[styles.pinHead, { bottom: Math.max(0, item.height - 6) }]} />
                  </View>
                  <Text style={[styles.day, { color: item.color }]}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* marks insights as the active tab */}
        <BottomNav active="insights" />
      </View>
    </SafeAreaView>
  );
}

function buildWeekdayData(sessions: SkopSessionRecord[]) {
  const counts = Array(7).fill(0) as number[];

  sessions.forEach((session) => {
    const sundayFirstIndex = new Date(session.startedAt).getDay();
    const mondayFirstIndex = (sundayFirstIndex + 6) % 7;
    counts[mondayFirstIndex] += 1;
  });

  const largestCount = Math.max(1, ...counts);
  return weekdayLabels.map((day, index) => ({
    day,
    value: counts[index],
    height: counts[index] === 0 ? 4 : Math.round(14 + (counts[index] / largestCount) * 48),
    color: weekdayColours[index],
  }));
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: SkopColors.background,
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: SkopColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    gap: 40,
  },
  summaryGrid: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  summaryCard: {
    minWidth: 145,
    height: 112,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'space-between',
    ...skopShadow,
  },
  summaryLabel: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  summaryValue: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 28,
    textAlign: 'center',
  },
  chartWrap: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
  },
  sectionTitle: {
    color: SkopColors.ink,
    fontFamily: SkopFonts.bold,
    fontSize: 22,
  },
  chart: {
    width: '100%',
    height: 140,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dayCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: 72,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.surface,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
    boxShadow: `0px 4px 0px 0px ${SkopColors.shadow}`,
  },
  value: {
    position: 'absolute',
    top: 3,
    fontSize: 20,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  pinWrap: {
    height: 68,
    width: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pinLine: {
    width: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.yellow,
  },
  pinHead: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.yellow,
  },
  day: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: SkopFonts.bold,
    textShadowColor: SkopColors.ink,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
