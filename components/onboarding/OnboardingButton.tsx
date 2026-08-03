import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * The quiz's Continue pill on the v11 white ground: cobalt fill once the step
 * can be answered, a pale block with muted letterspaced caps until then — so
 * it reads as "not yet" rather than as a faded copy of itself.
 * Ref: design/moma-v11.html · #screen-onboard (Refined skin).
 */
export function OnboardingButton({ title, onPress, disabled, style }: OnboardingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.9 },
        style,
      ]}
    >
      <Typography style={[styles.label, disabled && styles.labelDisabled]}>
        {title.toUpperCase()}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    backgroundColor: colors.cobalt,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: '#F4F3F1',
  },
  label: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(12),
    letterSpacing: 2.4,
    color: colors.white,
  },
  labelDisabled: {
    color: colors.muted,
  },
});
