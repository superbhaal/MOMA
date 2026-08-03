import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

interface RsvpPillProps {
  going: boolean;
  onPress: () => void;
}

/** Single-tap RSVP pill: filled cobalt "Going" call-to-action → white "✓ Going"
 *  once the user is in. */
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
      <Typography color={going ? colors.cobalt : colors.white} style={styles.label}>
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
  notGoing: { backgroundColor: colors.cobalt },
  // On the v11 white ground a white pill vanishes — outline it in cobalt.
  going: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cobalt,
  },
  label: {
    fontFamily: fonts.bodyMed,
    fontSize: 11,
    letterSpacing: 2,
  },
});
