import { StyleSheet, Text, View } from 'react-native';

import { SkopColors, SkopFonts } from '@/constants/skop-theme';

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact }: BrandProps) {
  return (
    <View style={compact ? styles.compactWrap : styles.wrap}>
      <Text style={compact ? styles.compactTitle : styles.title}>
        <Text style={{ color: SkopColors.yellow }}>S</Text>
        <Text style={{ color: SkopColors.pink }}>K</Text>
        <Text style={{ color: SkopColors.blue }}>O</Text>
        <Text style={{ color: SkopColors.green }}>P</Text>
      </Text>
      {!compact && <Text style={styles.tagline}>kick the urge</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  compactWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: SkopColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SkopColors.surface,
  },
  title: {
    fontSize: 84,
    lineHeight: 86,
    fontFamily: SkopFonts.bold,
    textShadowColor: SkopColors.ink,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  compactTitle: {
    fontSize: 24,
    fontFamily: SkopFonts.bold,
    textShadowColor: SkopColors.ink,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  tagline: {
    marginTop: -10,
    fontSize: 36,
    lineHeight: 40,
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
    textTransform: 'lowercase',
  },
});
