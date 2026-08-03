import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { WaveRule } from '@/components/ui/WaveRule';
import { MemberRow } from '@/components/groups/MemberRow';
import { MeetupBanner } from '@/components/groups/MeetupBanner';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';

/**
 * Group detail — v11: back link, serif-italic cobalt group name, small meta
 * line, drawn wave rule, centred meetup block, centred MEMBERS heading over rows.
 * Ref: design/moma-v11.html · #screen-detail.
 */
export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { group, members, open_proposal, open_votes, loading } = useGroupDetail(groupId);
  const { vote, unvote } = useProposals(groupId);

  const myVote = open_votes.find((v) => v.user_id === user?.id)?.vote ?? null;
  const meta = [
    group?.neighbourhood,
    `${members.length} member${members.length === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography style={styles.back} color={colors.cobalt}>
            ← My Groups
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading || !group ? (
          <Typography variant="bodyL" color={colors.muted}>
            loading...
          </Typography>
        ) : (
          <>
            <Typography style={styles.name} color={colors.cobalt}>
              {group.name}
            </Typography>
            {meta ? (
              <Typography style={styles.meta} color={colors.muted}>
                {meta}
              </Typography>
            ) : null}

            <WaveRule style={styles.wave} />

            {open_proposal ? (
              <View style={{ marginTop: spacing.xl }}>
                <MeetupBanner
                  proposal={open_proposal}
                  votes={open_votes}
                  totalMembers={members.length}
                  myVote={myVote}
                  groupName={group?.name ?? null}
                  onToggleGoing={() => {
                    if (!open_proposal) return;
                    if (myVote === 'going') unvote(open_proposal.id);
                    else vote(open_proposal.id, 'going');
                  }}
                />
              </View>
            ) : null}

            {/* Kept reachable here too — the chat only offers it while the
                group is between meetups. Once møma has locked a date in there
                is nothing left to influence, so the offer goes away. */}
            {open_proposal?.state === 'decided' ? null : (
              <Pressable
                onPress={() => router.push('/availability')}
                hitSlop={8}
                style={styles.availabilityRow}
              >
                <Typography style={styles.availabilityLink} color={colors.cobalt}>
                  Mark when you can&rsquo;t make it
                </Typography>
              </Pressable>
            )}

            <View style={styles.membersHead}>
              <Typography style={styles.membersLabel} color={colors.cobalt}>
                MEMBERS
              </Typography>
              <View style={styles.membersRule} />
            </View>
            <View>
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isSelf={m.user.id === user?.id}
                  onPress={() => router.push(`/member/${m.user.id}`)}
                  onMessage={
                    m.user.id === user?.id
                      ? undefined
                      : () => router.push(`/group/dm/${m.user.id}?fromGroup=${groupId}`)
                  }
                />
              ))}
            </View>

            <View style={{ marginTop: spacing.xxl }}>
              <Button
                title="open chat"
                onPress={() => router.push(`/group/${groupId}/chat`)}
                size="lg"
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 26,
    paddingVertical: spacing.md,
  },
  back: { fontFamily: fonts.bodyMed, fontSize: 13 },
  scroll: {
    paddingHorizontal: 26,
    paddingBottom: spacing.xxxl,
  },
  name: {
    fontFamily: fonts.serifItal,
    fontSize: 29,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 3,
  },
  wave: {
    marginTop: spacing.xl,
  },
  availabilityRow: { marginTop: spacing.xl, alignItems: 'center' },
  availabilityLink: {
    fontFamily: fonts.bodyMed,
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
  membersHead: { marginTop: spacing.xxl, marginBottom: spacing.xs },
  membersLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: 8.5,
    letterSpacing: 2.4,
    textAlign: 'center',
  },
  membersRule: { height: 1, backgroundColor: colors.line, marginTop: 10 },
});
