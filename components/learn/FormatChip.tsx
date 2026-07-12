import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

export type FormatFilter = 'all' | 'learnArticle' | 'learnReel' | 'learnRecommendation';

interface FormatChipProps {
  value: FormatFilter;
  active: boolean;
  onPress: () => void;
}

const LABELS: Record<FormatFilter, string> = {
  all: 'all',
  learnArticle: 'read',
  learnReel: 'watch',
  learnRecommendation: 'recco',
};

export function FormatChip({ value, active, onPress }: FormatChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.active]}
    >
      <Typography
        variant="labelS"
        color={active ? colors.white : colors.muted}
      >
        {LABELS[value].toUpperCase()}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  active: {
    backgroundColor: colors.pool,
  },
});
