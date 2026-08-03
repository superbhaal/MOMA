import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { Pill } from '@/components/ui/Pill';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import type { GroupMemberWithUser } from '@/types';

interface MemberRowProps {
  member: GroupMemberWithUser;
  /** Renders the quiet "(you)" tag after the name (v11). */
  isSelf?: boolean;
  onPress?: () => void;
  onMessage?: () => void;
}

export function MemberRow({ member, isSelf, onPress, onMessage }: MemberRowProps) {
  const u = member.user;
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar
        name={u.display_name}
        ringColor={u.profile_color ?? colors.fuchsia}
        photoUrl={u.avatar_url ?? undefined}
        size={44}
      />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.nameRow}>
          <Typography style={styles.name} color={colors.text}>
            {u.display_name}
            {isSelf ? (
              <Typography style={styles.you} color={colors.muted}>
                {'  '}(you)
              </Typography>
            ) : null}
          </Typography>
          {member.role === 'mentor' ? (
            <Pill label="MENTOR" tone="soleil" active bg={colors.soleil} />
          ) : null}
        </View>
        <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 2 }}>
          Baby: {babyAgeShort(u.baby_dob)}
          {u.neighbourhood ? ` · ${u.neighbourhood}` : ''}
        </Typography>
      </View>
      {onMessage ? (
        <Pressable
          onPress={onMessage}
          hitSlop={10}
          style={({ pressed }) => [styles.msgBtn, pressed && { opacity: 0.6 }]}
        >
          <Typography style={styles.msgLabel} color={colors.cobalt}>
            Message
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
  if (diffDays < 14) return `${diffDays} days`;
  if (diffDays < 90) return `${Math.floor(diffDays / 7)} weeks`;
  if (diffDays < 365 * 2) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { fontFamily: 'DMSans-Medium', fontSize: scaled(14), lineHeight: scaled(18) },
  you: { fontFamily: 'DMSans-Regular', fontSize: scaled(11) },
  msgBtn: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  msgLabel: { fontFamily: 'DMSans-SemiBold', fontSize: scaled(11.5) },
});
