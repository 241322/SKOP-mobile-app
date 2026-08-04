import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SkopButton } from '@/components/skop/SkopButton';
import { SkopColors } from '@/constants/skop-theme';

type BottomNavProps = {
  active: 'home' | 'insights';
};

export function BottomNav({ active }: BottomNavProps) {
  return (
    <View style={styles.nav}>
      <SkopButton
        label="HOME"
        variant={active === 'home' ? 'yellow' : 'surface'}
        onPress={() => router.replace('/')}
      />
      <SkopButton
        label="INSIGHTS"
        variant={active === 'insights' ? 'blue' : 'surface'}
        onPress={() => router.replace('/explore')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 136,
    paddingTop: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 24,
    borderTopWidth: 2,
    borderColor: SkopColors.ink,
    backgroundColor: SkopColors.background,
  },
});
