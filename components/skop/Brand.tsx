import { Image, StyleSheet, Text, View } from 'react-native';

import { SkopColors, SkopFonts } from '@/constants/skop-theme';

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact }: BrandProps) {
  if (compact) {
    return (
      <Image
        accessibilityLabel="SKOP kick the urge"
        resizeMode="contain"
        source={require('../../assets/images/icon.png')}
        style={styles.compactImage}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      {/* each letter uses one skop brand colour */}
      <Text style={styles.title}>
        <Text style={{ color: SkopColors.yellow }}>S</Text>
        <Text style={{ color: SkopColors.pink }}>K</Text>
        <Text style={{ color: SkopColors.blue }}>O</Text>
        <Text style={{ color: SkopColors.green }}>P</Text>
      </Text>
      <Text style={styles.tagline}>kick the urge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  compactImage: {
    width: 76,
    height: 76,
  },
  title: {
    fontSize: 84,
    lineHeight: 86,
    fontFamily: SkopFonts.bold,
    textShadowColor: SkopColors.ink,
    textShadowOffset: { width: 0, height: 4 },
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
