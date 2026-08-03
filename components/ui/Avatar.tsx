import { Image, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';

interface AvatarProps {
  name: string;
  /** User's profile_color (hex). Used for the ring + as fill when no photo. */
  ringColor?: string;
  /** Optional photo URL. If absent we render a colour-fill + initial. */
  photoUrl?: string | null;
  size?: number;
  ringWidth?: number;
  /** Background ring border (used when stacking avatars on a non-white surface). */
  outlineColor?: string;
}

/**
 * Universal avatar: coloured ring + photo OR colour-fill with initial.
 * Same grammar everywhere per design/moma-enhanced.html.
 */
export function Avatar({
  name,
  ringColor = colors.fuchsia,
  photoUrl,
  size = 40,
  ringWidth = 2,
  outlineColor,
}: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  // The ring is a drawn circle standing off the face, not a thick edge on it:
  // stroke, then a breath of the page, then the photo. Ref: v11 avatar stack.
  const gap = Math.max(1.5, ringWidth * 0.9);
  const inner = size - (ringWidth + gap) * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: gap,
          borderWidth: ringWidth,
          borderColor: ringColor,
          // The gap takes the colour of whatever the avatar is sitting on.
          backgroundColor: outlineColor ?? colors.white,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.cream,
          }}
        />
      ) : (
        <View
          style={[
            styles.fill,
            {
              width: inner,
              height: inner,
              borderRadius: inner / 2,
              backgroundColor: ringColor,
            },
          ]}
        >
          <Typography
            variant="bodyL"
            color={colors.white}
            style={{
              fontSize: inner * 0.42,
              lineHeight: inner * 0.46,
              fontWeight: '700',
            }}
          >
            {initial}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
