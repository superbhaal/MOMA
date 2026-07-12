import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import type { GroupMemberWithUser } from '@/types';

interface MemberRowProps {
  member: GroupMemberWithUser;
  onPress?: () => void;
  onMessage?: () => void;
}

export function MemberRow({ member, onPress, onMessage }: MemberRowProps) {
  const u = member.user;
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar
        name={u.display_name}
        ringColor={u.profile_color ?? colors.fuchsia}
        photoUrl={u.avatar_url ?? undefined}
        size={48}
      />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.nameRow}>
          <Typography variant="displayS" color={colors.text}>
            {u.display_name}
          </Typography>
          {member.role === 'mentor' ? (
            <Pill label="MENTOR" tone="soleil" active bg={colors.soleil} />
          ) : null}
        </View>
        <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 2 }}>
          {babyAgeShort(u.baby_dob)}
          {u.neighbourhood ? ` · ${u.neighbourhood.toLowerCase()}` : ''}
        </Typography>
      </View>
      {onMessage ? (
        <Pressable onPress={onMessage} hitSlop={10} style={styles.msgBtn}>
          <Typography variant="labelS" color={colors.cobalt}>
            MESSAGE
          </Typography>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function babyAgeShort(dob: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    const w = Math.ceil(Math.abs(diffDays) / 7);
    return `expecting · ${w}w left`;
  }
  if (diffDays < 14) return `${diffDays}d`;
  if (diffDays < 90) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365 * 2) return `${Math.floor(diffDays / 30)}mo`;
  return `${Math.floor(diffDays / 365)}y`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  msgBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
