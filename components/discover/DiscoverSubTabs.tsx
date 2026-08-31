import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

export type DiscoverTab = 'learn' | 'watch' | 'explore' | 'regular';

function subTabs(t: TFunction) {
  return [
    { key: 'learn' as const, label: t('dis.tabLearn') },
    { key: 'watch' as const, label: t('dis.tabWatch') },
    { key: 'explore' as const, label: t('dis.tabExplore') },
    { key: 'regular' as const, label: t('dis.tabRegular') },
  ];
}

interface DiscoverSubTabsProps {
  active: DiscoverTab;
  onChange: (tab: DiscoverTab) => void;
}

/**
 * Learn · Watch · Explore chips on white. Active chip = solid ink pill / white
 * text; inactive = faint fill / ink text. Tapping Explore is a real navigation
 * (own map lifecycle), handled by the caller.
 */
export function DiscoverSubTabs({ active, onChange }: DiscoverSubTabsProps) {
  const { t } = useTranslation();
  return (
    // Scrollable rather than tuned to fit. Four chips at 372pt of French on a
    // 390pt iPhone is a hair from overflowing, and an SE at 375pt would. This
    // centres when the row fits and glides when it does not, which also holds
    // for whatever the next translation is.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.rowScroll}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {subTabs(t).map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.chip, on && styles.chipActive]}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Typography style={styles.label} color={on ? colors.white : colors.mutedStrong}>
              {t.label.toUpperCase()}
            </Typography>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rowScroll: { flexGrow: 0, backgroundColor: colors.white },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    // flexGrow so the content still centres when it is narrower than the screen.
    flexGrow: 1,
    // Four chips where there were three. On a 390pt iPhone the old padding and
    // gap pushed the last one off the edge, so both shrink — the row is
    // centred, so the overflow showed on the right first.
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  // v11: small-caps pills — active solid cobalt, inactive hairline outline.
  // Smaller than the rank they belong to: on Explore this row stands between
  // the masthead and the map, and every point it takes is a point of map. Our
  // tester has asked three times for more map — this is the cheap half of that
  // answer; the masthead is the expensive half.
  chip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.cobalt,
    borderColor: colors.cobalt,
  },
  label: textStyles.controlCaps,
});
