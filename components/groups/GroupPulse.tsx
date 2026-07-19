import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import type { Message } from '@/types';

interface GroupPulseProps {
  lastMessage: Message | null;
  lastActiveAt: string | null;
}

/** "3 talking now · 12 messages today" / "Quiet today" — light heuristic from last_active. */
export function GroupPulse({ lastMessage, lastActiveAt }: GroupPulseProps) {
  // Effective activity = whichever is more recent. Falling back to the last
  // message keeps the pulse correct even if groups.last_active_at is stale/null.
  const activeAt = mostRecent(lastActiveAt, lastMessage?.created_at ?? null);
  const text = pulseText(activeAt);
  const dotColor = isHot(activeAt) ? colors.fuchsia : colors.muted;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Typography variant="bodyM" color={colors.muted}>
        {text}
      </Typography>
    </View>
  );
}

function mostRecent(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function isHot(activeAt: string | null): boolean {
  if (!activeAt) return false;
  const ageMin = (Date.now() - new Date(activeAt).getTime()) / 60000;
  return ageMin < 60;
}

function pulseText(activeAt: string | null): string {
  if (!activeAt) return 'quiet today';
  const ageMin = (Date.now() - new Date(activeAt).getTime()) / 60000;
  if (ageMin < 5) return 'talking now';
  if (ageMin < 60) return `active ${Math.round(ageMin)}m ago`;
  if (ageMin < 60 * 24) return `last seen ${Math.round(ageMin / 60)}h ago`;
  return 'quiet today';
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
