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
  const { group, members, open_proposal, open_votes, refresh: refreshDetail } = useGroupDetail(groupId);
  const { messages, send, sendAttachment } = useChat(groupId);
  const { vote } = useProposals(groupId);

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
          groupName={group?.name ?? null}
          onVote={async (v) => {
            if (!open_proposal) return;
            await vote(open_proposal.id, v);
            // Reflect our own vote immediately; realtime also refreshes for others.
            refreshDetail();
          }}
        />
      ) : (
        <View style={styles.holding}>
          <View style={styles.holdingCard}>
            <Typography style={styles.holdingText} color={colors.mutedStrong}>
              We&rsquo;re holding the chat for a moment. Once everyone shares their
              availability, m&oslash;ma will drop a time and place into the chat. Feel
              free to share a place you love in the meantime.
            </Typography>
          </View>
          <View style={styles.findingPill}>
            <View style={styles.findingDot} />
            <Typography style={styles.findingText} color={colors.blushMuted}>
              FINDING A TIME
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
  dmAction: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  holding: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  holdingCard: {
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: spacing.lg,
  },
  holdingText: {
    fontFamily: 'Lora-Italic',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  findingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  findingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.blushMuted,
  },
  findingText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    letterSpacing: 1.4,
  },
});
