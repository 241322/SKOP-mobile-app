import { Image, StyleSheet } from 'react-native';

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact }: BrandProps) {
  if (compact) {
    return (
      <Image
        accessibilityLabel="SKOP kick the urge"
        resizeMode="contain"
        source={require('../../assets/images/SKOP-WordLogo-NoBackground.png')}
        style={styles.compactImage}
      />
    );
  }

  return (
    <Image
      accessibilityLabel="SKOP kick the urge"
      resizeMode="contain"
      source={require('../../assets/images/SKOP-WordLogo-withSlogan-NoBackground.png')}
      style={styles.fullImage}
    />
  );
}

const styles = StyleSheet.create({
  compactImage: {
    width: 116,
    height: 40,
  },
  fullImage: {
    width: 280,
    height: 124,
  },
});
