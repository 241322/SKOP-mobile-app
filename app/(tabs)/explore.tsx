import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/skop/AppHeader';
import { BottomNav } from '@/components/skop/BottomNav';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';

// gives each day a value, pin height and colour
const days = [
  { day: 'M', value: 5, height: 38, color: SkopColors.blue },
  { day: 'T', value: 4, height: 28, color: SkopColors.green },
  { day: 'W', value: 3, height: 20, color: SkopColors.pink },
  { day: 'T', value: 2, height: 16, color: SkopColors.blue },
  { day: 'F', value: 5, height: 38, color: SkopColors.green },
  { day: 'S', value: 8, height: 62, color: SkopColors.pink },
  { day: 'S', value: 6, height: 45, color: SkopColors.blue },
];

export default function InsightsScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <AppHeader title="Learn the URGE" />

        {/* maps the weekly urge data into chart columns */}
        <View style={styles.chartWrap}>
          <View style={styles.chart}>
            {days.map((item, index) => (
              <View key={`${item.day}-${index}`} style={styles.dayCard}>
                <Text style={styles.value}>{item.value}</Text>
                <View style={styles.pinWrap}>
                  <View style={[styles.pinLine, { height: item.height }]} />
                  <View style={styles.pinHead} />
                </View>
                <Text style={[styles.day, { color: item.color }]}>{item.day}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.caption}>YOUR URGE HAS A SCHEDULE</Text>
        </View>

        {/* marks insights as the active tab */}
        <BottomNav active="insights" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: SkopColors.background,
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 393,
    backgroundColor: SkopColors.background,
  },
  chartWrap: {
    marginTop: 56,
    marginHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  chart: {
    width: '100%',
    height: 140,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    width: 36,
    height: 140,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.surface,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
    ...skopShadow,
    boxShadow: `0px 2px 0px 0px ${SkopColors.shadow}`,
  },
  value: {
    position: 'absolute',
    top: 1,
    fontSize: 20,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  pinWrap: {
    height: 74,
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
    bottom: 34,
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
  caption: {
    fontSize: 12,
    fontFamily: SkopFonts.body,
    color: SkopColors.ink,
  },
});
