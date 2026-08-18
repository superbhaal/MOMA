import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { discoverMapUri, openInGoogleMaps, staticMapUri } from '@/lib/maps';
import { categoryLabel } from '@/constants/discover';
import { scaled } from '@/constants/scale';
import { useContributor } from '@/hooks/useLovedSpots';
import type { LovedSpotWithPoster } from '@/types';

export default function ContributorProfile() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { contributor, spots, loading, error } = useContributor(id);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.cobalt} />
      </View>
    );
  }
  if (error || !contributor) {
    return (
      <View style={[styles.container, styles.center]}>
        <Typography variant="bodyL" color={colors.muted} style={{ textAlign: 'center' }}>
          {error ?? 'This profile is no longer available.'}
        </Typography>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography style={styles.backLink} color={colors.cobalt}>
            ‹ Back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const ring = contributor.profile_color ?? colors.fuchsia;
  const meta = [contributor.neighbourhood, contributor.city].filter(Boolean).join(' · ');
  const mapW = Math.round(width - spacing.xl * 2);
  const miniMap = discoverMapUri(spots, { width: mapW, height: 150 });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
          paddingHorizontal: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
          <Typography style={styles.backLink} color={colors.cobalt}>
            ‹ Back
          </Typography>
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <Avatar name={contributor.display_name} ringColor={ring} size={110} ringWidth={3} />
          <Typography style={styles.name} color={colors.cobalt}>
            {contributor.display_name}
          </Typography>
          {meta ? (
            <Typography style={styles.meta} color={colors.labelMuted}>
              {meta}
            </Typography>
          ) : null}
        </View>

        {contributor.bio ? (
          <Typography style={styles.bio} color={colors.mutedStrong}>
            {contributor.bio}
          </Typography>
        ) : null}

        {contributor.interests?.length ? (
          <View style={styles.interests}>
            {contributor.interests.map((it) => (
              <View key={it} style={styles.interestPill}>
                <Typography style={styles.interestText} color={colors.text}>
                  {it}
                </Typography>
              </View>
            ))}
          </View>
        ) : null}

        <Typography style={styles.sectionLabel} color={colors.labelTertiary}>
          {`LOVED SPOTS · ${contributor.spot_count}${contributor.city ? ` IN ${contributor.city.toUpperCase()}` : ''}`}
        </Typography>

        {miniMap ? (
          <Image source={{ uri: miniMap }} style={styles.miniMap} resizeMode="cover" />
        ) : null}

        {spots.map((s, i) => (
          <ContributedRow
            key={s.id}
            spot={s}
            highlighted={i === 0}
            onPress={() => router.push({ pathname: '/discover/place/[id]', params: { id: s.id } })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ContributedRow({
  spot,
  highlighted,
  onPress,
}: {
  spot: LovedSpotWithPoster;
  highlighted?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const ring = spot.poster?.profile_color ?? colors.fuchsia;
  const thumb = staticMapUri(spot);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, highlighted && styles.rowHighlight]}
      accessibilityRole="button"
      accessibilityLabel={spot.name}
    >
      <View style={styles.rowTop}>
        {spot.kind === 'place' && thumb && !failed ? (
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" onError={() => setFailed(true)} />
        ) : spot.kind === 'person' ? (
          <Avatar name={spot.poster?.display_name ?? spot.name} ringColor={ring} size={56} ringWidth={2} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Typography variant="displayS" color={ring}>◍</Typography>
          </View>
        )}
        <View style={styles.rowMid}>
          <Typography style={styles.rowName} color={colors.text} numberOfLines={1}>
            {spot.name}
          </Typography>
          <Typography style={styles.rowNote} color={colors.mutedStrong} numberOfLines={2}>
            “{spot.note}”
          </Typography>
        </View>
        <View style={[styles.dot, { backgroundColor: ring }]} />
      </View>
      <View style={styles.rowFoot}>
        <View style={styles.catPill}>
          <Typography style={styles.catText} color={colors.labelMuted}>
            {categoryLabel(spot.category, t).toUpperCase()}
          </Typography>
        </View>
        <Pressable
          onPress={() =>
            openInGoogleMaps({
              name: spot.name,
              address: spot.address,
              lat: spot.lat,
              lng: spot.lng,
              category: spot.category,
              place_id: spot.place_id,
            })
          }
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Open ${spot.name} in Google Maps`}
        >
          <Typography style={styles.openMaps} color={colors.cobalt}>
            Open in Maps ↗
          </Typography>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  backRow: { marginBottom: spacing.md },
  backLink: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },

  hero: { alignItems: 'center', gap: spacing.sm },
  name: { fontFamily: fonts.serifItal, fontSize: scaled(32), lineHeight: scaled(38), marginTop: spacing.sm },
  meta: { fontFamily: fonts.body, fontSize: scaled(14) },
  bio: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(15.5),
    lineHeight: scaled(24),
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    marginTop: spacing.lg,
  },
  interestPill: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  interestText: { fontFamily: fonts.body, fontSize: scaled(14) },

  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(12),
    letterSpacing: 0.96,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  miniMap: { width: '100%', height: 150, borderRadius: radius.lg, backgroundColor: '#EAF0E6' },

  row: { paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowHighlight: {
    backgroundColor: colors.cobaltSoft,
    borderRadius: radius.lg,
    borderBottomWidth: 0,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sable },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  rowMid: { flex: 1, gap: 3 },
  rowName: { fontFamily: fonts.serifReg, fontSize: scaled(19), lineHeight: scaled(22) },
  rowNote: { fontFamily: fonts.readingItal, fontSize: scaled(14), lineHeight: scaled(21) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingLeft: 56 + spacing.md,
  },
  catPill: {
    backgroundColor: 'rgba(17,17,24,0.05)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catText: { fontFamily: fonts.bodySemi, fontSize: scaled(10.5), letterSpacing: 0.6 },
  openMaps: { fontFamily: fonts.bodySemi, fontSize: scaled(13) },
});
