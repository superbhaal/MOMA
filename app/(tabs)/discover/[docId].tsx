import { currentLocale } from '@/lib/i18n';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { envBadgeInset } from '@/components/ui/EnvBadge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { learnCategoryLabel, stageLabel } from '@/constants/discover';
import { useLearnDoc } from '@/hooks/useLearn';
import { useSavedTips } from '@/hooks/useSavedTips';
import type { LearnArticle, LearnReel, SanityBlock } from '@/types';
import { learnSaveId } from '@/lib/sanity';

/**
 * Where a shared article points.
 *
 * This used to be the bare https://joinmoma.org — the coming-soon page. Whoever received the share
 * got the title as plain text and a link to a landing page that said nothing
 * about it. /learn/<id> is registered in the AASA, so someone who has møma
 * lands on the piece itself, and someone who does not gets a page offering the
 * app. Maria described exactly this, and it is the same pattern as
 * /auth/confirm and /group-preview.
 */
function articleUrl(docId: string, locale: string): string {
  return `https://joinmoma.org/learn/${encodeURIComponent(docId)}?lang=${locale}`;
}

export default function DiscoverDetail() {
  const { t } = useTranslation();
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
      {/* The env badge floats over the top-right corner with a huge zIndex,
          and the reading-time pill sits exactly under it. envBadgeInset is 0
          wherever the badge doesn't render, so nothing shifts in production. */}
      <View style={[styles.topbar, { paddingRight: spacing.xl + envBadgeInset() }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.cobalt} />
          <Typography style={styles.backText} color={colors.cobalt} numberOfLines={1}>
            {t('dis.masthead')}
          </Typography>
        </Pressable>
        {isArticle ? (
          <View style={styles.progressPill}>
            <Typography style={styles.progressText} color={colors.muted}>
              {t('dis.minLeft', { count: minutesLeft })}
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
  const { t } = useTranslation();
  const { isSaved, toggle } = useSavedTips();
  const saved = isSaved(learnSaveId(article));

  const eyebrow = useMemo(() => {
    const parts = [
      learnCategoryLabel(article.category, t),
      article.babyStage ? stageLabel(article.babyStage, t) : null,
    ].filter(
      Boolean,
    );
    return parts.join(' · ');
    // t belongs in the deps: without it the eyebrow keeps the language it
    // was first rendered in when she switches in Settings.
  }, [article.category, article.babyStage, t]);

  // Articles have no page of their own on the web, so the link we share is the
  // site. Without it the share sheet only ever carried a bare line of text —
  // nothing the recipient could tap. iOS takes the link in `url`; Android
  // ignores that field, so it goes inline in the message instead.
  const onShare = () => {
    const text = [article.title, article.deck, article.source ? `Source: ${article.source}` : null]
      .filter(Boolean)
      .join('\n\n');
    const url = articleUrl(learnSaveId(article), currentLocale());
    Share.share(
      Platform.OS === 'ios'
        ? { message: text, url, title: article.title }
        : { message: `${text}\n\n${url}`, title: article.title },
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

      {/* Byline.
          The source pill used to sit in this row, beside the name. React
          Native defaults flexShrink to 0 — unlike the web — so a long source
          ("Archives of Women's Mental Health, 2023") claimed its full width
          and squeezed the author column to about forty points. The name then
          wrapped at one or two characters per line, down the whole screen.
          Maria: "if the tag of the source is too long then put it at the top
          or bottom". It now sits below, on its own line, where its length
          cannot cost anything. */}
      <View style={styles.byline}>
        <Avatar name={article.author ?? '—'} size={48} ringColor={colors.cobalt} ringWidth={1.5} />
        <View style={styles.bylineText}>
          <Typography style={styles.bylineName} color={colors.text}>
            {article.author}
          </Typography>
          <Typography style={styles.bylineMeta} color={colors.muted}>
            {[article.authorTitle, t('dis.minRead', { count: article.readMinutes ?? 5 })]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
          {article.source ? (
            <View style={styles.sourcePill}>
              <Typography style={styles.sourceText} color={colors.cobalt} numberOfLines={2}>
                {article.source}
              </Typography>
            </View>
          ) : null}
        </View>
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
              {t('misc.keyPoints')}
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
          // The title has to travel with the save. SaveHeart on the feed cards
          // passes it; this button — the one you actually reach, at the end of
          // the article — did not, so the shelf showed "an article you saved"
          // with no way to tell which. Maria reported it on build 11 and again
          // on 30; it was one missing argument the whole time.
          onPress={() => toggle(learnSaveId(article), 'read_article', article.title)}
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
            {t('misc.shareAction')}
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
  const { t } = useTranslation();
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
          title={t('dis.openIn', { platform: reel.platform })}
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
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
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
