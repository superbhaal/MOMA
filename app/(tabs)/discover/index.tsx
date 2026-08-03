import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import type { IllustrationName } from '@/components/ui/Illustration';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { DiscoverSubTabs, type DiscoverTab } from '@/components/discover/DiscoverSubTabs';
import { StageFilter } from '@/components/discover/StageFilter';
import { ComposeFab } from '@/components/discover/ComposeFab';
import { ReadCard } from '@/components/discover/ReadCard';
import { ReelCard } from '@/components/discover/ReelCard';
import { DiscoverSkeleton } from '@/components/discover/DiscoverSkeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useLearn } from '@/hooks/useLearn';
import type { LearnArticle, LearnReel } from '@/types';

// Learn → editorial articles; Watch → vetted reels. The old "Recco" format is
// gone — peer recommendations now live on the Explore map (own route).
type FeedTab = Exclude<DiscoverTab, 'explore'>;
const SUBTITLE: Record<FeedTab, string> = {
  learn: 'Evidence-based, peer-reviewed',
  watch: 'Reels & videos moms are sharing',
};
const SECTION_LABEL: Record<FeedTab, string> = {
  learn: 'From the møma team',
  watch: 'From the community',
};
// Each sub-tab carries its own drawing in the masthead.
const ILLO: Record<FeedTab, IllustrationName> = {
  learn: 'picnic',
  watch: 'movieNight',
};

export default function DiscoverIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<FeedTab>('learn');
  const [stage, setStage] = useState<string>('all');
  const [stageSheet, setStageSheet] = useState(false);

  const { docs, loading, error, refresh } = useLearn({
    format: tab === 'learn' ? 'learnArticle' : 'learnReel',
    babyStage: stage === 'all' ? undefined : stage,
  });

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
        data={docs}
        keyExtractor={(d) => d._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={onPullRefresh} tintColor={colors.cobalt} />
        }
        ListHeaderComponent={
          <View>
            <DiscoverHeader
              subtitle={SUBTITLE[tab]}
              topInset={insets.top}
              illustration={ILLO[tab]}
            />
            <DiscoverSubTabs active={tab} onChange={onTabChange} />
            <StageFilter
              value={stage}
              onChange={setStage}
              open={stageSheet}
              onOpenChange={setStageSheet}
            />
            <Typography style={styles.sectionLabel} color={colors.cobalt}>
              {SECTION_LABEL[tab].toUpperCase()}
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
          ) : (
            <Typography variant="bodyL" color={colors.muted} style={styles.empty}>
              nothing here yet — content lands as we publish it.
            </Typography>
          )
        }
      />

      <ComposeFab bottom={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  list: { paddingBottom: spacing.xxxl },
  sectionLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(8.5),
    letterSpacing: 2.4,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  error: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  cardWrap: { marginBottom: 14, paddingHorizontal: spacing.xl },
  empty: { textAlign: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
});
