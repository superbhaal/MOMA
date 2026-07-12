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
  const inner = size - ringWidth * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: ringWidth,
          backgroundColor: ringColor,
        },
        outlineColor
          ? { borderWidth: 2, borderColor: outlineColor }
          : undefined,
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
