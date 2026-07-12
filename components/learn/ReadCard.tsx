import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { SaveHeart } from './SaveHeart';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { LearnArticle } from '@/types';

interface ReadCardProps {
  article: LearnArticle;
  onPress: () => void;
}

export function ReadCard({ article, onPress }: ReadCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={styles.headerRow}>
        <Pill label="READ" tone="cobalt" active />
        <SaveHeart docId={article._id} docType="read_article" />
      </View>

      <Typography
        variant="displayM"
        color={colors.text}
        style={{ marginTop: spacing.sm }}
      >
        {article.title}
      </Typography>
      {article.deck ? (
        <Typography
          variant="readingItal"
          color={colors.mutedStrong}
          style={{ marginTop: 4, fontFamily: 'Lora-Italic', fontSize: 14 }}
        >
          {article.deck}
        </Typography>
      ) : null}

      <View style={styles.meta}>
        <Typography variant="bodyM" color={colors.muted}>
          {article.author} · {article.readMinutes ?? 5} min read
        </Typography>
        {article.source ? (
          <Pill label={article.source} bg={colors.cobalt} textColor={colors.white} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
