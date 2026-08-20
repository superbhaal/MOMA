import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface OpenerChipsProps {
  /** Tap fires this with the selected opener — caller sends as the user's first message. */
  onPick: (text: string) => void;
}

const OPENERS = [
  'hi everyone — excited to meet you all',
  'how is everyone sleeping (or not)?',
  'anyone free for a coffee this week?',
];

/** Empty-state chips on group chat. */
export function OpenerChips({ onPick }: OpenerChipsProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Typography variant="bodyL" color={colors.muted} style={styles.heading}>
        {t('grp.quietHere')}
      </Typography>
      <Typography variant="bodyM" color={colors.muted} style={styles.sub}>
        {t('grp.breakIce')}
      </Typography>
      <View style={styles.chips}>
        {OPENERS.map((t) => (
          <Pressable key={t} onPress={() => onPick(t)} style={styles.chip}>
            <Typography variant="bodyL" color={colors.cobalt}>
              {t}
            </Typography>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  heading: { textAlign: 'center', marginTop: spacing.lg },
  sub: { textAlign: 'center', marginTop: spacing.sm },
  chips: { marginTop: spacing.xl, gap: spacing.md, width: '100%' },
  chip: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
