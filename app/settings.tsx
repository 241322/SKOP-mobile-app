import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkopButton } from '@/components/skop/SkopButton';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { useAuth } from '@/context/auth';
import { useSkopSession } from '@/context/skop-session';
import { getAuthErrorMessage } from '@/lib/auth-error';

export default function SettingsScreen() {
  const { quitPlan, resetStreak } = useSkopSession();
  const { logOut } = useAuth();

  // controls whether the reset warning is open
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  // settings use columns when the screen has room for them
  const { height, width } = useWindowDimensions();
  const wideLayout = width >= 700 || width > height;
  const compact = height < 600;

  // clears the streak and returns home
  const confirmReset = () => {
    resetStreak();
    setConfirmingReset(false);
    router.replace('/');
  };

  // firebase clears the saved user and the route guard opens login
  const handleLogout = async () => {
    setLogoutError('');
    setLoggingOut(true);

    try {
      await logOut();
    } catch (error) {
      setLogoutError(getAuthErrorMessage(error));
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.page}>
        <View style={[styles.header, compact && styles.compactHeader]}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={SkopColors.ink} />
          </Pressable>
          <Text style={styles.title}>SETTINGS</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.body, wideLayout && styles.wideBody]}>
          <View style={[styles.content, wideLayout && styles.wideSection]}>
            {/* these values will come from the user's quit plan */}
            <Text style={styles.sectionTitle}>YOUR QUIT PLAN</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Quit date</Text>
              <Text style={styles.rowValue}>{formatQuitDate(quitPlan?.quitDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{formatSpendPeriod(quitPlan?.spendPeriod)} spend</Text>
              <Text style={styles.rowValue}>R{quitPlan?.spendAmount ?? 0}</Text>
            </View>
          </View>

          {/* keeps account actions away from the quit plan */}
          <View style={[styles.footer, wideLayout && styles.wideFooter]}>
            <Pressable accessibilityRole="button" onPress={() => setConfirmingReset(true)} style={styles.resetLink}>
              <Text style={styles.resetText}>I smoked since my quit date</Text>
            </Pressable>

            {!!logoutError && (
              <Text accessibilityLiveRegion="polite" style={styles.logoutError}>
                {logoutError}
              </Text>
            )}

            {/* signs the user out of firebase */}
            <Pressable
              accessibilityRole="button"
              disabled={loggingOut}
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
                loggingOut && styles.logoutButtonDisabled,
              ]}>
              <Text style={styles.logoutText}>{loggingOut ? 'LOGGING OUT...' : 'LOG OUT'}</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* asks for confirmation before changing the streak */}
        {confirmingReset && (
          <View style={styles.overlay}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>RESET YOUR STREAK?</Text>
              <Text style={styles.dialogBody}>This starts your smoke-free time from today.</Text>
              <View style={styles.actions}>
                <SkopButton label="GO BACK" small onPress={() => setConfirmingReset(false)} />
                <SkopButton label="RESET" variant="pink" small onPress={confirmReset} />
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function formatSpendPeriod(period?: string) {
  if (!period) return 'Daily';
  return `${period.charAt(0).toUpperCase()}${period.slice(1)}`;
}

function formatQuitDate(value?: string) {
  if (!value) return 'Not set';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: SkopColors.background,
  },
  header: {
    height: 84,
    borderBottomWidth: 2,
    borderColor: SkopColors.ink,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeader: { height: 64 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 27 },
  body: {
    flexGrow: 1,
    padding: 24,
  },
  wideBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: 14,
  },
  wideSection: {
    flex: 1,
    width: 'auto',
  },
  sectionTitle: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 20, marginBottom: 6 },
  row: {
    height: 58,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { color: SkopColors.ink, fontFamily: SkopFonts.medium, fontSize: 17 },
  rowValue: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 17 },
  footer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 'auto',
    paddingTop: 32,
  },
  wideFooter: {
    flex: 1,
    width: 'auto',
    maxWidth: 360,
    marginTop: 0,
    paddingTop: 0,
  },
  resetLink: { padding: 12 },
  resetText: { color: SkopColors.muted, fontFamily: SkopFonts.body, fontSize: 13, textDecorationLine: 'underline' },
  logoutButton: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: '#d92d20',
    ...skopShadow,
  },
  logoutButtonPressed: {
    transform: [{ translateY: 3 }],
    boxShadow: `0px 3px 0px 0px ${SkopColors.shadow}`,
  },
  logoutButtonDisabled: {
    opacity: 0.55,
  },
  logoutText: {
    color: '#ffffff',
    fontFamily: SkopFonts.bold,
    fontSize: 18,
  },
  logoutError: {
    color: '#b42318',
    fontFamily: SkopFonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33,23,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: 340,
    maxWidth: '86%',
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 8,
    backgroundColor: SkopColors.background,
    padding: 22,
    ...skopShadow,
  },
  dialogTitle: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 23, textAlign: 'center' },
  dialogBody: { color: SkopColors.ink, fontFamily: SkopFonts.body, fontSize: 16, marginTop: 8, textAlign: 'center' },
  actions: { gap: 12, marginTop: 22 },
});
