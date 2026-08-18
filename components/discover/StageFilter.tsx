import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

// Stage value === Sanity `babyStage` code so it filters content directly.
// 'all' clears the filter.
export interface StageOption {
  value: string;
  label: string;
  sub?: string;
}
interface StageGroup {
  group: string;
  rows: StageOption[];
}

// Built from `t`: these are labels, and a module constant would freeze the
// language chosen at import.
function allOption(t: TFunction): StageOption {
  return { value: 'all', label: t('dis.allStages'), sub: t('dis.everything') };
}

function groups(t: TFunction): StageGroup[] {
  return [
    {
      group: t('dis.pregnancy'),
      rows: [
        { value: 'T1', label: t('dis.t1'), sub: t('dis.t1sub') },
        { value: 'T2', label: t('dis.t2'), sub: t('dis.t2sub') },
        { value: 'T3', label: t('dis.t3'), sub: t('dis.t3sub') },
      ],
    },
    {
      group: t('dis.baby'),
      rows: [
        { value: '0-4wks', label: t('dis.newborn'), sub: t('dis.newbornSub') },
        { value: '1-3mo', label: t('dis.m13') },
        { value: '3-6mo', label: t('dis.m36') },
        { value: '6-12mo', label: t('dis.m612') },
      ],
    },
    {
      group: t('dis.toddler'),
      rows: [
        { value: '1-2yr', label: t('dis.y12') },
        { value: '2-3yr', label: t('dis.y23') },
        { value: '3+yr', label: t('dis.y3') },
      ],
    },
    // The one entry on this axis that isn't an age. See the note on
    // STAGE_CHIP_GROUPS in constants/discover.
    {
      group: t('dis.forYou'),
      rows: [{ value: 'wellness', label: t('dis.wellness'), sub: t('dis.wellnessSub') }],
    },
  ];
}

function labelByValue(t: TFunction): Record<string, string> {
  return [allOption(t), ...groups(t).flatMap((g) => g.rows)].reduce(
    (acc, o) => ({ ...acc, [o.value]: o.label }),
    {},
  );
}

interface StageFilterProps {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Funnel row + grouped picker sheet. Shows the current stage; tapping opens the
 *  sheet. Filters Learn & Watch to match (handoff §3). */
export function StageFilter({ value, onChange, open, onOpenChange }: StageFilterProps) {
  const { t } = useTranslation();
  return (
    <>
      <Pressable style={styles.row} onPress={() => onOpenChange(true)}>
        <Ionicons name="funnel-outline" size={16} color={colors.muted} />
        <Typography style={styles.rowLabel} color={colors.muted}>
          STAGE
        </Typography>
        <Typography style={styles.rowValue} color={colors.text}>
          {labelByValue(t)[value] ?? t('dis.allStages')}
        </Typography>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <ActionSheet visible={open} onClose={() => onOpenChange(false)} title={t('dis.showMeFor')}>
        <Typography style={styles.sheetSub} color={colors.muted}>
          {t('dis.filterNote')}
        </Typography>
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Row option={allOption(t)} active={value === allOption(t).value} onPress={() => pick(allOption(t).value)} />
          {groups(t).map((g) => (
            <View key={g.group}>
              <Typography style={styles.groupLabel} color={colors.muted}>
                {g.group.toUpperCase()}
              </Typography>
              {g.rows.map((o) => (
                <Row key={o.value} option={o} active={value === o.value} onPress={() => pick(o.value)} />
              ))}
            </View>
          ))}
        </ScrollView>
      </ActionSheet>
    </>
  );

  function pick(v: string) {
    onChange(v);
    onOpenChange(false);
  }
}

function Row({ option, active, onPress }: { option: StageOption; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.optRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Typography style={styles.optLabel} color={active ? colors.cobalt : colors.text}>
          {option.label}
        </Typography>
        {option.sub ? (
          <Typography style={styles.optSub} color={colors.muted}>
            {option.sub}
          </Typography>
        ) : null}
      </View>
      {active ? <Ionicons name="checkmark" size={18} color={colors.cobalt} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  // Same rank as the sub-tab chips above it — the muted colour and the
  // letter-spacing say "label", so the size doesn't have to.
  rowLabel: { ...textStyles.controlStrong, letterSpacing: 0.84 },
  rowValue: textStyles.controlStrong,
  sheetSub: { fontFamily: fonts.body, fontSize: scaled(13), lineHeight: scaled(20), marginBottom: spacing.sm },
  sheetScroll: { maxHeight: 380 },
  groupLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(11),
    letterSpacing: 0.88,
    marginTop: spacing.md,
    marginBottom: 2,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },
  optSub: { fontFamily: fonts.body, fontSize: scaled(12), marginTop: 2 },
});
