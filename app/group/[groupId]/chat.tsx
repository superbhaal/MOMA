import { useState } from 'react';
import { View, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useChat } from '@/hooks/useChat';
import { useAppStore } from '@/store/useAppStore';

export default function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const user = useAppStore((s) => s.user);
  const { messages, loading, sendMessage } = useChat(groupId);
  const [text, setText] = useState('');

  async function handleSend() {
    if (!text.trim()) return;
    await sendMessage(text.trim());
    setText('');
  }

  const isSelf = (senderId: string) => senderId === user?.id;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Meetup strip */}
      <View style={styles.meetupStrip}>
        <Typography variant="bodyS" color={colors.blushText}>
          Next meetup — TBD
        </Typography>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              isSelf(item.sender_id) ? styles.bubbleSelf : styles.bubbleOther,
            ]}
          >
            <Typography
              variant="bodyM"
              color={isSelf(item.sender_id) ? colors.white : colors.text}
            >
              {item.content}
            </Typography>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
        >
          <Typography variant="label" color={colors.white}>
            SEND
          </Typography>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  meetupStrip: {
    backgroundColor: colors.blush,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  messageList: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  bubbleSelf: {
    backgroundColor: colors.cobalt,
    alignSelf: 'flex-end',
  },
  bubbleOther: {
    backgroundColor: colors.cream,
    alignSelf: 'flex-start',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
