import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { SaveHeart } from './SaveHeart';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import type { LearnReel } from '@/types';

interface ReelCardProps {
  reel: LearnReel;
}

const IG_GRADIENT = ['#f9ce34', '#ee2a7b', '#6228d7'] as const;

/** Vetted-creator reel card (handoff §Reel card). Whole card opens the platform
 *  deep link. Credential pill is mandatory — a reel without one shouldn't ship. */
export function ReelCard({ reel }: ReelCardProps) {
  const isIg = reel.platform === 'instagram';
  const open = () => {
    if (reel.externalUrl) Linking.openURL(reel.externalUrl).catch(() => {});
  };

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Play: ${reel.title}`}
    >
      {/* Thumbnail (16:10). The real cover when the platform gave us one —
          TikTok's oEmbed does, Instagram's no longer exists — and the hex
          gradient underneath it, which is all an Instagram reel ever shows. */}
      <View style={styles.thumb}>
        <LinearGradient
          colors={[reel.thumbnailHex || colors.lavender, 'rgba(17,17,24,0.35)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {reel.thumbnailUrl ? (
          <Image
            source={{ uri: reel.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessible={false}
          />
        ) : null}

        {/* Platform badge */}
        {isIg ? (
          <LinearGradient
            colors={IG_GRADIENT}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.platformBadge}
          >
            <Ionicons name="logo-instagram" size={15} color={colors.white} />
          </LinearGradient>
        ) : (
          <View style={[styles.platformBadge, { backgroundColor: colors.text }]}>
            <Ionicons name="logo-tiktok" size={15} color={colors.white} />
          </View>
        )}

        {/* Play */}
        <View style={styles.play}>
          <Ionicons name="play" size={22} color={colors.text} style={{ marginLeft: 3 }} />
        </View>

        {/* Duration */}
        {reel.durationSec ? (
          <View style={styles.duration}>
            <Typography style={styles.durationText} color={colors.white}>
              {formatSec(reel.durationSec)}
            </Typography>
          </View>
        ) : null}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.metaRow}>
            <View style={styles.dot} />
            <Typography style={styles.meta} color={colors.muted}>
              WATCH · {reel.platform.toUpperCase()}
            </Typography>
          </View>
          <SaveHeart docId={reel._id} docType="watch_reel" />
        </View>

        <Typography style={styles.title} color={colors.text}>
          {reel.title}
        </Typography>

        {/* Hidden entirely when nobody was named — an avatar with no name reads
            as a loading state that never finishes. */}
        {reel.creatorName ? (
          <View style={styles.creatorRow}>
            <Avatar name={reel.creatorName} size={30} ringColor={colors.cobalt} ringWidth={1.5} />
            <Typography style={styles.creatorName} color={colors.text}>
              {reel.creatorName}
            </Typography>
            {reel.credential ? (
              <View style={styles.credential}>
                <Typography style={styles.credentialText} color={colors.cobalt}>
                  {reel.credential.toUpperCase()}
                </Typography>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* A community reel is vouched for by a mom, not by an editor. Her
            line is why anyone taps it, so it sits under the creator the way a
            credential does — attributed, because attribution is the whole
            trust model on this side of the feed. */}
        {reel.community?.note ? (
          <Typography style={styles.communityNote} color={colors.mutedStrong}>
            &ldquo;{reel.community.note}&rdquo;
          </Typography>
        ) : null}
        {reel.community?.posterName ? (
          <Typography style={styles.communityPoster} color={colors.muted}>
            SHARED BY {reel.community.posterName.split(' ')[0].toUpperCase()}
          </Typography>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatSec(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// v11 "menu listing": framed thumbnail floating on white, centred body type.
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.65 },
  thumb: {
    aspectRatio: 16 / 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  platformBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(17,17,24,0.7)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationText: textStyles.controlStrong,
  body: { paddingTop: 12, alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.fuchsia },
  meta: textStyles.labelS,
  title: {
    ...textStyles.cardTitle,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: '88%',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  creatorName: textStyles.cardBody,
  credential: {},
  credentialText: textStyles.labelS,
  communityNote: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '86%',
  },
  communityPoster: { ...textStyles.labelS, marginTop: 6 },
});
