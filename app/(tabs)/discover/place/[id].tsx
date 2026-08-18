import { useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
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
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteLovedSpot } from '@/hooks/useDeleteLovedSpot';
import { useLovedPlace } from '@/hooks/useLovedSpots';

const HERO_H = 280;

/** One tappable line of contact — phone, email or site. */
function ContactRow({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: 'call-outline' | 'mail-outline' | 'globe-outline';
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.phoneRow}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={16} color={colors.cobalt} />
      <Typography style={styles.phoneText} color={colors.cobalt} numberOfLines={1}>
        {label}
      </Typography>
    </Pressable>
  );
}


/** Time-since in coarse, warm units ("3 days ago"). */
function timeAgo(iso: string, t: TFunction): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const day = 86400;
  if (secs < 3600) return t('expl.justNow');
  if (secs < day) return t('expl.hAgo', { n: Math.floor(secs / 3600) });
  const days = Math.floor(secs / day);
  if (days === 1) return t('expl.yesterday');
  if (days < 7) return t('expl.dAgo', { n: days });
  if (days < 30) return t('expl.wAgo', { n: Math.floor(days / 7) });
  if (days < 365) return t('expl.moAgo', { n: Math.floor(days / 30) });
  return t('expl.yAgo', { n: Math.floor(days / 365) });
}

export default function LovedSpotDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { place: spot, loading, error } = useLovedPlace(id);
  const { user } = useAuth();
  const { remove, deleting } = useDeleteLovedSpot();
  const [heroFailed, setHeroFailed] = useState(false);

  const back = () => router.back();
  // My own recommendation inside this place's group, if I made one.
  const mine = user && spot ? spot.recommendations.find((r) => r.poster_id === user.id) : null;
  const isMine = !!mine;

  function confirmDelete() {
    if (!spot) return;
    Alert.alert(
      'Remove your recommendation?',
      'It comes off the map. If other moms have recommended this place too, theirs stay.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await remove(mine!.spot_id);
            if (err) {
              Alert.alert("Couldn't remove it", err);
              return;
            }
            // The place survives if others recommended it too — but this route
            // is keyed on the row we just deleted, so refreshing here would ask
            // for a spot that no longer exists and land on "no longer
            // available". Re-open on a surviving sibling instead.
            const survivor = spot.recommendations.find((r) => r.spot_id !== mine!.spot_id);
            if (survivor) {
              router.replace({
                pathname: '/discover/place/[id]',
                params: { id: survivor.spot_id },
              });
            } else {
              router.replace('/discover/explore');
            }
          },
        },
      ],
    );
  }

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
  // The hero's identity treatment follows the first recommendation — for a
  // person, whose face the page is about, that's whoever vouched for them first.
  const ring = spot.recommendations[0]?.poster_color ?? colors.fuchsia;
  const who = spot.recommendations[0]?.poster_name ?? t('expl.aMom');
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
        {/* Hero — the poster's own photo when there is one, then the static
            map, then a plain block. The photo wins: the composer has been
            asking for "one picture that captures it best" since v1.0.2 and
            uploading it to a bucket nothing ever read. A café someone
            photographed says more than a street plan of it. */}
        <View style={styles.hero}>
          {spot.photo_url ? (
            <Image
              source={{ uri: spot.photo_url }}
              style={styles.heroImg}
              resizeMode="cover"
            />
          ) : isPerson ? (
            <View style={styles.personHero}>
              <Avatar name={who} ringColor={ring} size={132} ringWidth={3} />
            </View>
          ) : heroUri && !heroFailed ? (
            // The map itself opens Google Maps — a tester expected to tap it
            // rather than hunt for the button below.
            <Pressable
              onPress={onOpenMaps}
              accessibilityRole="button"
              accessibilityLabel={t('expl.openMapsA11y', { name: spot.name })}
            >
              <Image
                source={{ uri: heroUri }}
                style={styles.heroImg}
                resizeMode="cover"
                onError={() => setHeroFailed(true)}
              />
            </Pressable>
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
              {categoryLabel(spot.category, t).toUpperCase()}
            </Typography>
          </View>

          {/* Every mom who vouched for this, newest first. One is a name;
              several is the reason the grouping exists — the reader should see
              at a glance that this isn't one person's opinion. */}
          {spot.rec_count > 1 ? (
            <View style={styles.lovesRow}>
              <Ionicons name="heart" size={15} color={colors.fuchsia} />
              <Typography style={styles.lovesText} color={colors.fuchsia}>
                Loved by {spot.rec_count} moms
              </Typography>
            </View>
          ) : null}

          {spot.recommendations.map((r) => (
            <View key={r.spot_id} style={styles.rec}>
              <Pressable
                style={({ pressed }) => [styles.postedRow, pressed && styles.postedPressed]}
                onPress={() =>
                  router.push({
                    pathname: '/discover/contributor/[id]',
                    params: { id: r.poster_id },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`See ${r.poster_name ?? 'her'} profile`}
              >
                {/* Her identity, not her photo of the café — those are two
                    different pictures and the avatar belongs to the first. */}
                <Avatar
                  name={r.poster_name ?? t('expl.aMom')}
                  ringColor={r.poster_color ?? colors.fuchsia}
                  size={48}
                  ringWidth={2}
                />
                <View style={styles.postedMid}>
                  <Typography style={styles.postedName} color={colors.text}>
                    {t('expl.postedBy', { name: r.poster_name ?? t('expl.aMom') })}
                  </Typography>
                  <Typography style={styles.postedTime} color={colors.labelMuted}>
                    {timeAgo(r.created_at, t)}
                  </Typography>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.labelTertiary} />
              </Pressable>

              {/* The quote — the emotional core. */}
              <View style={styles.quote}>
                <Typography style={styles.quoteText} color={colors.mutedStrong}>
                  “{r.note}”
                </Typography>
              </View>

              {/* Her own picture, under her own words. Only when several moms
                  have posted: with one recommendation the hero above already IS
                  this photo, and showing it twice on one screen is a bug that
                  looks like a decision. */}
              {r.photo_url && spot.rec_count > 1 ? (
                <Image
                  source={{ uri: r.photo_url }}
                  style={styles.recPhoto}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          ))}

          <Button title={t('expl.openMaps')} onPress={onOpenMaps} />

          {/* Whatever the poster offered as a way through. Still no booking
              CTA — we hand over the details, we don't run someone else's
              booking flow. Shown for places too now, not just practitioners:
              the composer asks everyone. */}
          {spot.phone ? (
            <ContactRow
              icon="call-outline"
              label={spot.phone}
              onPress={() => Linking.openURL(`tel:${spot.phone}`).catch(() => {})}
              accessibilityLabel={`Call ${spot.name}`}
            />
          ) : null}
          {spot.email ? (
            <ContactRow
              icon="mail-outline"
              label={spot.email}
              onPress={() => Linking.openURL(`mailto:${spot.email}`).catch(() => {})}
              accessibilityLabel={`Email ${spot.name}`}
            />
          ) : null}
          {spot.booking_url ? (
            <ContactRow
              icon="globe-outline"
              label={spot.booking_url.replace(/^https?:\/\//, '')}
              onPress={() => {
                const url = spot.booking_url!.startsWith('http')
                  ? spot.booking_url!
                  : `https://${spot.booking_url}`;
                Linking.openURL(url).catch(() => {});
              }}
              accessibilityLabel={`Open ${spot.name}'s website`}
            />
          ) : null}

          {isPerson ? (
            <View style={styles.disclaimer}>
              <Typography style={styles.disclaimerText} color={colors.soleilInkSm}>
                {t('expl.disclaimerOne')}
              </Typography>
            </View>
          ) : null}

          {/* Yours to take back. Quiet and at the bottom — it's a door, not an
              invitation. RLS has always allowed this; only the screen was
              missing. */}
          {isMine ? (
            <Pressable
              onPress={confirmDelete}
              disabled={deleting}
              style={styles.deleteRow}
              hitSlop={10}
              accessibilityRole="button"
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.cherry} />
              ) : (
                <Typography style={styles.deleteText} color={colors.cherry}>
                  Remove my recommendation
                </Typography>
              )}
            </Pressable>
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
  backLink: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },

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
  name: { fontFamily: fonts.serifItal, fontSize: scaled(30), lineHeight: scaled(35) },
  address: { fontFamily: fonts.body, fontSize: scaled(14), marginTop: 4 },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(17,17,24,0.05)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  catText: { fontFamily: fonts.bodySemi, fontSize: scaled(11), letterSpacing: 0.66 },

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
  postedName: { fontFamily: fonts.bodyMed, fontSize: scaled(15) },
  postedTime: { fontFamily: fonts.body, fontSize: scaled(13), marginTop: 1 },

  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.cobalt,
    paddingLeft: spacing.lg,
    paddingVertical: 2,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  quoteText: { fontFamily: fonts.readingItal, fontSize: scaled(17), lineHeight: scaled(26) },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  phoneText: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },
  lovesRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.lg },
  lovesText: { fontFamily: fonts.bodySemi, fontSize: scaled(13) },
  rec: { marginTop: spacing.md },
  recPhoto: { width: '100%', height: 160, borderRadius: radius.lg, marginTop: spacing.md },
  deleteRow: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  deleteText: { fontFamily: fonts.bodyMed, fontSize: scaled(13) },

  disclaimer: {
    marginTop: spacing.xl,
    backgroundColor: '#FEF4CC',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  disclaimerText: { fontFamily: fonts.bodyMed, fontSize: scaled(12), lineHeight: scaled(18) },
});
