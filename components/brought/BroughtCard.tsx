import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { kindLabel, broughtCard } from '@/constants/brought';
import type { BroughtItem } from '@/types';

interface BroughtCardProps {
  item: BroughtItem;
  onPress?: () => void;
  /** Footer actions, rendered under the card (Me only). */
  children?: React.ReactNode;
  /** Trims to the title alone — the group preview, where four of these stack. */
  compact?: boolean;
}

/**
 * What someone brought, as a card. Three lines whatever the kind, because five
 * layouts for five kinds would read as five features; `broughtCard` decides
 * what fills them.
 *
 * Tappable everywhere it appears — the client chose to give a recipe its own
 * page, and a card you can't open would make that page unreachable.
 */
export function BroughtCard({ item, onPress, children, compact }: BroughtCardProps) {
  const { t } = useTranslation();
  const card = broughtCard(item);

  const body = (
    <>
      <Typography style={styles.kind} color={colors.cobalt}>
        {kindLabel(t)[item.kind].toUpperCase()}
      </Typography>
      <Typography style={styles.title} color={colors.text}>
        {card.title}
      </Typography>
      {!compact && card.line ? (
        <Typography style={styles.line} color={colors.mutedStrong}>
          {card.line}
        </Typography>
      ) : null}
      {!compact && card.note ? (
        <Typography style={styles.note} color={colors.mutedStrong}>
          {card.note}
        </Typography>
      ) : null}
    </>
  );

  return (
    <View style={styles.card}>
      {!compact && item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.photo} resizeMode="cover" />
      ) : null}
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={card.title}>
          {body}
        </Pressable>
      ) : (
        body
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.md },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  kind: textStyles.labelS,
  title: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(24),
    lineHeight: scaled(30),
    marginTop: 4,
  },
  line: { ...textStyles.cardBody, marginTop: 4 },
  note: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    marginTop: 6,
  },
});
