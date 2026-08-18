import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { categoryChips } from '@/constants/discover';
import type { LovedKind, LovedCategory } from '@/types';

interface ExploreCategoryChipsProps {
  kind: LovedKind;
  value: LovedCategory | 'all';
  onChange: (value: LovedCategory | 'all') => void;
}

/**
 * Horizontally-scrollable category chips, scoped to the active mode — switching
 * Places↔People swaps the whole row. Active = ink fill / white text.
 */
export function ExploreCategoryChips({ kind, value, onChange }: ExploreCategoryChipsProps) {
  const { t } = useTranslation();
  const chips = categoryChips(kind, t);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {chips.map((c) => {
        const on = c.value === value;
        return (
          <Pressable
            key={c.value}
            onPress={() => onChange(c.value)}
            style={[styles.chip, on && styles.chipActive]}
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Typography style={styles.label} color={on ? colors.white : colors.labelMuted}>
              {c.label}
            </Typography>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, backgroundColor: colors.white },
  row: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  label: textStyles.control,
});
