import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { isRegular } from '@/constants/roles';
import { babyAgeCompact } from '@/lib/babyAge';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
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
  const { t } = useTranslation();
  const u = member.user;
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar
        isRegular={isRegular(u.role)}
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
                {'  '}{t('misc.you')}
              </Typography>
            ) : null}
          </Typography>
        </View>
        <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 2 }}>
          {babyAgeCompact(u.baby_dob, u.life_stage, t)}
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
            {t('grp.messageBtn')}
          </Typography>
        </Pressable>
      ) : null}
    </Pressable>
  );
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
