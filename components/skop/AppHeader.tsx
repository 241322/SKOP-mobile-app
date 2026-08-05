import { Href, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SkopColors, SkopFonts } from '@/constants/skop-theme';

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  // landscape and narrow phones use a shorter header so the title still fits
  const { height, width } = useWindowDimensions();
  const compact = width > height || height < 600 || width < 400;

  return (
    <BlurView
      intensity={60}
      tint="light"
      style={[styles.header, compact && styles.compactHeader]}>
      {/* keeps the blur tinted with the skop background colour */}
      <View pointerEvents="none" style={styles.chromeBackground} />
      {/* stacks the logo over its shadow image */}
      <View style={[styles.logoWrap, compact && styles.compactLogoWrap]}>
        <Image
          source={require('../../assets/figma/home-logo-shadow.png')}
          style={[styles.logoShadow, compact && styles.compactLogoShadow]}
        />
        <Image
          source={require('../../assets/figma/home-logo.png')}
          style={[styles.logo, compact && styles.compactLogo]}
          contentFit="cover"
        />
      </View>
      {/* keeps the screen title and settings action together */}
      <View style={styles.titleRow}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          numberOfLines={1}
          style={[styles.title, compact && styles.compactTitle]}>
          {title}
        </Text>
        <View style={styles.divider} />
        {/* opens settings without showing a stack header */}
        <Pressable
          accessibilityLabel="Open settings"
          hitSlop={10}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/settings' as Href);
          }}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
          <Image source={require('../../assets/figma/home-settings-source.svg')} style={styles.settingsIcon} />
        </Pressable>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 96,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SkopColors.chrome,
  },
  compactHeader: {
    height: 70,
    paddingHorizontal: 20,
  },
  chromeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SkopColors.chrome,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginLeft: 16,
  },
  title: {
    flexShrink: 1,
    fontSize: 25,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
  },
  compactTitle: {
    fontSize: 21,
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
  compactLogoWrap: {
    width: 56,
    height: 56,
  },
  logoShadow: {
    position: 'absolute',
    width: 80,
    height: 80,
    opacity: 0.2,
  },
  compactLogoShadow: {
    width: 56,
    height: 56,
  },
  logo: {
    position: 'absolute',
    left: 3,
    top: 3,
    width: 74,
    height: 74,
  },
  compactLogo: {
    left: 2,
    top: 2,
    width: 52,
    height: 52,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 44,
    height: 44,
  },
  pressed: {
    transform: [{ translateY: 3 }],
  },
});
