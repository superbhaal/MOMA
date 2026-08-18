import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface CounterProposalSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { scheduled_at: string; note: string | null }) => Promise<void> | void;
  /** Title flips between "suggest a time" (no open) and "counter-propose" (replacing one). */
  isCounter?: boolean;
}

// Built per render rather than held as a module constant: the labels are copy,
// and a constant would freeze whichever language was active at import time.
function timeBlocks(t: TFunction) {
  return [
    { label: t('grp.morning'), hours: 10 },
    { label: t('grp.afternoon'), hours: 14 },
    { label: t('grp.evening'), hours: 18 },
  ];
}

/** Sheet to author a fresh proposal OR a counter-proposal (chained via parent_proposal_id by caller). */
export function CounterProposalSheet({
  visible,
  onClose,
  onSubmit,
  isCounter,
}: CounterProposalSheetProps) {
  const { t } = useTranslation();
  const [dayOffset, setDayOffset] = useState(1);
  const [block, setBlock] = useState(timeBlocks(t)[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => i);
  }, []);

  async function handleSubmit() {
    setBusy(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      d.setHours(block.hours, 0, 0, 0);
      await onSubmit({ scheduled_at: d.toISOString(), note: note.trim() || null });
      onClose();
      setNote('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title={isCounter ? "can't make it — suggest another" : 'suggest a time'}
    >
      <Typography variant="label" color={colors.muted} style={styles.label}>
        DAY
      </Typography>
      <View style={styles.daysRow}>
        {days.map((i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const active = i === dayOffset;
          return (
            <Pressable
              key={i}
              onPress={() => setDayOffset(i)}
              style={[styles.dayChip, active && styles.dayChipActive]}
            >
              <Typography
                variant="labelS"
                color={active ? colors.white : colors.muted}
              >
                {d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()}
              </Typography>
              <Typography
                variant="displayS"
                color={active ? colors.white : colors.text}
                style={{ marginTop: 2 }}
              >
                {d.getDate()}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <Typography variant="label" color={colors.muted} style={styles.label}>
            {t('misc.timeOfDay')}
      </Typography>
      <View style={styles.blocksRow}>
        {timeBlocks(t).map((b) => {
          const active = b.label === block.label;
          return (
            <Pressable
              key={b.label}
              onPress={() => setBlock(b)}
              style={[styles.blockChip, active && styles.blockChipActive]}
            >
              <Typography variant="labelS" color={active ? colors.white : colors.cobalt}>
                {b.label.toUpperCase()}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <Typography variant="label" color={colors.muted} style={styles.label}>
        NOTE
      </Typography>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('grp.optionalNote')}
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
      />

      <View style={{ marginTop: spacing.lg }}>
        <Button
          title={busy ? t('grp.sending') : t('grp.postProposal')}
          onPress={handleSubmit}
          size="lg"
          disabled={busy}
        />
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dayChip: {
    width: 48,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.cobalt },
  blocksRow: { flexDirection: 'row', gap: spacing.sm },
  blockChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cream,
    alignItems: 'center',
  },
  blockChipActive: { backgroundColor: colors.cobalt },
  input: {
    minHeight: 60,
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
