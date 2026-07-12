import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { SaveHeart } from './SaveHeart';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { LearnReel } from '@/types';

interface WatchCardProps {
  reel: LearnReel;
  onPress: () => void;
}

export function WatchCard({ reel, onPress }: WatchCardProps) {
  return (
    <Card onPress={onPress} padded={false}>
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: reel.thumbnailHex || colors.lavender,
          },
        ]}
      >
        <Typography variant="displayXL" color={colors.white} style={styles.play}>
          ▸
        </Typography>
        <View style={styles.platformBadge}>
          <Typography variant="labelS" color={colors.white}>
            {reel.platform.toUpperCase()}
          </Typography>
        </View>
        <View style={styles.duration}>
          <Typography variant="labelS" color={colors.white}>
            {formatSec(reel.durationSec)}
          </Typography>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Pill label="WATCH" tone="fuchsia" active />
          <SaveHeart docId={reel._id} docType="watch_reel" />
        </View>

        <Typography
          variant="displayM"
          color={colors.text}
          style={{ marginTop: spacing.sm }}
        >
          {reel.title}
        </Typography>

        <View style={styles.creator}>
          <Typography variant="bodyM" color={colors.text}>
            {reel.creatorName}
          </Typography>
          <Pill label={reel.credential} bg={colors.soleil} textColor={colors.text} />
        </View>
      </View>
    </Card>
  );
}

function formatSec(s: number | undefined): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  thumb: {
    height: 180,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    fontSize: 56,
    opacity: 0.9,
  },
  platformBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  duration: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  body: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
