import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkopColors, SkopFonts } from '@/constants/skop-theme';

const notices = [
  {
    title: 'DATA SKOP SAVES',
    body: 'SKOP saves your account email, age group, nicotine product, quit plan, spending baseline, spending check-ins, SKOP session history and game scores. For teen accounts, SKOP also saves the guardian relationship, consent time, consent version and protected PIN data. Full birth dates and the guardian name are not saved.',
  },
  {
    title: 'WHY THE DATA IS NEEDED',
    body: 'This information provides your streak, spending estimates, check-in comparisons, session insights, reminders and support wording. SKOP does not use this information for advertising or sell it to data brokers.',
  },
  {
    title: 'FIREBASE AND YOUR DEVICE',
    body: 'SKOP uses Firebase Authentication and Cloud Firestore to create your account and sync your profile between devices. Some data is also kept on your device so the app can continue working when the connection drops.',
  },
  {
    title: 'AGE AND GUARDIAN CONSENT',
    body: 'SKOP stores an age group rather than a full birth date. Accounts for users aged 13 to 17 require a guardian attestation. This records a statement and does not verify the guardian\'s identity. Users under 13 cannot create an account and can access support and Breakout without saved quit data.',
  },
  {
    title: 'YOUR CHOICES',
    body: 'You can change your quit plan, turn reminders off, log out or delete your account in Settings. Deleting your account removes the profile, check-ins and session records held for that account. Records may remain for a short period in service backups where required for system recovery or law.',
  },
  {
    title: 'HEALTH NOTICE',
    body: 'SKOP provides general education, planning and behavioural support. It does not provide medical advice, diagnosis, treatment or emergency care. Speak to a doctor or pharmacist before making medical or medication decisions, and seek urgent help from local emergency services when needed.',
  },
  {
    title: 'ESTIMATES',
    body: 'Money saved, spending comparisons and streak information depend on the details you enter. They are estimates and may be incomplete or inaccurate. Spending does not measure nicotine use.',
  },
  {
    title: 'YOUR LEGAL RIGHTS',
    body: 'Nothing in this notice excludes or limits any right, remedy, protection or liability that cannot lawfully be excluded or limited under applicable law.',
  },
];

export default function LegalScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={SkopColors.ink} name="arrow-back" size={28} />
        </Pressable>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.headerTitle}>DATA & HEALTH NOTICE</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          This summary explains the current SKOP app behaviour. A published privacy policy and terms of
          service will provide the full legal notice before store release.
        </Text>
        {notices.map((notice) => (
          <View key={notice.title} style={styles.notice}>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeBody}>{notice.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  header: {
    minHeight: 76,
    borderBottomWidth: 2,
    borderBottomColor: SkopColors.ink,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 25, textAlign: 'center' },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 22,
  },
  intro: { color: SkopColors.ink, fontFamily: SkopFonts.body, fontSize: 16, lineHeight: 23 },
  notice: {
    borderTopWidth: 2,
    borderTopColor: SkopColors.ink,
    paddingTop: 16,
    gap: 8,
  },
  noticeTitle: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 19 },
  noticeBody: { color: SkopColors.ink, fontFamily: SkopFonts.body, fontSize: 16, lineHeight: 24 },
});
