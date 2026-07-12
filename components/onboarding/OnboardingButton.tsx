import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * White-fill button with cobalt text — the .ob-btn used at the bottom of
 * every cobalt-bg onboarding screen per design/moma-enhanced.html.
 */
export function OnboardingButton({ title, onPress, disabled, style }: OnboardingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}
    >
      <Typography variant="label" color={colors.cobalt}>
        {title.toUpperCase()}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.22,
  },
});
