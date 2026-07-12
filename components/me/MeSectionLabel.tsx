import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

interface MeSectionLabelProps {
  label: string;
  /** Optional element pinned to the right of the label (e.g. a count or toggle). */
  right?: React.ReactNode;
}

/** Uppercase section header used between cards on the Me screen and settings screens. */
export function MeSectionLabel({ label, right }: MeSectionLabelProps) {
  return (
    <View style={styles.row}>
      <Typography style={styles.label}>{label.toUpperCase()}</Typography>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 6,
  },
  label: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 1.7,
    color: colors.muted,
  },
  right: { marginLeft: 'auto' },
});
