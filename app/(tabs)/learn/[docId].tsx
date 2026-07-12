import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { SaveHeart } from '@/components/learn/SaveHeart';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { useLearnDoc } from '@/hooks/useLearn';
import type { LearnArticle, LearnReel, LearnRecommendation, SanityBlock } from '@/types';

export default function LearnDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { doc, loading, error } = useLearnDoc(docId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
        {doc ? (
          <SaveHeart docId={doc._id} docType={typeMap(doc._type)} />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <Typography variant="bodyL" color={colors.muted}>
            loading...
          </Typography>
        ) : error ? (
          <Typography variant="bodyL" color={colors.cherry}>
            {error}
          </Typography>
        ) : doc?._type === 'learnArticle' ? (
          <ArticleReader article={doc as LearnArticle} />
        ) : doc?._type === 'learnReel' ? (
          <ReelDetail reel={doc as LearnReel} />
        ) : doc?._type === 'learnRecommendation' ? (
          <RecommendationDetail recco={doc as LearnRecommendation} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function typeMap(t: string): 'read_article' | 'watch_reel' | 'recommendation' {
  if (t === 'learnArticle') return 'read_article';
  if (t === 'learnReel') return 'watch_reel';
  return 'recommendation';
}

function ArticleReader({ article }: { article: LearnArticle }) {
  return (
    <>
      <Pill label="READ" tone="cobalt" active />
      <Typography variant="displayL" color={colors.text} style={styles.headline}>
        {article.title}
      </Typography>
      {article.deck ? (
        <Typography color={colors.mutedStrong} style={styles.deck}>
          {article.deck}
        </Typography>
      ) : null}
      <Typography variant="bodyM" color={colors.muted} style={{ marginTop: spacing.lg }}>
        {article.author} · {article.authorTitle} · {article.readMinutes} min read
      </Typography>
      {article.source ? (
        <View style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}>
          <Pill label={article.source} bg={colors.cobalt} textColor={colors.white} />
        </View>
      ) : null}
      {article.lead ? (
        <Typography color={colors.text} style={styles.lead}>
          {article.lead}
        </Typography>
      ) : null}

      {article.keyPoints && article.keyPoints.length > 0 ? (
        <View style={styles.keyPoints}>
          <Typography variant="label" color={colors.muted}>
            KEY POINTS
          </Typography>
          {article.keyPoints.map((kp, i) => (
            <Typography
              key={i}
              variant="reading"
              color={colors.text}
              style={{ marginTop: spacing.sm }}
            >
              · {kp}
            </Typography>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>{renderBody(article.body ?? [])}</View>
    </>
  );
}

function renderBody(blocks: SanityBlock[]) {
  return blocks.map((b) => {
    const text = (b.children ?? []).map((c) => c.text).join('');
    const isHeading = b.style?.startsWith('h');
    return (
      <Typography
        key={b._key}
        variant={isHeading ? 'displayM' : 'reading'}
        color={colors.text}
        style={{ marginTop: isHeading ? spacing.lg : spacing.md }}
      >
        {text}
      </Typography>
    );
  });
}

function ReelDetail({ reel }: { reel: LearnReel }) {
  return (
    <>
      <Pill label="WATCH" tone="fuchsia" active />
      <Typography variant="displayL" color={colors.text} style={styles.headline}>
        {reel.title}
      </Typography>
      <Typography variant="bodyL" color={colors.muted} style={{ marginTop: spacing.sm }}>
        {reel.creatorName} · {reel.credential}
      </Typography>
      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={`open in ${reel.platform}`}
          size="lg"
          onPress={() => Linking.openURL(reel.externalUrl)}
        />
      </View>
    </>
  );
}

function RecommendationDetail({ recco }: { recco: LearnRecommendation }) {
  return (
    <>
      <Pill label="RECCO" tone="lime" active />
      <Typography variant="displayL" color={colors.text} style={styles.headline}>
        {recco.title}
      </Typography>
      <Typography variant="bodyL" color={colors.muted} style={{ marginTop: spacing.sm }}>
        {recco.contributorName} {recco.verified ? '· ✓ verified' : ''}
      </Typography>
      <Typography color={colors.text} style={styles.lead}>
        {recco.body}
      </Typography>
      {recco.linkUrl ? (
        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={recco.linkLabel ?? 'open link'}
            size="lg"
            onPress={() => Linking.openURL(recco.linkUrl)}
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headline: {
    fontFamily: fonts.serifBold,
    fontSize: 36,
    lineHeight: 40,
    marginTop: spacing.md,
  },
  deck: {
    fontFamily: fonts.readingItal,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.sm,
  },
  lead: {
    fontFamily: fonts.reading,
    fontSize: 16,
    lineHeight: 26,
    marginTop: spacing.lg,
  },
  keyPoints: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
  },
});
