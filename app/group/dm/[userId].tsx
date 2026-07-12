import { useEffect, useMemo, useRef } from 'react';
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
import { Avatar } from '@/components/ui/Avatar';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useDm } from '@/hooks/useDm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import type { Message, User } from '@/types';

export default function DmScreen() {
  const router = useRouter();
  const { userId, fromGroup } = useLocalSearchParams<{ userId: string; fromGroup?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { messages, send } = useDm(userId, fromGroup);
  const listRef = useRef<FlatList<Message>>(null);

  const [other, setOther] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setOther(data as User);
      });
  }, [userId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  const userById = useMemo<Record<string, User>>(() => {
    const m: Record<string, User> = {};
    if (other) m[other.id] = other;
    if (user) m[user.id] = user;
    return m;
  }, [other?.id, user?.id]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 8}
    >
      <Pressable
        onPress={() => other && router.push(`/member/${other.id}`)}
        style={styles.header}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
        <View style={styles.headerCenter}>
          <Avatar
            name={other?.display_name ?? '?'}
            ringColor={other?.profile_color ?? colors.fuchsia}
            photoUrl={other?.avatar_url ?? undefined}
            size={32}
          />
          <Typography
            variant="displayS"
            color={colors.text}
            style={{ marginLeft: spacing.sm }}
          >
            {other?.display_name ?? '...'}
          </Typography>
        </View>
        <View style={{ width: 50 }} />
      </Pressable>

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
          <View style={styles.empty}>
            <Typography variant="bodyL" color={colors.muted} style={{ textAlign: 'center' }}>
              say hi to {other?.display_name?.toLowerCase() ?? 'them'}.
            </Typography>
          </View>
        }
      />

      <ChatInput
        onSend={send}
        placeholder={`message ${other?.display_name?.toLowerCase() ?? ''}`}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  empty: {
    flex: 1,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
});
