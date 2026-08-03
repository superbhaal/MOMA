import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import type { GroupMemberWithUser } from '@/types';

interface GroupPreviewCardProps {
  member: GroupMemberWithUser;
  /** Italic cobalt one-liner explaining why this member matches the viewer. */
  matchNote?: string;
}

/**
 * Cream member card on the group-preview screen. Matches `.preview-member` in
 * design/moma-enhanced.html: avatar with ring + name (+ Mentor pill) + muted
 * detail line + italic cobalt match-note.
 */
export function GroupPreviewCard({ member, matchNote }: GroupPreviewCardProps) {
  const u = member.user;
  return (
    <View style={styles.row}>
      <Avatar
        name={u.display_name}
        ringColor={u.profile_color ?? colors.fuchsia}
        photoUrl={u.avatar_url ?? undefined}
        size={48}
      />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Typography style={styles.name} color={colors.text}>
            {u.display_name}
          </Typography>
          {member.role === 'mentor' ? (
            <View style={styles.mentorPill}>
              <Typography style={styles.mentorPillText} color="#2A1A00">
                MENTOR
              </Typography>
            </View>
          ) : null}
        </View>
        <Typography style={styles.detail} color={colors.muted}>
          {babyAgeShort(u.baby_dob, u.life_stage)}
          {u.neighbourhood ? ` · ${u.neighbourhood}` : ''}
        </Typography>
        {matchNote ? (
          <Typography style={styles.matchNote} color={colors.cobalt}>
            {matchNote}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

function babyAgeShort(dob: string, stage: string | null): string {
  const days = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (stage === 'expecting' || days < 0) {
    const w = Math.max(1, Math.ceil(Math.abs(days) / 7));
    return `Due in ${w}w`;
  }
  if (days < 14) return `Baby: ${days}d`;
  if (days < 90) return `Baby: ${Math.floor(days / 7)}w`;
  if (days < 365 * 2) return `Baby: ${Math.floor(days / 30)}mo`;
  return `Baby: ${Math.floor(days / 365)}y`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(15),
    lineHeight: scaled(20),
  },
  mentorPill: {
    backgroundColor: colors.soleil,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mentorPillText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(8.5),
    letterSpacing: 1,
  },
  detail: {
    fontSize: scaled(11),
    lineHeight: scaled(16),
    marginTop: 2,
  },
  matchNote: {
    fontFamily: 'Lora-Italic',
    fontSize: scaled(11),
    lineHeight: scaled(15),
    marginTop: 3,
  },
});
