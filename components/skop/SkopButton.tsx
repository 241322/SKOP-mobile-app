import { Pressable, StyleSheet, Text } from 'react-native';

import { SkopColors, SkopFonts, skopShadow } from '@/constants/skop-theme';

type SkopButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'surface' | 'yellow' | 'blue' | 'green' | 'pink';
  small?: boolean;
};

const variantColor = {
  surface: SkopColors.surface,
  yellow: SkopColors.yellow,
  blue: SkopColors.blue,
  green: SkopColors.green,
  pink: SkopColors.pink,
};

export function SkopButton({ label, onPress, variant = 'surface', small }: SkopButtonProps) {
  const isFilled = variant === 'blue' || variant === 'green' || variant === 'pink';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small ? styles.smallButton : styles.bigButton,
        { backgroundColor: variantColor[variant] },
        pressed && styles.pressed,
      ]}>
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={1}
        style={[styles.label, small ? styles.smallLabel : styles.bigLabel, isFilled && styles.lightLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderColor: SkopColors.ink,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...skopShadow,
  },
  bigButton: {
    height: 82,
    flex: 1,
  },
  smallButton: {
    height: 40,
    width: '100%',
  },
  pressed: {
    transform: [{ translateY: 3 }],
    boxShadow: `0px 3px 0px 0px ${SkopColors.shadow}`,
  },
  label: {
    fontFamily: SkopFonts.bold,
    color: SkopColors.ink,
    textAlign: 'center',
  },
  bigLabel: {
    fontSize: 28,
  },
  smallLabel: {
    fontSize: 14,
  },
  lightLabel: {
    color: '#ffffff',
  },
});
