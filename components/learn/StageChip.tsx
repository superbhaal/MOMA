import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface StageChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/** Used for filtering the Learn feed by baby_stage. Active = lime per design. */
export function StageChip({ label, active, onPress }: StageChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Typography
        variant="labelS"
        color={active ? colors.text : colors.muted}
      >
        {label.toUpperCase()}
      </Typography>
    </Pressable>
  );
}

export const STAGE_FILTERS = [
  'all',
  'T1',
  'T2',
  'T3',
  '0-4wks',
  '1-3mo',
  '3-6mo',
  '6-12mo',
  '1-2yr',
  '2-3yr',
  '3+yr',
] as const;

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  active: {
    backgroundColor: colors.lime,
  },
});
