import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { GroupPulse } from './GroupPulse';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { GroupWithDetails } from '@/types';

interface GroupCardProps {
  group: GroupWithDetails;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const meetup = group.open_proposal;
  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Typography variant="displayM" color={colors.text}>
            {group.name}
          </Typography>
          {group.neighbourhood ? (
            <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 2 }}>
              {group.neighbourhood.toLowerCase()}
            </Typography>
          ) : null}
        </View>
        {group.unread_count > 0 ? (
          <View style={styles.unreadPip}>
            <Typography variant="labelS" color={colors.white}>
              {group.unread_count}
            </Typography>
          </View>
        ) : null}
      </View>

      {meetup ? (
        <View style={styles.meetupBlock}>
          <Typography variant="label" color={colors.blushMuted}>
            NEXT MEETUP
          </Typography>
          <Typography
            variant="displayM"
            color={colors.blushText}
            style={{ marginTop: 2 }}
          >
            {formatWhen(meetup.scheduled_at)}
          </Typography>
          {meetup.location_name ? (
            <Typography variant="bodyL" color={colors.blushText} style={{ marginTop: 2 }}>
              {meetup.location_name}
            </Typography>
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.stack}>
          {group.members.slice(0, 4).map((m, i) => (
            <View key={m.id} style={[styles.stackItem, { marginLeft: i === 0 ? 0 : -10 }]}>
              <Avatar
                name={m.user.display_name}
                ringColor={m.user.profile_color ?? colors.fuchsia}
                photoUrl={m.user.avatar_url ?? undefined}
                size={32}
                outlineColor={colors.cream}
              />
            </View>
          ))}
        </View>
        <GroupPulse lastMessage={group.last_message} lastActiveAt={group.last_active_at} />
      </View>

      {group.last_message ? (
        <Typography
          variant="bodyM"
          color={colors.muted}
          numberOfLines={1}
          style={styles.lastMessage}
        >
          “{group.last_message.content}”
        </Typography>
      ) : null}
    </Card>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    ...(sameYear ? {} : { year: 'numeric' }),
  };
  return d.toLocaleString(undefined, opts).toLowerCase();
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadPip: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.fuchsia,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetupBlock: {
    backgroundColor: colors.blush,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stack: { flexDirection: 'row' },
  stackItem: {},
  lastMessage: {
    marginTop: -spacing.xs,
  },
});
