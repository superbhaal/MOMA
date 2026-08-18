import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { colors } from '@/constants/colors';
import { categoryColor, categoryLabel } from '@/constants/discover';
import type { LovedPlace } from '@/types';

interface ExploreMapProps {
  places: LovedPlace[];
  me: { lat: number; lng: number } | null;
  currentUserId?: string;
  onSelectSpot: (id: string) => void;
}

// A calm default frame (Amsterdam) when we have neither location nor pins.
const FALLBACK: Region = {
  latitude: 52.3676,
  longitude: 4.9041,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Frame the user's own area — Explore is "loved by moms in YOUR area", so we
// centre on the user, not on far-flung pins (fitting everything would zoom out
// to a whole continent when spots are scattered). If there's no location, fall
// back to fitting the pins we do have.
function initialRegion(
  coords: { latitude: number; longitude: number }[],
  me: { lat: number; lng: number } | null,
): Region {
  if (me) return { latitude: me.lat, longitude: me.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  if (coords.length) {
    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latDelta = Math.max(0.02, (Math.max(...lats) - Math.min(...lats)) * 1.6);
    const lngDelta = Math.max(0.02, (Math.max(...lngs) - Math.min(...lngs)) * 1.6);
    return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
  }
  return FALLBACK;
}

/**
 * Interactive Explore map (Apple Maps on iOS — no key). Pan/zoom, a live
 * user-location dot, and tappable pins. One pin per PLACE, not per post — a
 * café three moms have recommended is one point on the map. Pin colour says
 * what it is; cobalt overrides to say you recommended it. Centres on the user's
 * area; pan/zoom to reach places further out (the list stays authoritative).
 */
export function ExploreMap({ places, me, currentUserId, onSelectSpot }: ExploreMapProps) {
  const { t } = useTranslation();
  const withCoords = places.filter((s) => s.lat != null && s.lng != null);
  const coords = withCoords.map((s) => ({ latitude: s.lat as number, longitude: s.lng as number }));

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion(coords, me)}
      showsUserLocation
      showsMyLocationButton={false}
      showsPointsOfInterest={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {withCoords.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat as number, longitude: s.lng as number }}
          // Colour says what it is; cobalt still overrides to say it's yours.
          pinColor={
            currentUserId && s.recommendations.some((r) => r.poster_id === currentUserId)
              ? colors.cobalt
              : categoryColor(s.category)
          }
          onPress={() => onSelectSpot(s.id)}
          accessibilityLabel={`${s.name} — ${categoryLabel(s.category, t)}`}
          tracksViewChanges={false}
        />
      ))}
    </MapView>
  );
}
