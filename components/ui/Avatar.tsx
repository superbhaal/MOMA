import { Image, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const regularLabel = t('dis.regularOne').toUpperCase();
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  // The ring is a drawn circle standing off the face, not a thick edge on it:
  // stroke, then a breath of the page, then the photo. Ref: v11 avatar stack.
  const gap = Math.max(1.5, ringWidth * 0.9);
  const inner = size - (ringWidth + gap) * 2;

  // Two marks, not one pill in two sizes. A shrunken pill was tried and it
  // failed: at list scale the word truncated to "HABIT…" and covered half the
  // face. So the word gets a pill where there is room for it, and everywhere
  // else it becomes the ø of møma in a disc — the brand mark, which reads at
  // any size and needs no translation.
  //
  // Below 32px nothing is drawn; a disc there is a smudge.
  const showBadge = isRegular && size >= 32;
  const asPill = size >= 72;
  const disc = Math.max(13, Math.round(size * 0.34));

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

  // Not clipped to the avatar's box: the pill is wider than the circle and has
  // to be free to overhang on both sides, as in the mockup.
  return (
    <View style={{ width: size, height: size, alignItems: asPill ? 'center' : undefined }}>
      {avatar}
      {asPill ? (
        <View pointerEvents="none" style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: outlineColor ?? colors.white }]}>
            <Typography style={styles.badgeText} color={colors.cobalt} numberOfLines={1}>
              {regularLabel}
            </Typography>
          </View>
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.disc,
            {
              width: disc,
              height: disc,
              borderRadius: disc / 2,
              right: -disc * 0.1,
              bottom: -disc * 0.1,
              borderColor: outlineColor ?? colors.white,
            },
          ]}
        >
          <Typography
            style={[styles.discText, { fontSize: Math.round(disc * 0.58) }]}
            color={colors.white}
          >
            ø
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cobalt,
    borderWidth: 1.5,
  },
  discText: {
    fontFamily: 'DMSans-SemiBold',
    lineHeight: undefined,
  },
  badgeRow: {
    position: 'absolute',
    bottom: -11,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(26,75,204,0.35)',
  },
  badgeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(10),
    letterSpacing: 1.4,
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
