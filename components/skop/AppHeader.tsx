import { Href, router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SkopColors, SkopFonts } from '@/constants/skop-theme';

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
      <View style={styles.header}>
      <View style={styles.logoWrap}>
        <Image source={require('../../assets/figma/home-logo-shadow.png')} style={styles.logoShadow} />
        <Image source={require('../../assets/figma/home-logo.png')} style={styles.logo} contentFit="cover" />
      </View>
      <View style={styles.titleRow}>
        <Text adjustsFontSizeToFit minimumFontScale={0.8} numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.divider} />
        <Pressable
          accessibilityLabel="Open settings"
          hitSlop={10}
          onPress={() => router.push('/settings' as Href)}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
          <Image source={require('../../assets/figma/home-settings-source.svg')} style={styles.settingsIcon} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 110,
    paddingHorizontal: 24,
    paddingTop: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SkopColors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 25,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  divider: {
    width: 2,
    height: 47,
    backgroundColor: SkopColors.ink,
  },
  logoWrap: {
    width: 80,
    height: 80,
  },
  logoShadow: {
    position: 'absolute',
    width: 80,
    height: 80,
    opacity: 0.2,
  },
  logo: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 74,
    height: 74,
  },
  settingsButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 32,
    height: 37,
  },
  pressed: {
    opacity: 0.65,
  },
});
