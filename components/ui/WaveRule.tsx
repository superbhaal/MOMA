import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '@/constants/colors';

/**
 * The drawn wave that separates a group's name from its meetup.
 * Ref: design/moma-v11.html · #screen-detail.
 *
 * It's a rasterised sine rather than a row of shaped Views: a View can only
 * curve its corners, so an arc that flat comes out as a dash. Stretching the
 * bitmap is fine here — it's a rule, and the wavelength is meant to adapt to
 * whatever width it's given.
 */
export function WaveRule({
  height = 14,
  color = colors.cobalt,
  style,
}: {
  height?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require('@/assets/illustrations/wave.png')}
      style={[styles.wave, { height, tintColor: color }, style]}
      resizeMode="stretch"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  wave: { width: '100%' },
});
