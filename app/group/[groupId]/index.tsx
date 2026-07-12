import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { MemberRow } from '@/components/groups/MemberRow';
import { MeetupBanner } from '@/components/groups/MeetupBanner';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { group, members, open_proposal, open_votes, loading } = useGroupDetail(groupId);
  const { vote } = useProposals(groupId);

  const myVote = open_votes.find((v) => v.user_id === user?.id)?.vote ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading || !group ? (
          <Typography variant="bodyL" color={colors.muted}>
            loading...
          </Typography>
        ) : (
          <>
            <Typography variant="displayL" color={colors.text}>
              {group.name}
            </Typography>
            {group.neighbourhood ? (
              <Typography variant="bodyL" color={colors.muted} style={{ marginTop: 2 }}>
                {group.neighbourhood.toLowerCase()}
              </Typography>
            ) : null}

            {open_proposal ? (
              <View style={{ marginTop: spacing.xl }}>
                <MeetupBanner
                  proposal={open_proposal}
                  votes={open_votes}
                  totalMembers={members.length}
                  myVote={myVote}
                  onRsvp={() =>
                    open_proposal && vote(open_proposal.id, myVote === 'going' ? 'maybe' : 'going')
                  }
                />
              </View>
            ) : null}

            <View style={{ marginTop: spacing.xl }}>
              <Typography variant="label" color={colors.muted}>
                {members.length} MEMBERS
              </Typography>
              <View style={{ marginTop: spacing.sm }}>
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    onPress={() => router.push(`/member/${m.user.id}`)}
                    onMessage={
                      m.user.id === user?.id
                        ? undefined
                        : () => router.push(`/group/dm/${m.user.id}?fromGroup=${groupId}`)
                    }
                  />
                ))}
              </View>
            </View>

            <View style={{ marginTop: spacing.xl }}>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
