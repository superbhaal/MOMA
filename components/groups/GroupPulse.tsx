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
  const text = pulseText(lastMessage, lastActiveAt);
  const dotColor = isHot(lastActiveAt) ? colors.fuchsia : colors.muted;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Typography variant="bodyM" color={colors.muted}>
        {text}
      </Typography>
    </View>
  );
}

function isHot(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const ageMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  return ageMin < 60;
}

function pulseText(lastMessage: Message | null, lastActiveAt: string | null): string {
  if (!lastActiveAt) return 'quiet today';
  const ageMin = (Date.now() - new Date(lastActiveAt).getTime()) / 60000;
  if (ageMin < 5) return 'talking now';
  if (ageMin < 60) return `active ${Math.round(ageMin)}m ago`;
  if (ageMin < 60 * 24) return `last seen ${Math.round(ageMin / 60)}h ago`;
  return 'quiet today';
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
