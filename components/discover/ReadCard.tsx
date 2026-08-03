import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { SaveHeart } from './SaveHeart';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import type { LearnArticle } from '@/types';

interface ReadCardProps {
  article: LearnArticle;
  onPress: () => void;
}

/** Long-form article card (handoff §Read card). White surface, hairline, cobalt
 *  meta dot, Cormorant title, one-line takeaway, cobalt-soft source pill. */
export function ReadCard({ article, onPress }: ReadCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <View style={styles.topRow}>
        <View style={styles.metaRow}>
          <View style={styles.dot} />
          <Typography style={styles.meta} color={colors.muted}>
            READ · {article.readMinutes ?? 5} MIN
          </Typography>
        </View>
        <SaveHeart docId={article._id} docType="read_article" />
      </View>

      <Typography style={styles.title} color={colors.text}>
        {article.title}
      </Typography>

      {article.deck ? (
        <Typography style={styles.takeaway} color={colors.muted}>
          {article.deck}
        </Typography>
      ) : null}

      {article.source ? (
        <View style={styles.sourcePill}>
          <Typography style={styles.sourceText} color={colors.cobalt}>
            {article.source}
          </Typography>
        </View>
      ) : null}
    </Pressable>
  );
}

// v11 "menu listing": no card chrome — centred type over air, hairline-free.
// Ref: design/moma-v11.html · #menu .well-card rules.
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  pressed: { opacity: 0.65 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.cobalt },
  meta: {
    fontFamily: fonts.bodySemi,
    fontSize: 8.5,
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: '88%',
  },
  takeaway: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '86%',
  },
  sourcePill: { marginTop: 7 },
  sourceText: {
    fontFamily: fonts.bodySemi,
    fontSize: 8,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
