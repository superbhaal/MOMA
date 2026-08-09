import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { staticMapUri } from '@/lib/maps';
import { categoryLabel } from '@/constants/discover';
import type { LovedSpotWithPoster } from '@/types';

interface LovedSpotRowProps {
  spot: LovedSpotWithPoster;
  onPress: () => void;
  /** Marks a spot the current user added (contributor variant). */
  addedByYou?: boolean;
}

/**
 * One row in the Explore sheet. Place → static-map thumbnail; person → avatar
 * with the recommender's identity ring. Meta attributes the recommendation to a
 * named human. Trailing identity dot in the recommender's colour.
 */
export function LovedSpotRow({ spot, onPress, addedByYou }: LovedSpotRowProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const ring = spot.poster?.profile_color ?? colors.fuchsia;
  const who = spot.poster?.display_name ?? 'a mom';
  const cat = categoryLabel(spot.category);
  const meta = spot.kind === 'place' ? `${who} · ${cat}` : `Loved by ${who} · ${cat}`;
  const thumb = staticMapUri(spot);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={spot.name}
    >
      {spot.kind === 'place' ? (
        thumb && !thumbFailed ? (
          <Image
            source={{ uri: thumb }}
            style={styles.thumb}
            resizeMode="cover"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Typography variant="displayS" color={ring}>
              ◍
            </Typography>
          </View>
        )
      ) : (
        <Avatar name={who} ringColor={ring} size={48} ringWidth={2} />
      )}

      <View style={styles.middle}>
        <Typography style={styles.name} color={colors.text} numberOfLines={1}>
          {spot.name}
        </Typography>
        <View style={styles.metaRow}>
          <Typography style={styles.meta} color={colors.labelMuted} numberOfLines={1}>
            {meta}
          </Typography>
          {addedByYou ? (
            <View style={styles.youTag}>
              <Typography style={styles.youText} color={colors.cobalt}>
                added by you
              </Typography>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.dot, { backgroundColor: ring }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pressed: { opacity: 0.6 },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.sable },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1, gap: 2 },
  // A loved spot is a feed card in a row's clothing — same two ranks as Read
  // and Watch, so the three tabs read as one feed.
  name: textStyles.cardTitle,
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { ...textStyles.cardBody, flexShrink: 1 },
  youTag: {
    backgroundColor: colors.cobaltSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  youText: textStyles.labelS,
  dot: { width: 10, height: 10, borderRadius: 5 },
});
