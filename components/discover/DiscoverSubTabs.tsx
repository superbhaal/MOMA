import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

export type DiscoverTab = 'learn' | 'watch' | 'explore';

const TABS: { key: DiscoverTab; label: string }[] = [
  { key: 'learn', label: 'Learn' },
  { key: 'watch', label: 'Watch' },
  { key: 'explore', label: 'Explore' },
];

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
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((t) => {
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
    gap: spacing.sm,
    paddingHorizontal: 26,
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
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.cobalt,
    borderColor: colors.cobalt,
  },
  label: textStyles.controlCaps,
});
