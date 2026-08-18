import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import type { IllustrationName } from '@/components/ui/Illustration';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { DiscoverSubTabs, type DiscoverTab } from '@/components/discover/DiscoverSubTabs';
import { StageFilter } from '@/components/discover/StageFilter';
import { ComposeFab } from '@/components/discover/ComposeFab';
import { ShareReelSheet } from '@/components/discover/ShareReelSheet';
import { ReadCard } from '@/components/discover/ReadCard';
import { ReelCard } from '@/components/discover/ReelCard';
import { DiscoverSkeleton } from '@/components/discover/DiscoverSkeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { textStyles } from '@/constants/typography';
import { useLearn } from '@/hooks/useLearn';
import { matchesQuery } from '@/lib/search';
import { useAppStore } from '@/store/useAppStore';
import type { LearnArticle, LearnReel } from '@/types';

// Learn → editorial articles; Watch → vetted reels. The old "Recco" format is
// gone — peer recommendations now live on the Explore map (own route).
type FeedTab = Exclude<DiscoverTab, 'explore'>;
function subtitles(t: TFunction): Record<FeedTab, string> {
  return { learn: t('dis.subLearn'), watch: t('dis.subWatch') };
}
function sectionLabels(t: TFunction): Record<FeedTab, string> {
  return { learn: t('dis.secLearn'), watch: t('dis.secWatch') };
}
// Each sub-tab carries its own drawing in the masthead.
const ILLO: Record<FeedTab, IllustrationName> = {
  learn: 'picnic',
  watch: 'movieNight',
};

export default function DiscoverIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Shared with Explore, which is a sibling route: coming back from the map on
  // "Watch" has to show Watch, and this screen is still mounted underneath it.
  const tab = useAppStore((s) => s.discoverFeedTab) as FeedTab;
  const setTab = useAppStore((s) => s.setDiscoverFeedTab);
  const [stage, setStage] = useState<string>('all');
  const [stageSheet, setStageSheet] = useState(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [query, setQuery] = useState('');

  const { docs, loading, error, refresh } = useLearn({
    format: tab === 'learn' ? 'learnArticle' : 'learnReel',
    babyStage: stage === 'all' ? undefined : stage,
  });

  // Filtered in memory: the Learn corpus is curated and already fetched, so a
  // round-trip per keystroke would buy nothing. Search covers what someone
  // would plausibly remember — the title and deck, who wrote or presented it,
  // the category and the source — not the article body, where a stray word
  // would surface a piece that isn't really about it.
  const results = useMemo(() => {
    if (!query.trim()) return docs;
    return docs.filter((d) => {
      if (d._type === 'learnArticle') {
        return matchesQuery(query, [
          d.title, d.deck, d.category, d.author, d.authorTitle, d.source, d.lead,
        ]);
      }
      if (d._type === 'learnReel') {
        return matchesQuery(query, [
          d.title, d.category, d.creatorName, d.creatorHandle, d.credential,
        ]);
      }
      return matchesQuery(query, [d.title, d.category]);
    });
  }, [docs, query]);

  const [pulling, setPulling] = useState(false);
  const onPullRefresh = useCallback(async () => {
    setPulling(true);
    try {
      await refresh();
    } finally {
      setPulling(false);
    }
  }, [refresh]);

  const onTabChange = (next: DiscoverTab) => {
    if (next === 'explore') {
      router.push('/discover/explore');
      return;
    }
    setTab(next);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(d) => d._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={onPullRefresh} tintColor={colors.cobalt} />
        }
        ListHeaderComponent={
          <View>
            <DiscoverHeader
              subtitle={subtitles(t)[tab]}
              topInset={insets.top}
              illustration={ILLO[tab]}
              searchPlaceholder={
                tab === 'learn' ? t('dis.searchArticles') : t('dis.searchReels')
              }
              searchValue={query}
              onSearchChange={setQuery}
            />
            <DiscoverSubTabs active={tab} onChange={onTabChange} />
            <StageFilter
              value={stage}
              onChange={setStage}
              open={stageSheet}
              onOpenChange={setStageSheet}
            />
            <Typography style={styles.sectionLabel} color={colors.cobalt}>
              {query.trim()
                ? `${results.length} ${results.length === 1 ? 'RESULT' : 'RESULTS'}`
                : sectionLabels(t)[tab].toUpperCase()}
            </Typography>
            {error ? (
              <Typography variant="bodyL" color={colors.cherry} style={styles.error}>
                {error}
              </Typography>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item._type === 'learnArticle' ? (
            <View style={styles.cardWrap}>
              <ReadCard
                article={item as LearnArticle}
                onPress={() =>
                  router.push({ pathname: '/discover/[docId]', params: { docId: item._id } })
                }
              />
            </View>
          ) : (
            <View style={styles.cardWrap}>
              <ReelCard reel={item as LearnReel} />
            </View>
          )
        }
        ListEmptyComponent={
          loading ? (
            <DiscoverSkeleton count={3} />
          ) : query.trim() ? (
            <View style={styles.empty}>
              <Typography variant="bodyL" color={colors.muted} style={styles.emptyText}>
                Nothing matches &ldquo;{query.trim()}&rdquo;
                {stage !== 'all' ? t('dis.inThisStage') : ''}.
              </Typography>
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Typography style={styles.clearLink} color={colors.cobalt}>
                  {t('dis.clearSearch')}
                </Typography>
              </Pressable>
            </View>
          ) : (
            <Typography variant="bodyL" color={colors.muted} style={styles.emptyText}>
              {t('dis.emptyFeed')}
            </Typography>
          )
        }
      />

      {/* Watch only: a contributor can share a reel, but the Read feed is
          editorial — there's nothing there for them to add. */}
      {tab === 'watch' ? (
        <ComposeFab accessibilityLabel="Share a reel" onPress={() => setShareSheet(true)} />
      ) : null}

      <ShareReelSheet
        visible={shareSheet}
        onClose={() => setShareSheet(false)}
        onPosted={refresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  list: { paddingBottom: spacing.xxxl },
  sectionLabel: {
    // Same eyebrow rank as the cards' own; the wider tracking is what makes it
    // read as the rule over a section rather than a line inside a card.
    ...textStyles.labelS,
    letterSpacing: 2.4,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  error: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  cardWrap: { marginBottom: 14, paddingHorizontal: spacing.xl },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyText: { textAlign: 'center', paddingHorizontal: spacing.xl },
  clearLink: { ...textStyles.control, textDecorationLine: 'underline' },
});
