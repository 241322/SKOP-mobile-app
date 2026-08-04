import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Brand } from '@/components/skop/Brand';
import { SkopButton } from '@/components/skop/SkopButton';
import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';

type AuthScreenProps = {
  mode: 'signup' | 'login';
};

export function AuthScreen({ mode }: AuthScreenProps) {
  // changes the fields and labels for each auth route
  const isSignup = mode === 'signup';

  return (
    <View style={styles.screen}>
      <View style={styles.inner}>
        <Brand />

        {/* holds the social buttons and account fields */}
        <View style={styles.form}>
          <View style={styles.socialRow}>
            <Pressable style={[styles.socialButton, styles.googleButton]}>
              <Text style={styles.googleIcon}>G</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.socialText}>
                GOOGLE
              </Text>
            </Pressable>
            <Pressable style={[styles.socialButton, styles.facebookButton]}>
              <Text style={styles.facebookIcon}>f</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.socialText}>
                FACEBOOK
              </Text>
            </Pressable>
          </View>

          <Field label="EMAIL" placeholder="example@gmail.com" />
          <Field label="PASSWORD" placeholder="Create password here..." secure />
          {/* signup needs the password entered twice */}
          {isSignup && <Field label="PASSWORD" placeholder="Re-enter password here..." secure />}
        </View>

        {/* switches between the login and signup routes */}
        <View style={styles.actions}>
          <SkopButton label={isSignup ? 'CREATE ACCOUNT' : 'LOGIN'} variant="green" />
          <SkopButton
            label={isSignup ? 'Switch to LOGIN' : 'Switch to SIGN-UP'}
            small
            onPress={() => router.push(isSignup ? '/login' : '/signup')}
          />
        </View>
      </View>
    </View>
  );
}

// keeps every text field using the same layout
function Field({ label, placeholder, secure }: { label: string; placeholder: string; secure?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={SkopColors.muted}
          secureTextEntry={secure}
          style={styles.input}
        />
        {/* password fields show the eye icon */}
        {secure && <Ionicons name="eye-outline" size={24} color={SkopColors.ink} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SkopColors.background,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 393,
    paddingHorizontal: 24,
    paddingTop: 88,
    paddingBottom: 60,
    justifyContent: 'space-between',
  },
  form: {
    gap: 22,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  socialButton: {
    height: 54,
    flex: 1,
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: SkopColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...skopShadow,
  },
  googleButton: {
    borderColor: SkopColors.ink,
  },
  facebookButton: {
    borderColor: SkopColors.blue,
  },
  googleIcon: {
    fontSize: 32,
    fontFamily: SkopFonts.bold,
    color: '#4285f4',
  },
  facebookIcon: {
    fontSize: 36,
    fontFamily: SkopFonts.bold,
    color: SkopColors.blue,
  },
  socialText: {
    fontSize: 20,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 20,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  inputWrap: {
    height: 56,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 20,
    backgroundColor: SkopColors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: SkopFonts.body,
    color: SkopColors.ink,
  },
  actions: {
    gap: 20,
  },
});
