import { Pressable, StyleSheet, View } from 'react-native';
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
    <View style={styles.row} accessibilityRole="tablist">
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    // Four chips where there were three, and French is the widest set:
    // APPRENDRE · REGARDER · EXPLORER · HABITUÉ measured 395pt against a 390pt
    // screen, so the last one was clipped. Tightened to ~364pt.
    //
    // A horizontal ScrollView was tried first and rejected: the chips painted
    // but their labels did not, on this screen only. flexWrap is the honest
    // fallback — if a future translation is wider still, the row breaks onto a
    // second line rather than hiding a tab.
    flexWrap: 'wrap',
    rowGap: 6,
    gap: 5,
    paddingHorizontal: 10,
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
    paddingHorizontal: 7,
    paddingVertical: 7,
    // 'VER' is three letters. Without a floor it collapses to a disc while its
    // neighbours stay capsules, which our tester flagged as looking broken.
    minWidth: 58,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.cobalt,
    borderColor: colors.cobalt,
  },
  label: {
    ...textStyles.controlCaps,
    // 1.5 is the house tracking for caps controls, but four chips of French
    // spend ~51pt of the row on tracking alone and 'HABITUÉES' pushed it over
    // the edge. 1.0 still reads as a control strip and buys back ~17pt.
    letterSpacing: 1,
  },
});
