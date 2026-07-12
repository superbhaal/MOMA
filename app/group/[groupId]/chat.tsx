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
import { CounterProposalSheet } from '@/components/chat/CounterProposalSheet';
import { PlacePicker } from '@/components/chat/PlacePicker';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { useChat } from '@/hooks/useChat';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/hooks/useAuth';
import type { Message, User } from '@/types';

export default function GroupChatScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { group, members, open_proposal, open_votes } = useGroupDetail(groupId);
  const { messages, send, sendAttachment } = useChat(groupId);
  const { vote, propose } = useProposals(groupId);

  const [proposeOpen, setProposeOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
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
      keyboardVerticalOffset={insets.top + 8}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
        <Typography variant="displayS" color={colors.text}>
          {group?.name ?? ''}
        </Typography>
        <View style={{ width: 50 }} />
      </View>

      {open_proposal ? (
        <ProposalCard
          proposal={open_proposal}
          votes={open_votes}
          myVote={myVote}
          totalMembers={members.length}
          onVote={(v) => open_proposal && vote(open_proposal.id, v)}
        />
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => {
          const prev = messages[index - 1];
          const showAvatar = !prev || prev.sender_id !== item.sender_id;
          return (
            <ChatBubble
              message={item}
              isMine={item.sender_id === user?.id}
              sender={userById[item.sender_id] ?? null}
              showAvatar={showAvatar}
            />
          );
        }}
        ListEmptyComponent={
          <OpenerChips onPick={async (t) => { await send(t); }} />
        }
      />

      <ChatInput
        onSend={send}
        onSuggestTime={() => setProposeOpen(true)}
        onSharePlace={() => setPlaceOpen(true)}
      />

      <CounterProposalSheet
        visible={proposeOpen}
        onClose={() => setProposeOpen(false)}
        isCounter={!!open_proposal}
        onSubmit={async ({ scheduled_at, note }) => {
          await propose({
            scheduled_at,
            note,
            parent_proposal_id: open_proposal?.id ?? null,
          });
        }}
      />

      <PlacePicker
        visible={placeOpen}
        onClose={() => setPlaceOpen(false)}
        onPick={async (place) => {
          await sendAttachment(place.name, 'place', place);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
});
