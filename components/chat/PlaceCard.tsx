import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { openInGoogleMaps, staticMapUri } from '@/lib/maps';
import type { PlaceAttachment } from '@/types';

interface PlaceCardProps {
  place: PlaceAttachment;
}

/** Shared-place message: static Google map thumbnail + name / address / rating.
 *  Tapping opens the place in Google Maps. */
export function PlaceCard({ place }: PlaceCardProps) {
  const mapUri = staticMapUri(place);
  const [mapFailed, setMapFailed] = useState(false);

  return (
    <Pressable style={styles.card} onPress={() => openInGoogleMaps(place)}>
      {mapUri && !mapFailed ? (
        <Image
          source={{ uri: mapUri }}
          style={styles.map}
          resizeMode="cover"
          onError={() => setMapFailed(true)}
        />
      ) : (
        <View style={[styles.map, styles.mapFallback]}>
          <Typography variant="displayS" color={colors.blushMuted}>
            ◍
          </Typography>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Typography variant="displayS" color={colors.text} numberOfLines={1} style={{ flex: 1 }}>
            {place.name}
          </Typography>
          {typeof place.rating === 'number' ? (
            <View style={styles.ratingPill}>
              <Typography variant="labelS" color={colors.blushText}>
                ★ {place.rating.toFixed(1)}
              </Typography>
            </View>
          ) : null}
        </View>
        {place.address ? (
          <Typography
            variant="bodyM"
            color={colors.muted}
            numberOfLines={1}
            style={{ marginTop: 2 }}
          >
            {place.address}
          </Typography>
        ) : null}
        <Typography variant="labelS" color={colors.cobalt} style={{ marginTop: spacing.sm }}>
          OPEN IN MAPS
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  map: { width: '100%', height: 120, backgroundColor: colors.sable },
  mapFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingPill: {
    backgroundColor: colors.blush,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
});
