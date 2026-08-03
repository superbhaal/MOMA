import { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { useLearnDoc } from '@/hooks/useLearn';
import { useSavedTips } from '@/hooks/useSavedTips';
import type { LearnArticle, LearnReel, SanityBlock } from '@/types';

const MOMA_URL = 'https://joinmoma.org';

const STAGE_LABEL: Record<string, string> = {
  T1: '1st trimester',
  T2: '2nd trimester',
  T3: '3rd trimester',
  '0-4wks': 'Newborn',
  '1-3mo': '1–3 months',
  '3-6mo': '3–6 months',
  '6-12mo': '6–12 months',
  '1-2yr': '1–2 years',
  '2-3yr': '2–3 years',
  '3+yr': '3+ years',
};

export default function DiscoverDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const { doc, loading, error } = useLearnDoc(docId);

  const readMinutes = (doc as LearnArticle)?.readMinutes ?? 5;
  const [progress, setProgress] = useState(0); // 0..1
  const minutesLeft = Math.max(1, Math.ceil(readMinutes * (1 - progress)));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    setProgress(scrollable > 0 ? Math.min(1, Math.max(0, contentOffset.y / scrollable)) : 0);
  };

  const isArticle = doc?._type === 'learnArticle';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.cobalt} />
          <Typography style={styles.backText} color={colors.cobalt} numberOfLines={1}>
            How to build a human
          </Typography>
        </Pressable>
        {isArticle ? (
          <View style={styles.progressPill}>
            <Typography style={styles.progressText} color={colors.muted}>
              {minutesLeft} MIN LEFT
            </Typography>
          </View>
        ) : null}
      </View>
      {/* Reading-progress bar */}
      {isArticle ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <Typography variant="bodyL" color={colors.muted}>
            loading…
          </Typography>
        ) : error ? (
          <Typography variant="bodyL" color={colors.cherry}>
            {error}
          </Typography>
        ) : isArticle ? (
          <ArticleReader article={doc as LearnArticle} />
        ) : doc?._type === 'learnReel' ? (
          <ReelDetail reel={doc as LearnReel} />
        ) : null}
      </ScrollView>
    </View>
  );
}

function ArticleReader({ article }: { article: LearnArticle }) {
  const { isSaved, toggle } = useSavedTips();
  const saved = isSaved(article._id);

  const eyebrow = useMemo(() => {
    const parts = [article.category, article.babyStage ? STAGE_LABEL[article.babyStage] : null].filter(
      Boolean,
    );
    return parts.join(' · ');
  }, [article.category, article.babyStage]);

  // Articles have no page of their own on the web, so the link we share is the
  // site. Without it the share sheet only ever carried a bare line of text —
  // nothing the recipient could tap. iOS takes the link in `url`; Android
  // ignores that field, so it goes inline in the message instead.
  const onShare = () => {
    const text = [article.title, article.deck, article.source ? `Source: ${article.source}` : null]
      .filter(Boolean)
      .join('\n\n');
    Share.share(
      Platform.OS === 'ios'
        ? { message: text, url: MOMA_URL, title: article.title }
        : { message: `${text}\n\n${MOMA_URL}`, title: article.title },
    ).catch(() => {});
  };

  return (
    <>
      {eyebrow ? (
        <Typography style={styles.eyebrow} color={colors.cobalt}>
          {eyebrow.toUpperCase()}
        </Typography>
      ) : null}

      <Typography style={styles.h1} color={colors.cobalt}>
        {article.title}
      </Typography>

      {article.deck ? (
        <Typography style={styles.deck} color={colors.mutedStrong}>
          {article.deck}
        </Typography>
      ) : null}

      {/* Byline */}
      <View style={styles.byline}>
        <Avatar name={article.author ?? '—'} size={48} ringColor={colors.cobalt} ringWidth={1.5} />
        <View style={styles.bylineText}>
          <Typography style={styles.bylineName} color={colors.text}>
            {article.author}
          </Typography>
          <Typography style={styles.bylineMeta} color={colors.muted}>
            {[article.authorTitle, `${article.readMinutes ?? 5} min read`].filter(Boolean).join(' · ')}
          </Typography>
        </View>
        {article.source ? (
          <View style={styles.sourcePill}>
            <Typography style={styles.sourceText} color={colors.cobalt} numberOfLines={1}>
              {article.source}
            </Typography>
          </View>
        ) : null}
      </View>

      {article.lead ? (
        <Typography style={styles.body} color={colors.mutedStrong}>
          {article.lead}
        </Typography>
      ) : null}

      {renderBody(article.body ?? [])}

      {article.keyPoints && article.keyPoints.length > 0 ? (
        <View style={styles.keyPoints}>
          <Typography style={styles.keyLabel} color={colors.cobalt}>
            KEY POINTS
          </Typography>
          {article.keyPoints.map((kp, i) => (
            <View key={i} style={styles.keyRow}>
              <View style={styles.keyDot} />
              <Typography style={styles.keyText} color={colors.mutedStrong}>
                {kp}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}

      {/* Action row */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, saved && styles.actionBtnActive]}
          onPress={() => toggle(article._id, 'read_article')}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? colors.white : colors.text}
          />
          <Typography style={styles.actionText} color={saved ? colors.white : colors.text}>
            {saved ? 'Saved' : 'Save'}
          </Typography>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="arrow-redo-outline" size={18} color={colors.text} />
          <Typography style={styles.actionText} color={colors.text}>
            Share
          </Typography>
        </Pressable>
      </View>
    </>
  );
}

function renderBody(blocks: SanityBlock[]) {
  return blocks.map((b) => {
    const text = (b.children ?? []).map((c) => c.text).join('');
    if (!text) return null;
    if (b.style === 'blockquote') {
      return (
        <View key={b._key} style={styles.pullQuote}>
          <Typography style={styles.pullQuoteText} color={colors.mutedStrong}>
            {text}
          </Typography>
        </View>
      );
    }
    const isHeading = b.style?.startsWith('h');
    return (
      <Typography
        key={b._key}
        style={isHeading ? styles.h2 : styles.body}
        color={isHeading ? colors.text : colors.mutedStrong}
      >
        {text}
      </Typography>
    );
  });
}

function ReelDetail({ reel }: { reel: LearnReel }) {
  return (
    <>
      <Typography style={styles.h1} color={colors.cobalt}>
        {reel.title}
      </Typography>
      <Typography style={styles.deck} color={colors.mutedStrong}>
        {[reel.creatorName, reel.credential].filter(Boolean).join(' · ')}
      </Typography>
      <View style={{ marginTop: spacing.xl }}>
        <Button
          title={`Open in ${reel.platform}`}
          size="lg"
          onPress={() => Linking.openURL(reel.externalUrl)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  backText: { fontFamily: fonts.bodySemi, fontSize: scaled(14) },
  progressPill: {
    backgroundColor: 'rgba(17,17,24,0.05)',
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  progressText: { fontFamily: fonts.bodySemi, fontSize: scaled(11), letterSpacing: 0.55 },
  progressTrack: { height: 2, backgroundColor: colors.line },
  progressFill: { height: 2, backgroundColor: colors.cobalt },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: scaled(12), letterSpacing: 1.08 },
  h1: { fontFamily: fonts.serif, fontSize: scaled(33), lineHeight: scaled(37), marginTop: spacing.sm },
  deck: { fontFamily: fonts.readingItal, fontSize: scaled(18), lineHeight: scaled(27), marginTop: spacing.sm },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  bylineText: { flex: 1 },
  bylineName: { fontFamily: fonts.body, fontSize: scaled(14) },
  bylineMeta: { fontFamily: fonts.body, fontSize: scaled(12.5), marginTop: 2 },
  sourcePill: {
    backgroundColor: colors.cobaltSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  sourceText: { fontFamily: fonts.bodySemi, fontSize: scaled(12) },
  body: { fontFamily: fonts.body, fontSize: scaled(16), lineHeight: scaled(26), marginTop: 18 },
  h2: { fontFamily: fonts.serif, fontSize: scaled(24), lineHeight: scaled(28), marginTop: spacing.xl },
  pullQuote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.soleil,
    paddingLeft: 18,
    marginTop: spacing.xl,
  },
  pullQuoteText: { fontFamily: fonts.readingItal, fontSize: scaled(19), lineHeight: scaled(28.5) },
  keyPoints: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: 18,
    marginTop: spacing.xl,
  },
  keyLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(11), letterSpacing: 0.66 },
  keyRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  keyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.cobalt, marginTop: 7 },
  keyText: { flex: 1, fontFamily: fonts.body, fontSize: scaled(14.5), lineHeight: scaled(21.75) },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.xl,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  actionBtnActive: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  actionText: { fontFamily: fonts.bodyMed, fontSize: scaled(15) },
});
