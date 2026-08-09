import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import type { LovedKind } from '@/types';

const TABS: { key: LovedKind; label: string }[] = [
  { key: 'place', label: 'Places' },
  { key: 'person', label: 'People' },
];

interface ExploreModeTabsProps {
  active: LovedKind;
  onChange: (mode: LovedKind) => void;
}

/** Places / People underline tabs. Active = ink label + 2px ink underline. */
export function ExploreModeTabs({ active, onChange }: ExploreModeTabsProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={styles.tab}
            hitSlop={{ top: 4, bottom: 4 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Typography
              style={[styles.label, on && styles.labelActive]}
              color={on ? colors.text : colors.labelTertiary}
            >
              {t.label}
            </Typography>
            {on ? <View style={styles.underline} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: { paddingTop: 10, paddingBottom: 12, position: 'relative' },
  // Matches the Learn/Watch/Explore trio above it.
  // Explore's control strip has to match Learn's and Watch's — same rank as
  // the sub-tab chips and the stage row. The underline marks the active tab.
  label: textStyles.control,
  labelActive: { fontFamily: fonts.bodySemi },
  underline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: colors.text,
  },
});
