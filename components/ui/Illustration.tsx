import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

/**
 * The hand-drawn cobalt line art. One drawing belongs to each surface, so the
 * app reads as a single sketchbook rather than a set of stock icons.
 * Ref: design/moma-v11.html — the `.illo` wells.
 */
const SOURCES = {
  dancer: require('@/assets/illustrations/dancer.png'),        // Home
  picnic: require('@/assets/illustrations/picnic.png'),        // Discover · Learn
  movieNight: require('@/assets/illustrations/movie-night.png'), // Discover · Watch
  table: require('@/assets/illustrations/table.png'),          // Discover · Explore
  tomato: require('@/assets/illustrations/tomato.png'),        // Me
  stars: require('@/assets/illustrations/stars.png'),          // Me
  microphone: require('@/assets/illustrations/microphone.png'), // Me
} as const;

export type IllustrationName = keyof typeof SOURCES;

/** Three sizes, nothing in between — v11 keeps the drawings from competing. */
const SIZES = { sm: 34, md: 56, lg: 72, feature: 92 } as const;

export function Illustration({
  name,
  size = 'md',
  style,
}: {
  name: IllustrationName;
  size?: keyof typeof SIZES;
  style?: StyleProp<ImageStyle>;
}) {
  const px = SIZES[size];
  return (
    <Image
      source={SOURCES[name]}
      style={[styles.img, { width: px, height: px }, style]}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  // Decorative only — never intercepts a tap meant for what sits under it.
  img: { opacity: 0.95 },
});
