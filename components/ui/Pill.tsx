import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type Tone = 'pool' | 'lime' | 'cobalt' | 'soleil' | 'fuchsia' | 'blush' | 'meadow';

interface PillProps {
  label: string;
  active?: boolean;
  /** Active background colour. Default = pool (filters). Use lime for stage chips. */
  tone?: Tone;
  onPress?: () => void;
  /** When set, overrides background (used for the source pill on Read cards, etc). */
  bg?: string;
  /** When set, overrides text colour. */
  textColor?: string;
}

export function Pill({
  label,
  active = false,
  tone = 'pool',
  onPress,
  bg,
  textColor,
}: PillProps) {
  const backgroundColor = bg ?? (active ? toneToColor(tone) : colors.cream);
  const color =
    textColor ?? (active || bg ? toneTextColor(tone, bg) : colors.muted);

  const inner = (
    <Typography variant="labelS" color={color}>
      {label}
    </Typography>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.pill, { backgroundColor }]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={[styles.pill, { backgroundColor }]}>{inner}</View>;
}

function toneToColor(tone: Tone): string {
  switch (tone) {
    case 'pool':
      return colors.pool;
    case 'lime':
      return colors.lime;
    case 'cobalt':
      return colors.cobalt;
    case 'soleil':
      return colors.soleil;
    case 'fuchsia':
      return colors.fuchsia;
    case 'blush':
      return colors.blush;
    case 'meadow':
      return colors.meadowText;
  }
}

function toneTextColor(tone: Tone, bg: string | undefined): string {
  if (bg) return colors.text;
  switch (tone) {
    case 'lime':
    case 'soleil':
      return colors.text;
    case 'blush':
      return colors.blushText;
    default:
      return colors.white;
  }
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
