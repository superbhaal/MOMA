import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { staticMapUri } from '@/lib/maps';
import { categoryLabel } from '@/constants/discover';
import type { LovedPlace } from '@/types';

interface LovedSpotRowProps {
  spot: LovedPlace;
  onPress: () => void;
  /** Marks a place the current user recommended (contributor variant). */
  addedByYou?: boolean;
}

/**
 * One row in the Explore sheet — one PLACE, however many moms recommended it.
 *
 * The attribution line names them in order, newest first, and stops at two
 * before falling back to "+N more": three names is a list, two is a sentence.
 * The heart carries the count, which is what the client asked for — a count of
 * moms who vouched, not of anonymous taps.
 */
export function LovedSpotRow({ spot, onPress, addedByYou }: LovedSpotRowProps) {
  const { t } = useTranslation();
  const [thumbFailed, setThumbFailed] = useState(false);
  const recs = spot.recommendations ?? [];
  const ring = recs[0]?.poster_color ?? colors.fuchsia;
  const who = recs[0]?.poster_name ?? 'a mom';
  const cat = categoryLabel(spot.category, t);
  const names =
    recs.length <= 2
      ? recs.map((r) => r.poster_name ?? 'a mom').join(' & ')
      : `${recs
          .slice(0, 2)
          .map((r) => r.poster_name ?? 'a mom')
          .join(', ')} +${recs.length - 2}`;
  const meta = spot.kind === 'place' ? `${names} · ${cat}` : `Loved by ${names} · ${cat}`;
  // Her photo before the street plan — same order as the detail hero.
  const thumb = spot.photo_url ?? staticMapUri(spot);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={spot.name}
    >
      {spot.kind === 'place' || spot.photo_url ? (
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

      {/* The count only earns its place once it says something a single name
          doesn't. One recommendation shows the identity dot, as before. */}
      {spot.rec_count > 1 ? (
        <View style={styles.loves}>
          <Ionicons name="heart" size={13} color={colors.fuchsia} />
          <Typography style={styles.lovesCount} color={colors.fuchsia}>
            {spot.rec_count}
          </Typography>
        </View>
      ) : (
        <View style={[styles.dot, { backgroundColor: ring }]} />
      )}
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
  loves: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lovesCount: textStyles.controlStrong,
  dot: { width: 10, height: 10, borderRadius: 5 },
});
