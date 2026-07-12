import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { FormatChip, type FormatFilter } from '@/components/learn/FormatChip';
import { STAGE_FILTERS, StageChip } from '@/components/learn/StageChip';
import { ReadCard } from '@/components/learn/ReadCard';
import { WatchCard } from '@/components/learn/WatchCard';
import { RecommendationCard } from '@/components/learn/RecommendationCard';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useLearn } from '@/hooks/useLearn';
import type { LearnArticle, LearnReel, LearnRecommendation } from '@/types';

export default function LearnIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [format, setFormat] = useState<FormatFilter>('all');
  const [stage, setStage] = useState<string>('all');
  const { docs, loading, error, refresh } = useLearn({
    format: format === 'all' ? undefined : format,
    babyStage: stage === 'all' ? undefined : stage,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.header}>
        <Typography variant="displayL" color={colors.cobalt}>
          learn
        </Typography>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {(['all', 'learnArticle', 'learnReel', 'learnRecommendation'] as FormatFilter[]).map(
          (f) => (
            <FormatChip
              key={f}
              value={f}
              active={format === f}
              onPress={() => setFormat(f)}
            />
          ),
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {STAGE_FILTERS.map((s) => (
          <StageChip
            key={s}
            label={s}
            active={stage === s}
            onPress={() => setStage(s)}
          />
        ))}
      </ScrollView>

      {error ? (
        <Typography
          variant="bodyL"
          color={colors.cherry}
          style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}
        >
          {error}
        </Typography>
      ) : null}

      <FlatList
        data={docs}
        keyExtractor={(d) => d._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.cobalt} />
        }
        renderItem={({ item }) => {
          const open = () => router.push(`/(tabs)/learn/${item._id}`);
          if (item._type === 'learnArticle') {
            return <View style={styles.cardWrap}><ReadCard article={item as LearnArticle} onPress={open} /></View>;
          }
          if (item._type === 'learnReel') {
            return <View style={styles.cardWrap}><WatchCard reel={item as LearnReel} onPress={open} /></View>;
          }
          return <View style={styles.cardWrap}><RecommendationCard recco={item as LearnRecommendation} onPress={open} /></View>;
        }}
        ListEmptyComponent={
          !loading ? (
            <Typography
              variant="bodyL"
              color={colors.muted}
              style={{ textAlign: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}
            >
              nothing here yet — content lands as we publish it.
            </Typography>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  chipRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  cardWrap: { marginBottom: spacing.md },
});
