import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface StageOptionProps {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  /** "compact" (Q0/Q2) vs "binary" (Q3 — bigger padding for long descs). */
  variant?: 'compact' | 'binary';
}

/**
 * Cobalt-bg quiz option card. Matches `.ob-opt` from design/moma-enhanced.html:
 * - unselected: translucent white card + 1.5px white border + white text
 * - selected: near-opaque white fill + cobalt border + cobalt text
 */
export function StageOption({
  label,
  hint,
  selected,
  onPress,
  variant = 'compact',
}: StageOptionProps) {
  const sizeStyle = variant === 'binary' ? styles.cardBinary : styles.cardCompact;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cardBase, sizeStyle, selected && styles.cardSelected]}
    >
      <Typography
        variant="bodyL"
        color={selected ? colors.cobalt : colors.white}
        style={[styles.title, selected && styles.titleSelected]}
      >
        {label}
      </Typography>
      {hint ? (
        <Typography
          color={selected ? 'rgba(26,75,204,0.62)' : 'rgba(255,255,255,0.6)'}
          style={styles.hint}
        >
          {hint}
        </Typography>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  cardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  cardBinary: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  cardSelected: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: colors.cobalt,
  },
  title: {
    fontSize: scaled(16),
    fontWeight: '600',
    lineHeight: scaled(21),
  },
  titleSelected: {
    fontWeight: '700',
  },
  hint: {
    fontSize: scaled(13),
    lineHeight: scaled(18),
    fontWeight: '300',
    marginTop: 2,
  },
});
