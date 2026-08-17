import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/components/skop/Brand';
import { SkopButton } from '@/components/skop/SkopButton';
import { QuitSupportContact } from '@/components/skop/QuitSupportContact';
import { SkopColors, SkopFonts } from '@/constants/skop-theme';

export default function YouthSupportScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Brand compact />
        <View style={styles.copy}>
          <Text style={styles.title}>YOU DO NOT HAVE TO HANDLE THIS ALONE</Text>
          <Text style={styles.body}>
            Speak to a parent, guardian, doctor, pharmacist or another adult you trust. They can help you
            find support that fits your age.
          </Text>
          <Text style={styles.body}>
            You can still use Breakout when you need a moment away from a craving. No account or quit data
            will be saved.
          </Text>
          <QuitSupportContact />
        </View>
        <View style={styles.actions}>
          <SkopButton label="PLAY BREAKOUT" onPress={() => router.push('/urge')} variant="green" />
          <SkopButton label="BACK" onPress={() => router.replace('/welcome')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SkopColors.background },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    padding: 24,
    justifyContent: 'space-between',
    gap: 36,
  },
  copy: { gap: 20 },
  title: { color: SkopColors.ink, fontFamily: SkopFonts.bold, fontSize: 32, textAlign: 'center' },
  body: { color: SkopColors.ink, fontFamily: SkopFonts.body, fontSize: 18, lineHeight: 27, textAlign: 'center' },
  actions: { gap: 16 },
});
