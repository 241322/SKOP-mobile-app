import { Href, router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/skop/AppHeader';
import { BottomNav } from '@/components/skop/BottomNav';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { useSkopSession } from '@/context/skop-session';

export default function HomeScreen() {
  const { streak, urgesSkopped } = useSkopSession();
  const streakCards = [
    { value: String(streak.years), label: 'years', color: SkopColors.pink },
    { value: String(streak.months), label: 'months', color: SkopColors.blue },
    { value: String(streak.days), label: 'days', color: SkopColors.green },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.phone}>
        <AppHeader title="SKOP the URGE" />

        <View style={styles.streakRow}>
          {streakCards.map((item) => (
            <View key={item.label} style={[styles.streakCard, { backgroundColor: item.color }]}>
              <Text style={styles.streakValue}>{item.value}</Text>
              <View style={styles.streakDivider} />
              <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.streakLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.caption}>Streak still standing</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open urge distraction game"
          onPress={() => router.push('/urge' as Href)}
          style={({ pressed }) => [styles.urgeButton, pressed && styles.urgeButtonPressed]}>
          <Image source={require('../../assets/figma/home-urge-source.svg')} style={styles.urgeIcon} />
          <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.urgeText}>
            I HAVE AN URGE
          </Text>
          <Image source={require('../../assets/figma/home-urge-source.svg')} style={styles.urgeIcon} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.statTitle}>
              MONEY SAVED
            </Text>
            <Image source={require('../../assets/figma/home-money-source.svg')} style={styles.moneyIcon} />
            <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.money}>
              <Text style={styles.moneyPrefix}>R</Text>12 628
            </Text>
            <Text style={styles.statNote}>*This is an estimate*</Text>
          </View>
          <View style={styles.statCard}>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.statTitle}>
              URGES SKOPPED
            </Text>
            <Text style={styles.urgeCount}>{urgesSkopped}</Text>
            <Text style={styles.statNote}>Last urge - 24 days ago</Text>
          </View>
        </View>

        <BottomNav active="home" />
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
  streakRow: {
    marginTop: 46,
    paddingHorizontal: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakCard: {
    width: 92,
    height: 150,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    ...skopShadow,
  },
  streakValue: {
    fontSize: 46,
    lineHeight: 48,
    fontFamily: SkopFonts.bold,
    color: SkopColors.surface,
  },
  streakDivider: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: SkopColors.ink,
  },
  streakLabel: {
    fontSize: 23,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  caption: {
    marginTop: 16,
    textAlign: 'center',
    color: SkopColors.ink,
    fontSize: 16,
    fontFamily: SkopFonts.medium,
  },
  urgeButton: {
    marginTop: 42,
    marginHorizontal: 24,
    height: 53,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.yellow,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...skopShadow,
  },
  urgeText: {
    color: SkopColors.ink,
    fontSize: 20,
    fontFamily: SkopFonts.bold,
  },
  urgeButtonPressed: {
    transform: [{ translateY: 3 }],
    boxShadow: `0px 1px 0px 0px ${SkopColors.shadow}`,
  },
  urgeIcon: {
    width: 24,
    height: 22,
  },
  statsRow: {
    marginTop: 52,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    height: 160,
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitle: {
    width: '100%',
    fontSize: 15,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
    textAlign: 'center',
  },
  money: {
    fontSize: 36,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  moneyPrefix: {
    fontSize: 22,
  },
  urgeCount: {
    fontSize: 58,
    lineHeight: 64,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  statNote: {
    width: '100%',
    fontSize: 12,
    fontFamily: SkopFonts.body,
    color: SkopColors.ink,
    textAlign: 'center',
  },
  moneyIcon: {
    width: 32,
    height: 26,
    transform: [{ rotate: '180deg' }],
  },
});
