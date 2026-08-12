import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ProposalCard } from '@/components/chat/ProposalCard';
import { OpenerChips } from '@/components/chat/OpenerChips';
import { PlacePicker } from '@/components/chat/PlacePicker';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { useChat } from '@/hooks/useChat';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import { hasUpcomingMeetup } from '@/lib/meetup';
import type { Message, User } from '@/types';

export default function GroupChatScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { group, members, open_proposal, open_votes, refresh: refreshDetail } = useGroupDetail(groupId);
  const { messages, send, sendAttachment } = useChat(groupId);
  const { vote, unvote } = useProposals(groupId);

  const [placeOpen, setPlaceOpen] = useState(false);
  const [dmTarget, setDmTarget] = useState<User | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  const userById = useMemo<Record<string, User>>(() => {
    const m: Record<string, User> = {};
    for (const r of members) m[r.user.id] = r.user;
    return m;
  }, [members]);

  const myVote = open_votes.find((v) => v.user_id === user?.id)?.vote ?? null;

  useEffect(() => {
    if (messages.length > 0) {
      // Defer to after render so layout is correct.
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerRow}>
          <Typography style={styles.headerArrow} color={colors.cobalt}>
            ←
          </Typography>
          <View style={{ flex: 1 }}>
            <Typography style={styles.headerName} color={colors.cobalt} numberOfLines={1}>
              {group?.name ?? ''}
            </Typography>
            <Typography style={styles.headerMeta} color={colors.muted}>
              {members.length > 0 ? `${members.length} MEMBERS` : ''}
            </Typography>
          </View>
        </Pressable>
      </View>

      {open_proposal && hasUpcomingMeetup(open_proposal) ? (
        <View style={styles.proposalWrap}>
          <ProposalCard
            proposal={open_proposal}
            votes={open_votes}
            myVote={myVote}
            totalMembers={members.length}
            groupName={group?.name ?? null}
            onToggleGoing={async () => {
              if (!open_proposal) return;
              if (myVote === 'going') await unvote(open_proposal.id);
              else await vote(open_proposal.id, 'going');
              // Reflect our own vote immediately; realtime also refreshes for others.
              refreshDetail();
            }}
          />
        </View>
      ) : (
        <View style={styles.holding}>
          <Typography style={styles.holdingText} color={colors.mutedStrong}>
            We&rsquo;re holding the chat for a moment. Once everyone shares their
            availability, m&oslash;ma will drop a time and place into the chat. Feel
            free to share a place you love in the meantime.
          </Typography>
          {/* No availability link here any more. It's asked once, as a
              condition of joining, and then only when møma comes back to ask —
              a standing link invited people to re-answer a question nobody had
              been asked yet. */}
          <View style={styles.findingPill}>
            <View style={styles.findingDot} />
            <Typography style={styles.findingText} color={colors.mutedStrong}>
              SETTING THE TABLE
            </Typography>
          </View>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const prev = messages[index - 1];
          const showAvatar = !prev || prev.sender_id !== item.sender_id;
          const isMine = item.sender_id === user?.id;
          const sender = userById[item.sender_id] ?? null;
          return (
            <ChatBubble
              message={item}
              isMine={isMine}
              sender={sender}
              showAvatar={showAvatar}
              onLongPress={!isMine && sender ? () => setDmTarget(sender) : undefined}
            />
          );
        }}
        ListEmptyComponent={
          <OpenerChips onPick={async (t) => { await send(t); }} />
        }
      />

      <ChatInput
        onSend={send}
        onSharePlace={() => setPlaceOpen(true)}
      />

      <PlacePicker
        visible={placeOpen}
        onClose={() => setPlaceOpen(false)}
        city={group?.city ?? null}
        onPick={async (place) => {
          await sendAttachment(place.name, 'place', place);
        }}
      />

      <ActionSheet
        visible={!!dmTarget}
        onClose={() => setDmTarget(null)}
        title={dmTarget?.display_name ?? ''}
      >
        <Pressable
          style={styles.dmAction}
          onPress={() => {
            const id = dmTarget?.id;
            setDmTarget(null);
            if (id) router.push(`/group/dm/${id}?fromGroup=${groupId}`);
          }}
        >
          <Typography variant="bodyL" color={colors.cobalt}>
            Message {dmTarget?.display_name?.split(' ')[0] ?? 'them'} privately
          </Typography>
        </Pressable>
        <Pressable
          style={styles.dmAction}
          onPress={() => {
            const id = dmTarget?.id;
            setDmTarget(null);
            if (id) router.push(`/member/${id}`);
          }}
        >
          <Typography variant="bodyL" color={colors.text}>
            View profile
          </Typography>
        </Pressable>
      </ActionSheet>
    </KeyboardAvoidingView>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerArrow: { fontFamily: fonts.body, fontSize: scaled(18) },
  headerName: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(21),
    lineHeight: scaled(26),
  },
  headerMeta: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 1.6,
    marginTop: 1,
  },
  proposalWrap: {
    marginHorizontal: 26,
    marginVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  dmAction: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  // v11: quiet italic paragraph on white — no card fill, no bordered pill.
  holding: {
    paddingHorizontal: 34,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    alignItems: 'center',
  },
  holdingText: {
    fontFamily: 'Lora-Italic',
    fontSize: scaled(13.5),
    lineHeight: scaled(21),
    textAlign: 'center',
  },
  findingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.mutedStrong,
  },
  findingText: {
    fontFamily: 'DMSans-Medium',
    fontSize: scaled(10.5),
    letterSpacing: 2,
  },
});
