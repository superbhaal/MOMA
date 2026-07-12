import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface PrefsPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/** Selectable pill used across the prefs/availability screens. */
export function PrefsPill({ label, active, onPress }: PrefsPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.active]}
    >
      <Typography
        variant="bodyL"
        color={active ? colors.white : colors.text}
        style={active ? { fontWeight: '600' } : undefined}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  active: {
    backgroundColor: colors.cobalt,
  },
});
