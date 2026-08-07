import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { DiscoverSubTabs, type DiscoverTab } from '@/components/discover/DiscoverSubTabs';
import { ExploreModeTabs } from '@/components/discover/ExploreModeTabs';
import { ExploreCategoryChips } from '@/components/discover/ExploreCategoryChips';
import { ExploreMap } from '@/components/discover/ExploreMap';
import { ExploreSheet } from '@/components/discover/ExploreSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { categoryLabel } from '@/constants/discover';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoverRole } from '@/hooks/useDiscoverRole';
import { useLovedSpots } from '@/hooks/useLovedSpots';
import { matchesQuery } from '@/lib/search';
import type { LovedKind, LovedCategory } from '@/types';

/**
 * Explore · Map — places & practitioners loved by named moms nearby. An
 * interactive map (Apple Maps on iOS) with tappable pins + a persistent
 * attributed list sheet. Places / People modes each keep their own category.
 */
export default function DiscoverExplore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { canPost } = useDiscoverRole();

  const [mode, setMode] = useState<LovedKind>('place');
  const [placeCat, setPlaceCat] = useState<LovedCategory | 'all'>('all');
  const [personCat, setPersonCat] = useState<LovedCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  // Height of the map canvas — the sheet lives INSIDE it, so its rest heights
  // must be measured against this, never the full window (else the expanded
  // sheet overflows the canvas top and gets clipped by overflow:hidden).
  const [canvasH, setCanvasH] = useState(0);

  const category = mode === 'place' ? placeCat : personCat;
  const setCategory = (v: LovedCategory | 'all') =>
    (mode === 'place' ? setPlaceCat : setPersonCat)(v);

  const { spots, loading, error, refresh } = useLovedSpots(mode, category);

  // Refetch when returning to the map (e.g. after publishing a new spot).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Client-side search over name / address / category / recommender. Shares the
  // matcher with the Learn feed, so accents fold and terms can arrive in any
  // order — "nuria cafe" finds Núria's café.
  const filtered = useMemo(() => {
    if (!query.trim()) return spots;
    return spots.filter((s) =>
      matchesQuery(query, [
        s.name,
        s.address,
        categoryLabel(s.category),
        s.poster?.display_name,
      ]),
    );
  }, [spots, query]);

  const me =
    user?.latitude != null && user?.longitude != null
      ? { lat: user.latitude, lng: user.longitude }
      : null;

  // Sheet rest heights, bounded to the canvas: the collapsed peek is deliberately
  // shallow — the map is what people came for — and expanded stops just short of
  // the top so the map still peeks and the grab handle stays on-screen.
  const collapsedHeight = canvasH ? Math.round(canvasH * 0.32) : 190;
  const expandedHeight = canvasH ? Math.round(canvasH * 0.9) : 480;

  const city = user?.city || 'your area';

  const onSubTab = (next: DiscoverTab) => {
    if (next !== 'explore') router.replace('/discover');
  };

  return (
    <View style={styles.container}>
      <DiscoverHeader
        variant="map"
        subtitle={`Loved by moms in ${city}`}
        searchPlaceholder="Search places & people…"
        searchValue={query}
        onSearchChange={setQuery}
        topInset={insets.top}
        illustration="table"
        titleRight={
          canPost ? (
            <View style={styles.badge}>
              <Typography style={styles.badgeText} color={colors.soleil}>
                Contributor
              </Typography>
            </View>
          ) : undefined
        }
      />
      <DiscoverSubTabs active="explore" onChange={onSubTab} />
      <ExploreModeTabs active={mode} onChange={setMode} />
      <ExploreCategoryChips kind={mode} value={category} onChange={setCategory} />

      <View
        style={styles.canvas}
        onLayout={(e: LayoutChangeEvent) => setCanvasH(e.nativeEvent.layout.height)}
      >
        <ExploreMap
          spots={filtered}
          me={me}
          currentUserId={user?.id}
          onSelectSpot={(id) => router.push({ pathname: '/discover/place/[id]', params: { id } })}
        />

        {canPost ? (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { bottom: collapsedHeight + spacing.lg },
              pressed && styles.fabPressed,
            ]}
            onPress={() => router.push('/discover/place/new')}
            accessibilityRole="button"
            accessibilityLabel="Share a recommendation"
          >
            <Ionicons name="add" size={28} color={colors.white} />
          </Pressable>
        ) : null}

        <ExploreSheet
          mode={mode}
          spots={filtered}
          loading={loading}
          error={error}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onSelect={(id) => router.push({ pathname: '/discover/place/[id]', params: { id } })}
          currentUserId={user?.id}
          bottomInset={0}
          collapsedHeight={collapsedHeight}
          expandedHeight={expandedHeight}
          hasCategoryFilter={category !== 'all' || query.trim().length > 0}
          canPost={canPost}
          onRetry={refresh}
          onClearFilters={() => {
            setCategory('all');
            setQuery('');
          }}
          onCompose={() => router.push('/discover/place/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  canvas: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#EAF0E6' },
  badge: {
    backgroundColor: colors.soleilInkStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: scaled(11) },
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cobalt,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabPressed: { backgroundColor: colors.cobaltDeep },
});
