import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { spacing } from '@/constants/spacing';

interface OnboardingHeaderProps {
  /** 1-based step number. */
  current: number;
  /** Total number of quiz steps. Defaults to 4 (First baby + Baby DOB + Languages + Colour). */
  total?: number;
  /** Tap handler for the "Skip" link. Hide the link by omitting. */
  onSkip?: () => void;
}

/**
 * Cobalt-bg onboarding header: "STEP X OF 4" + Skip + segmented progress bar.
 * The auto-saved hint is rendered separately at the bottom of the screen via
 * OnboardingSaveHint — see standalone .ob-save-hint (absolute bottom 12px).
 */
export function OnboardingHeader({ current, total = 4, onSkip }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Typography variant="labelS" style={styles.step}>
          STEP {current} OF {total}
        </Typography>
        {onSkip ? (
          <Pressable onPress={onSkip} hitSlop={10}>
            <Typography variant="labelS" style={styles.skip}>
              Skip
            </Typography>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.bar}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.seg,
              i < current - 1 && styles.segDone,
              i === current - 1 && styles.segCur,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  step: {
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 2,
  },
  skip: {
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 0,
    textTransform: 'none',
    fontSize: 13,
  },
  bar: {
    flexDirection: 'row',
    gap: 4,
  },
  seg: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  segCur: {
    backgroundColor: 'rgba(255,255,255,0.50)',
  },
  segDone: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
