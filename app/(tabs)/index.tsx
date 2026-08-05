import { Href, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/skop/AppHeader';
import { BottomNav } from '@/components/skop/BottomNav';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { useSkopSession } from '@/context/skop-session';

export default function HomeScreen() {
  // reads the values shared by the session provider
  const { lastSessionAt, moneySaved, skopSessionCount, streak } = useSkopSession();

  // turns the streak data into cards we can map over
  const streakCards = [
    { value: String(streak.years), label: 'years', color: SkopColors.pink },
    { value: String(streak.months), label: 'months', color: SkopColors.blue },
    { value: String(streak.days), label: 'days', color: SkopColors.green },
  ];

  // wide screens place the streak and actions beside each other
  const { height, width } = useWindowDimensions();
  const wideLayout = width >= 700 || width > height;
  const compact = height < 600;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.page, wideLayout && styles.widePage]}>
        <AppHeader title="SKOP the URGE" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, wideLayout && styles.wideContent]}>
          <View style={[styles.streakSection, wideLayout && styles.wideStreakSection]}>
            {/* builds one card for each part of the streak */}
            <View style={styles.streakRow}>
              {streakCards.map((item) => (
                <View
                  key={item.label}
                  style={[
                    styles.streakCard,
                    compact && styles.compactStreakCard,
                    { backgroundColor: item.color },
                  ]}>
                  <Text style={[styles.streakValue, compact && styles.compactStreakValue]}>{item.value}</Text>
                  <View style={[styles.streakDivider, compact && styles.compactStreakDivider]} />
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    numberOfLines={1}
                    style={[styles.streakLabel, compact && styles.compactStreakLabel]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.caption}>Streak still standing</Text>
          </View>

          <View style={[styles.actionSection, wideLayout && styles.wideActionSection]}>
            {/* starts the distraction game */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open urge distraction game"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/urge' as Href);
              }}
              style={({ pressed }) => [styles.urgeButton, pressed && styles.urgeButtonPressed]}>
              <Image source={require('../../assets/figma/home-urge-source.svg')} style={styles.urgeIcon} />
              <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.urgeText}>
                I HAVE AN URGE
              </Text>
              <Image source={require('../../assets/figma/home-urge-source.svg')} style={styles.urgeIcon} />
            </Pressable>

            {/* shows the user's quit progress */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.statTitle}>
                  MONEY SAVED
                </Text>
                <Image source={require('../../assets/figma/home-money-source.svg')} style={styles.moneyIcon} />
                <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.money}>
                  <Text style={styles.moneyPrefix}>R</Text>
                  {formatMoney(moneySaved)}
                </Text>
                <Text style={styles.statNote}>*This is an estimate*</Text>
              </View>
              <View style={styles.statCard}>
                <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.statTitle}>
                  SKOP SESSIONS
                </Text>
                <Text style={styles.urgeCount}>{skopSessionCount}</Text>
                <Text style={styles.statNote}>{formatLastSession(lastSessionAt)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* marks home as the active tab */}
        <BottomNav active="home" />
      </View>
    </SafeAreaView>
  );
}

function formatMoney(amount: number) {
  return String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatLastSession(lastSessionAt: string | null) {
  if (!lastSessionAt) return 'No sessions yet';

  const sessionDate = new Date(lastSessionAt);
  const today = new Date();
  const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysAgo = Math.max(0, Math.round((todayStart.getTime() - sessionDay.getTime()) / 86400000));

  if (daysAgo === 0) return 'Last session: Today';
  if (daysAgo === 1) return 'Last session: Yesterday';
  return `Last session: ${daysAgo} days ago`;
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
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: SkopColors.background,
  },
  widePage: {
    maxWidth: 960,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  wideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  streakSection: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  wideStreakSection: {
    flex: 1,
    width: 'auto',
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  streakCard: {
    flex: 1,
    minWidth: 0,
    maxWidth: 120,
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
  compactStreakCard: {
    height: 118,
    paddingVertical: 12,
  },
  streakValue: {
    fontSize: 46,
    lineHeight: 48,
    fontFamily: SkopFonts.bold,
    color: SkopColors.surface,
  },
  compactStreakValue: {
    fontSize: 36,
    lineHeight: 38,
  },
  streakDivider: {
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: SkopColors.ink,
  },
  compactStreakDivider: {
    top: 57,
  },
  streakLabel: {
    fontSize: 20,
    letterSpacing: 0,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
    // letterSpacing: 0.9,
  },
  compactStreakLabel: {
    fontSize: 17,
  },
  caption: {
    marginTop: 16,
    textAlign: 'center',
    color: SkopColors.ink,
    fontSize: 16,
    fontFamily: SkopFonts.medium,
  },
  actionSection: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginTop: 40,
  },
  wideActionSection: {
    flex: 1,
    width: 'auto',
    marginTop: 0,
  },
  urgeButton: {
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
    marginTop: 32,
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
