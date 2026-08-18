import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { kindLabel, broughtCard } from '@/constants/brought';
import type { BroughtItem } from '@/types';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import type { GroupMemberWithUser } from '@/types';

interface GroupPreviewCardProps {
  member: GroupMemberWithUser;
  /** Italic cobalt one-liner explaining why this member matches the viewer. */
  matchNote?: string;
  /** What she's brought to the table, if she has. Not everyone will. */
  brought?: BroughtItem;
}

/**
 * Cream member card on the group-preview screen. Matches `.preview-member` in
 * design/moma-enhanced.html: avatar with ring + name + muted
 * detail line + italic cobalt match-note.
 */
export function GroupPreviewCard({ member, matchNote, brought }: GroupPreviewCardProps) {
  const { t } = useTranslation();
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
        {/* What she's brought, if anything. The client asked for it here and
            only here: four strangers on a screen, and this is the thing that
            makes them read as people. Never a condition of joining — plenty of
            moms won't have brought anything yet. */}
        {brought ? (
          <View style={styles.brought}>
            <Typography style={styles.broughtKind} color={colors.mutedStrong}>
              {kindLabel(t)[brought.kind].toUpperCase()}
            </Typography>
            <Typography style={styles.broughtTitle} color={colors.text} numberOfLines={2}>
              {broughtCard(brought).title}
            </Typography>
          </View>
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
  detail: {
    fontSize: scaled(11),
    lineHeight: scaled(16),
    marginTop: 2,
  },
  brought: { marginTop: spacing.md, alignItems: 'center' },
  broughtKind: textStyles.labelS,
  broughtTitle: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(17),
    lineHeight: scaled(22),
    textAlign: 'center',
    marginTop: 2,
  },

  matchNote: {
    fontFamily: 'Lora-Italic',
    fontSize: scaled(11),
    lineHeight: scaled(15),
    marginTop: 3,
  },
});
