import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  /**
   * Marks a Regular — a mom who contributes to Explore. Draws a small badge
   * straddling the bottom of the ring, per the client's mockup.
   */
  isRegular?: boolean;
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
  isRegular = false,
}: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  // The ring is a drawn circle standing off the face, not a thick edge on it:
  // stroke, then a breath of the page, then the photo. Ref: v11 avatar stack.
  const gap = Math.max(1.5, ringWidth * 0.9);
  const inner = size - (ringWidth + gap) * 2;

  // The badge scales with the avatar and disappears below ~28px, where it would
  // be a smudge rather than a mark. The whole thing is wrapped so the badge can
  // hang off the ring without the ring's overflow clipping it.
  const showBadge = isRegular && size >= 28;
  const badge = Math.max(8, Math.round(size * 0.30));

  const avatar = (
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

  if (!showBadge) return avatar;

  return (
    <View style={{ width: size, height: size }}>
      {avatar}
      <View
        pointerEvents="none"
        style={[
          styles.badge,
          {
            width: badge,
            height: badge,
            borderRadius: badge / 2,
            right: -badge * 0.12,
            bottom: -badge * 0.12,
            borderColor: outlineColor ?? colors.white,
          },
        ]}
      >
        <Ionicons name="bookmark" size={Math.round(badge * 0.52)} color={colors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cobalt,
    borderWidth: 1.5,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
