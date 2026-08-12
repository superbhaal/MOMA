import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface RsvpPillProps {
  going: boolean;
  onPress: () => void;
}

/**
 * Single-tap RSVP pill. Filled cobalt means you're in; the outline is the
 * invitation to tap.
 *
 * It shipped the other way round — the call-to-action was the filled one and
 * "✓ GOING" was a hollow outline — and our tester read the solid blue pill as
 * "I'm already going" and asked why the app had answered for her. Filled = the
 * state, not the offer; that's the convention everywhere else.
 */
export function RsvpPill({ going, onPress }: RsvpPillProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        going ? styles.going : styles.notGoing,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Typography color={going ? colors.white : colors.cobalt} style={styles.label}>
        {going ? '✓ GOING' : 'GOING?'}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.sm + 3,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  going: { backgroundColor: colors.cobalt, borderWidth: 1, borderColor: colors.cobalt },
  // On the v11 white ground a white pill vanishes — outline it in cobalt. The
  // border is on both so the pill doesn't change size when it's tapped.
  notGoing: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cobalt,
  },
  label: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(11),
    letterSpacing: 2,
  },
});
