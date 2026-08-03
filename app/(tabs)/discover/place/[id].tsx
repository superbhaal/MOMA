import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
import { discoverMapUri, openInGoogleMaps } from '@/lib/maps';
import { categoryLabel } from '@/constants/discover';
import { useLovedSpot } from '@/hooks/useLovedSpots';

const HERO_H = 280;

const HEALTHCARE_NOTE =
  'This is a personal recommendation from another mom. Always do your own due diligence for healthcare decisions.';

/** Time-since in coarse, warm units ("3 days ago"). */
function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const day = 86400;
  if (secs < 3600) return 'just now';
  if (secs < day) return `${Math.floor(secs / 3600)}h ago`;
  const days = Math.floor(secs / day);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function LovedSpotDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { spot, loading, error } = useLovedSpot(id);
  const [heroFailed, setHeroFailed] = useState(false);

  const back = () => router.back();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.cobalt} />
      </View>
    );
  }

  if (error || !spot) {
    return (
      <View style={[styles.container, styles.center]}>
        <Typography variant="bodyL" color={colors.muted} style={styles.centerText}>
          {error ?? 'This recommendation is no longer available.'}
        </Typography>
        <Pressable onPress={back} hitSlop={8}>
          <Typography style={styles.backLink} color={colors.cobalt}>
            ‹ Back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const isPerson = spot.kind === 'person';
  const ring = spot.poster?.profile_color ?? colors.fuchsia;
  const who = spot.poster?.display_name ?? 'a mom';
  const heroUri = discoverMapUri([spot], { width: 393, height: HERO_H, zoom: 15 });

  const onOpenMaps = () =>
    openInGoogleMaps({
      name: spot.name,
      address: spot.address,
      lat: spot.lat,
      lng: spot.lng,
      category: spot.category,
      place_id: spot.place_id,
    });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — place: static map; person: circular avatar treatment. */}
        <View style={styles.hero}>
          {isPerson ? (
            <View style={styles.personHero}>
              <Avatar name={who} ringColor={ring} size={132} ringWidth={3} />
            </View>
          ) : heroUri && !heroFailed ? (
            <Image
              source={{ uri: heroUri }}
              style={styles.heroImg}
              resizeMode="cover"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]} />
          )}
          <Pressable
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
            onPress={back}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Typography style={styles.name} color={colors.cobalt}>
            {spot.name}
          </Typography>
          {spot.address ? (
            <Typography style={styles.address} color={colors.labelMuted}>
              {spot.address}
            </Typography>
          ) : null}

          <View style={styles.catPill}>
            <Typography style={styles.catText} color={colors.labelMuted}>
              {categoryLabel(spot.category).toUpperCase()}
            </Typography>
          </View>

          {/* Posted-by — the trust anchor → the contributor's profile. */}
          <Pressable
            style={({ pressed }) => [styles.postedRow, pressed && styles.postedPressed]}
            onPress={() =>
              router.push({ pathname: '/discover/contributor/[id]', params: { id: spot.poster_id } })
            }
            accessibilityRole="button"
            accessibilityLabel={`See ${who}'s profile`}
          >
            <Avatar name={who} ringColor={ring} size={48} ringWidth={2} />
            <View style={styles.postedMid}>
              <Typography style={styles.postedName} color={colors.text}>
                Posted by {who}
              </Typography>
              <Typography style={styles.postedTime} color={colors.labelMuted}>
                {timeAgo(spot.created_at)}
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.labelTertiary} />
          </Pressable>

          {/* The quote — the emotional core. */}
          <View style={styles.quote}>
            <Typography style={styles.quoteText} color={colors.mutedStrong}>
              “{spot.note}”
            </Typography>
          </View>

          <Button title="Open in Google Maps  ↗" onPress={onOpenMaps} />

          {/* No booking CTA: we can't stand behind a practitioner's booking
              flow, so the phone number below is the only handover we offer. */}
          {isPerson && spot.phone ? (
            <Pressable
              onPress={() => Linking.openURL(`tel:${spot.phone}`).catch(() => {})}
              style={styles.phoneRow}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Call ${spot.name}`}
            >
              <Ionicons name="call-outline" size={16} color={colors.cobalt} />
              <Typography style={styles.phoneText} color={colors.cobalt}>
                {spot.phone}
              </Typography>
            </Pressable>
          ) : null}

          {isPerson ? (
            <View style={styles.disclaimer}>
              <Typography style={styles.disclaimerText} color={colors.soleilInkSm}>
                {HEALTHCARE_NOTE}
              </Typography>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  centerText: { textAlign: 'center' },
  backLink: { fontFamily: fonts.bodySemi, fontSize: 15 },

  hero: { height: HERO_H, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', backgroundColor: colors.sable },
  heroFallback: { backgroundColor: '#EAF0E6' },
  personHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17,17,24,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: spacing.xl },
  name: { fontFamily: fonts.serifItal, fontSize: 30, lineHeight: 35 },
  address: { fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(17,17,24,0.05)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  catText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.66 },

  postedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: spacing.lg,
  },
  postedPressed: { opacity: 0.6 },
  postedMid: { flex: 1 },
  postedName: { fontFamily: fonts.bodyMed, fontSize: 15 },
  postedTime: { fontFamily: fonts.body, fontSize: 13, marginTop: 1 },

  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.cobalt,
    paddingLeft: spacing.lg,
    paddingVertical: 2,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  quoteText: { fontFamily: fonts.readingItal, fontSize: 17, lineHeight: 26 },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  phoneText: { fontFamily: fonts.bodySemi, fontSize: 15 },

  disclaimer: {
    marginTop: spacing.xl,
    backgroundColor: '#FEF4CC',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  disclaimerText: { fontFamily: fonts.bodyMed, fontSize: 12, lineHeight: 18 },
});
