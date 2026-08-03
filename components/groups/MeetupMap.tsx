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
  /** Colour of the fallback glyph when the thumbnail can't load. */
  accentColor?: string;
  /** Thumbnail edge length. */
  size?: number;
}

/** Tappable Google-map thumbnail of a meetup location — opens Google Maps.
 *  Renders nothing when the meetup has no coordinates. */
export function MeetupMap({ name, lat, lng, accentColor = colors.cobalt, size = 76 }: MeetupMapProps) {
  const [failed, setFailed] = useState(false);
  const uri = staticMapUri({ lat, lng });
  if (!uri) return null;

  const open = () =>
    openInGoogleMaps({ name: name ?? 'Meetup', address: null, lat, lng, category: null });

  return (
    <Pressable onPress={open}>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: radius.md, backgroundColor: colors.sable },
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
