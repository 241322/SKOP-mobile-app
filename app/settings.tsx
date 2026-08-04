import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkopButton } from '@/components/skop/SkopButton';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';
import { useSkopSession } from '@/context/skop-session';

export default function SettingsScreen() {
  const { resetStreak } = useSkopSession();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const confirmReset = () => {
    resetStreak();
    setConfirmingReset(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>SETTINGS</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>YOUR QUIT PLAN</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Daily spend</Text>
          <Text style={styles.rowValue}>R80</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Session goal</Text>
          <Text style={styles.rowValue}>3 minutes</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => setConfirmingReset(true)} style={styles.resetLink}>
        <Text style={styles.resetText}>I smoked since my quit date</Text>
      </Pressable>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  header: {
    height: 84,
    borderBottomWidth: 2,
    borderColor: SkopColors.ink,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 42, lineHeight: 42 },
  title: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 27 },
  content: { padding: 24, gap: 14 },
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
  resetLink: { position: 'absolute', bottom: 35, alignSelf: 'center', padding: 12 },
  resetText: { color: SkopColors.muted, fontFamily: SkopFonts.body, fontSize: 13, textDecorationLine: 'underline' },
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
