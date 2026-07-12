import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { AVAILABILITY_TIME_BLOCKS, EMPTY_AVAILABILITY } from '@/constants/onboarding';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { RecurringAvailability } from '@/types';

interface Props {
  value: RecurringAvailability | null;
  onChange: (next: RecurringAvailability) => void;
}

type CellKey = keyof RecurringAvailability;

const ROWS: { dayType: 'weekday' | 'weekend'; label: string }[] = [
  { dayType: 'weekday', label: 'Weekdays' },
  { dayType: 'weekend', label: 'Weekends' },
];

/**
 * 2×3 matrix: Weekdays/Weekends × Morning/Afternoon/Evening.
 * Used in onboarding Q2 (`/q2`). Designed for the cobalt onboarding screen.
 */
export function AvailabilityMatrix({ value, onChange }: Props) {
  const matrix = value ?? EMPTY_AVAILABILITY;

  function toggle(key: CellKey) {
    onChange({ ...matrix, [key]: !matrix[key] });
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.rowLabel} />
        {AVAILABILITY_TIME_BLOCKS.map((b) => (
          <Typography
            key={b.key}
            variant="labelS"
            color="rgba(255,255,255,0.6)"
            style={styles.colHeader}
          >
            {b.label}
          </Typography>
        ))}
      </View>

      {ROWS.map((row) => (
        <View key={row.dayType} style={styles.row}>
          <Typography
            variant="bodyM"
            color="rgba(255,255,255,0.85)"
            style={styles.rowLabel}
          >
            {row.label}
          </Typography>
          {AVAILABILITY_TIME_BLOCKS.map((b) => {
            const key = `${row.dayType}_${b.key}` as CellKey;
            const selected = matrix[key];
            const range = row.dayType === 'weekday' ? b.weekdayRange : b.weekendRange;
            return (
              <Pressable
                key={b.key}
                onPress={() => toggle(key)}
                style={[styles.cell, selected && styles.cellSelected]}
              >
                <Typography
                  variant="bodyM"
                  color={selected ? colors.cobalt : 'rgba(255,255,255,0.85)'}
                  style={{ fontWeight: '600' }}
                >
                  {range}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rowLabel: {
    width: 84,
    paddingRight: spacing.sm,
  },
  colHeader: {
    flex: 1,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cellSelected: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
});
