import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { openInGoogleMaps, staticMapUri } from '@/lib/maps';

interface MeetupMapProps {
  name: string | null;
  lat: number | null;
  lng: number | null;
  /** Text colour for the "maps" link (matches the host card). */
  accentColor?: string;
  /** Thumbnail edge length. */
  size?: number;
}

/** Compact Google-map thumbnail of a meetup location + a Google Maps link.
 *  Renders nothing when the meetup has no coordinates. */
export function MeetupMap({ name, lat, lng, accentColor = colors.cobalt, size = 92 }: MeetupMapProps) {
  const [failed, setFailed] = useState(false);
  const uri = staticMapUri({ lat, lng });
  if (!uri) return null;

  const open = () =>
    openInGoogleMaps({ name: name ?? 'Meetup', address: null, lat, lng, category: null });

  return (
    <Pressable style={styles.wrap} onPress={open}>
      {!failed ? (
        <Image
          source={{ uri }}
          style={[styles.map, { width: size, height: size }]}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[styles.map, styles.fallback, { width: size, height: size }]}>
          <Typography variant="displayS" color={accentColor}>
            ◍
          </Typography>
        </View>
      )}
      <Typography variant="labelS" color={accentColor} style={styles.caption}>
        MAPS →
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  map: { borderRadius: radius.md, backgroundColor: colors.sable },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  caption: { marginTop: 4 },
});
