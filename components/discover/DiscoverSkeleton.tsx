import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

/**
 * Loading placeholders that match card geometry, so first paint never shows a
 * centred spinner. A gentle opacity pulse stands in for a shimmer.
 */
export function DiscoverSkeleton({ count = 3 }: { count?: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={[styles.block, styles.meta]} />
          <View style={[styles.block, styles.title]} />
          <View style={[styles.block, styles.line]} />
          <View style={[styles.block, styles.pill]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    marginHorizontal: spacing.xl,
    gap: spacing.md,
  },
  block: { backgroundColor: colors.line, borderRadius: radius.sm },
  meta: { width: 96, height: 11 },
  title: { width: '80%', height: 22 },
  line: { width: '100%', height: 14 },
  pill: { width: 120, height: 24, borderRadius: radius.pill },
});
