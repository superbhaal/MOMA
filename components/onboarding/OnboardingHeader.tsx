import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface OnboardingHeaderProps {
  /** 1-based step number. */
  current: number;
  /** Total number of quiz steps. Defaults to 4 (First baby + Baby DOB + Languages + Colour). */
  total?: number;
  /** Tap handler for the "Skip" link. Hide the link by omitting. */
  onSkip?: () => void;
}

/**
 * v11 quiz header on the white ground: serif "STEP X OF 4", a quiet Skip link
 * and one thin rule that fills in cobalt as the quiz advances — the segmented
 * bar of the cobalt-ground design is gone.
 * Ref: design/moma-v11.html · #screen-onboard (Refined skin).
 */
export function OnboardingHeader({ current, total = 4, onSkip }: OnboardingHeaderProps) {
  const insets = useSafeAreaInsets();
  const progress = Math.min(1, Math.max(0, current / total));
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Typography style={styles.step}>
          STEP {current} OF {total}
        </Typography>
        {onSkip ? (
          <Pressable onPress={onSkip} hitSlop={10}>
            <Typography style={styles.skip}>SKIP</Typography>
          </Pressable>
        ) : null}
        <View style={styles.bar}>
          <View style={[styles.barFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 26,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  step: {
    fontFamily: fonts.serifReg,
    fontSize: scaled(13),
    letterSpacing: 2.4,
    color: colors.text,
  },
  skip: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 1.6,
    color: colors.muted,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: colors.cobalt,
    borderRadius: 2,
  },
});
