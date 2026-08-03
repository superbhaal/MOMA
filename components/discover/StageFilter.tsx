import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
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

const ALL: StageOption = { value: 'all', label: 'All stages', sub: 'Everything in the feed' };

const GROUPS: StageGroup[] = [
  {
    group: 'Pregnancy',
    rows: [
      { value: 'T1', label: '1st trimester', sub: 'Weeks 1–13' },
      { value: 'T2', label: '2nd trimester', sub: 'Weeks 14–27' },
      { value: 'T3', label: '3rd trimester', sub: 'Weeks 28–40' },
    ],
  },
  {
    group: 'Baby',
    rows: [
      { value: '0-4wks', label: 'Newborn', sub: '0–4 weeks' },
      { value: '1-3mo', label: '1–3 months' },
      { value: '3-6mo', label: '3–6 months' },
      { value: '6-12mo', label: '6–12 months' },
    ],
  },
  {
    group: 'Toddler & kid',
    rows: [
      { value: '1-2yr', label: '1–2 years' },
      { value: '2-3yr', label: '2–3 years' },
      { value: '3+yr', label: '3+ years' },
    ],
  },
];

const LABEL_BY_VALUE: Record<string, string> = [ALL, ...GROUPS.flatMap((g) => g.rows)].reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {},
);

interface StageFilterProps {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Funnel row + grouped picker sheet. Shows the current stage; tapping opens the
 *  sheet. Filters Learn & Watch to match (handoff §3). */
export function StageFilter({ value, onChange, open, onOpenChange }: StageFilterProps) {
  return (
    <>
      <Pressable style={styles.row} onPress={() => onOpenChange(true)}>
        <Ionicons name="funnel-outline" size={16} color={colors.muted} />
        <Typography style={styles.rowLabel} color={colors.muted}>
          STAGE
        </Typography>
        <Typography style={styles.rowValue} color={colors.text}>
          {LABEL_BY_VALUE[value] ?? 'All stages'}
        </Typography>
        <View style={{ flex: 1 }} />
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </Pressable>

      <ActionSheet visible={open} onClose={() => onOpenChange(false)} title="Show me content for…">
        <Typography style={styles.sheetSub} color={colors.muted}>
          We&rsquo;ll filter Learn and Watch to match.
        </Typography>
        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Row option={ALL} active={value === ALL.value} onPress={() => pick(ALL.value)} />
          {GROUPS.map((g) => (
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
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(12), letterSpacing: 0.84 },
  rowValue: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },
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
