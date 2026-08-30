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

  // The client's mockup: a pill straddling the bottom of the ring, reading
  // Regular / Habitué / Habitual.
  //
  // Two sizes, because one does not fit. At the mockup's scale the pill is
  // ~65px wide, which is wider than the 48px avatar in a member row and would
  // sit on the name beside it. The compact variant measures about 50px — the
  // width of the avatar itself — so it holds in a list without pushing into
  // the text column.
  //
  // Below 44px nothing is drawn: avatar stacks and chat bubbles carry no mark,
  // which the client accepted. A pill there would be unreadable anyway.
  const showBadge = isRegular && size >= 44;
  const compact = size < 72;

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
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      {avatar}
      <View pointerEvents="none" style={[styles.badgeRow, compact && styles.badgeRowCompact]}>
        <View
          style={[
            styles.badge,
            compact && styles.badgeCompact,
            { backgroundColor: outlineColor ?? colors.white },
          ]}
        >
          <Typography
            style={[styles.badgeText, compact && styles.badgeTextCompact]}
            color={colors.cobalt}
            numberOfLines={1}
          >
            {regularLabel}
          </Typography>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRowCompact: { bottom: -8 },
  badgeCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  badgeTextCompact: { fontSize: scaled(8), letterSpacing: 0.6 },
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
