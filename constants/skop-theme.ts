import type { ViewStyle } from 'react-native';

// keeps the brand colours in one place
export const SkopColors = {
  background: '#fff3d6',
  surface: '#fbf6e9',
  ink: '#211712',
  shadow: '#15110f',
  yellow: '#fbad34',
  pink: '#ff4f7b',
  blue: '#286cf0',
  green: '#00a651',
  muted: 'rgba(33, 23, 18, 0.55)',
};

// gives each font role one name
export const SkopFonts = {
  body: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_800ExtraBold',
  score: 'BitcountGridDouble_400Regular',
  scoreAlt: 'BitcountGridSingle_400Regular',
};

// gives buttons and cards the same hard shadow
export const skopShadow: ViewStyle = {
  boxShadow: `0px 6px 0px 0px ${SkopColors.shadow}`,
};
