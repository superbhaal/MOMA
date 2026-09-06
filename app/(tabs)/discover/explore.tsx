import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { DiscoverSubTabs, type DiscoverTab } from '@/components/discover/DiscoverSubTabs';
import { ExploreModeTabs } from '@/components/discover/ExploreModeTabs';
import { ExploreCategoryChips } from '@/components/discover/ExploreCategoryChips';
import { ExploreMap } from '@/components/discover/ExploreMap';
import { ExploreSheet } from '@/components/discover/ExploreSheet';
import { ComposeFab } from '@/components/discover/ComposeFab';
import { SavedFilterToggle } from '@/components/discover/SavedFilterToggle';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { categoryLabel } from '@/constants/discover';
import { useAuth } from '@/hooks/useAuth';
import { useDiscoverRole } from '@/hooks/useDiscoverRole';
import { useLovedPlaces } from '@/hooks/useLovedSpots';
import { useSavedTips } from '@/hooks/useSavedTips';
import { matchesQuery } from '@/lib/search';
import { useAppStore } from '@/store/useAppStore';
import type { LovedKind, LovedCategory, LovedPlace } from '@/types';

/**
 * Explore · Map — places & practitioners loved by named moms nearby. An
 * interactive map (Apple Maps on iOS) with tappable pins + a persistent
 * attributed list sheet. Places / People modes each keep their own category.
 */
export default function DiscoverExplore() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { canPost } = useDiscoverRole();
  const setFeedTab = useAppStore((s) => s.setDiscoverFeedTab);

  const [mode, setMode] = useState<LovedKind>('place');
  const [placeCat, setPlaceCat] = useState<LovedCategory | 'all'>('all');
  const [personCat, setPersonCat] = useState<LovedCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  // Places and people are hearted from their own page — the row's right edge
  // already carries a fuchsia heart, and it means something else there (how
  // many moms vouched). Two hearts in one row would read as one.
  const [savedOnly, setSavedOnly] = useState(false);
  const { isSaved } = useSavedTips();
  // Height of the map canvas — the sheet lives INSIDE it, so its rest heights
  // must be measured against this, never the full window (else the expanded
  // sheet overflows the canvas top and gets clipped by overflow:hidden).
  const [canvasH, setCanvasH] = useState(0);

  const category = mode === 'place' ? placeCat : personCat;
  const setCategory = (v: LovedCategory | 'all') =>
    (mode === 'place' ? setPlaceCat : setPersonCat)(v);

  const { places, loading, error, refresh } = useLovedPlaces(mode, category);

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
    const pool = savedOnly ? places.filter((s: LovedPlace) => isSaved(s.id)) : places;
    if (!query.trim()) return pool;
    return pool.filter((s: LovedPlace) =>
      matchesQuery(query, [
        s.name,
        s.address,
        categoryLabel(s.category, t),
        ...s.recommendations.map((r) => r.poster_name),
      ]),
    );
  }, [places, query, savedOnly, isSaved]);

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
    if (next === 'explore') return;
    // Regulars are a sibling route, not a feed tab: replace rather than
    // stacking a third screen on top of the map.
    if (next === 'regular') {
      router.replace('/discover/regulars');
      return;
    }
    // Leave by the chips, the same way Learn ↔ Watch swap. `dismissTo` pops back
    // to the feed already sitting under the map instead of stacking a second
    // copy of it — and the tab goes through the store, because that feed is
    // mounted and won't remount to read a param.
    setFeedTab(next);
    if (router.canGoBack()) router.dismissTo('/discover');
    else router.replace('/discover');
  };

  return (
    <View style={styles.container}>
      <DiscoverHeader
        subtitle={t('expl.lovedBy', { city })}
        searchPlaceholder={t('expl.search')}
        searchValue={query}
        onSearchChange={setQuery}
        searchRight={<SavedFilterToggle active={savedOnly} onChange={setSavedOnly} />}
        topInset={insets.top}
        illustration="table"
      />
      <DiscoverSubTabs active="explore" onChange={onSubTab} />
      <ExploreModeTabs active={mode} onChange={setMode} />
      <ExploreCategoryChips kind={mode} value={category} onChange={setCategory} />

      <View
        style={styles.canvas}
        onLayout={(e: LayoutChangeEvent) => setCanvasH(e.nativeEvent.layout.height)}
      >
        <ExploreMap
          places={filtered}
          me={me}
          currentUserId={user?.id}
          onSelectSpot={(id) => router.push({ pathname: '/discover/place/[id]', params: { id } })}
        />

        {/* Sits just above the sheet's resting edge rather than the screen's,
            so it never hides the first spot in the list. */}
        <ComposeFab
          bottom={collapsedHeight + spacing.sm}
          accessibilityLabel={mode === 'person' ? 'Add a person' : 'Add a place'}
          onPress={() =>
            router.push({ pathname: '/discover/place/new', params: { kind: mode } })
          }
        />

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
          hasCategoryFilter={category !== 'all' || query.trim().length > 0 || savedOnly}
          canPost={canPost}
          onRetry={refresh}
          onClearFilters={() => {
            setCategory('all');
            setQuery('');
            setSavedOnly(false);
          }}
          onCompose={() =>
            router.push({ pathname: '/discover/place/new', params: { kind: mode } })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  canvas: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#EAF0E6' },
});
