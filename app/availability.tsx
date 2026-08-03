import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { useAvailability } from '@/hooks/useAvailability';
import type { AvailabilityBlock } from '@/types';

const BLOCKS: { value: AvailabilityBlock; label: string }[] = [
  { value: 'morning', label: 'AM' },
  { value: 'afternoon', label: 'PM' },
  { value: 'evening', label: 'EVE' },
];

export default function AvailabilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slots, isBusy, toggleBusy } = useAvailability(14);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const blockedCount = slots.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
        <Typography variant="displayS" color={colors.text}>
          when you can&rsquo;t
        </Typography>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Typography variant="bodyL" color={colors.muted} style={styles.intro}>
          tap anything you already know you can&rsquo;t make. everything you leave
          untouched counts as free, so m&oslash;ma only proposes times that work.
        </Typography>

        <View style={styles.gridHeader}>
          <View style={{ width: 56 }} />
          {BLOCKS.map((b) => (
            <View key={b.value} style={styles.blockHeader}>
              <Typography variant="labelS" color={colors.muted}>
                {b.label}
              </Typography>
            </View>
          ))}
        </View>

        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          return (
            <View key={iso} style={styles.row}>
              <View style={styles.dayLabel}>
                <Typography variant="labelS" color={colors.muted}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </Typography>
                <Typography variant="displayS" color={colors.text}>
                  {d.getDate()}
                </Typography>
              </View>
              {BLOCKS.map((b) => {
                const busy = isBusy(iso, b.value);
                return (
                  <Pressable
                    key={b.value}
                    onPress={() => toggleBusy(iso, b.value)}
                    style={[styles.cell, busy && styles.cellBusy]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: busy }}
                    accessibilityLabel={`${b.label} — ${busy ? 'blocked' : 'free'}`}
                  >
                    {busy ? (
                      <Ionicons name="close" size={18} color={colors.cherry} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Typography variant="bodyM" color={colors.muted} style={{ flex: 1 }}>
          {blockedCount === 0
            ? 'all free so far'
            : `${blockedCount} slot${blockedCount === 1 ? '' : 's'} blocked`}
        </Typography>
        <Button title="done" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  intro: { marginBottom: spacing.lg },
  gridHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  blockHeader: {
    flex: 1,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayLabel: { width: 56 },
  cell: {
    flex: 1,
    height: 40,
    marginHorizontal: 4,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Blocked out reads as a warm red, in the blush family the app already uses
  // for meetups — a struck-through slot, not an alarm.
  cellBusy: {
    backgroundColor: colors.blush,
    borderWidth: 1,
    borderColor: colors.cherry,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: spacing.md,
  },
});
