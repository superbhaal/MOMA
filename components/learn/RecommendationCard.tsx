import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { SaveHeart } from './SaveHeart';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { LearnRecommendation } from '@/types';

interface RecommendationCardProps {
  recco: LearnRecommendation;
  onPress: () => void;
}

export function RecommendationCard({ recco, onPress }: RecommendationCardProps) {
  const heroBg = recco.heroGradient?.from ?? colors.peche;
  return (
    <Card onPress={onPress} padded={false}>
      <View style={[styles.hero, { backgroundColor: heroBg }]}>
        <View style={styles.heroOverlay}>
          <Pill
            label={recco.category.toUpperCase()}
            bg="rgba(255,255,255,0.85)"
            textColor={colors.text}
          />
        </View>
        <Typography
          variant="displayL"
          color={colors.text}
          style={styles.heroTitle}
        >
          {recco.title}
        </Typography>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Pill label="RECCO" tone="lime" active />
          <SaveHeart docId={recco._id} docType="recommendation" />
        </View>

        <Typography
          variant="bodyL"
          color={colors.muted}
          style={{ marginTop: spacing.sm }}
          numberOfLines={3}
        >
          {recco.body}
        </Typography>

        <View style={styles.contributor}>
          <View style={styles.dotName}>
            {recco.verified ? (
              <View style={styles.verifiedDot} />
            ) : null}
            <Typography variant="bodyM" color={colors.muted}>
              {recco.contributorName}
            </Typography>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 160,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 30,
  },
  body: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contributor: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotName: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fuchsia,
  },
});
