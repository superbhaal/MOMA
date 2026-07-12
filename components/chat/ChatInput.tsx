import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

interface ChatInputProps {
  onSend: (text: string) => Promise<void> | void;
  onSuggestTime?: () => void;
  onSharePlace?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onSuggestTime,
  onSharePlace,
  placeholder = 'message your group',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    setText('');
    try {
      await onSend(v);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {(onSuggestTime || onSharePlace) ? (
        <View style={styles.actions}>
          {onSuggestTime ? (
            <Pressable onPress={onSuggestTime} style={styles.actionChip}>
              <Typography variant="labelS" color={colors.cobalt}>
                SUGGEST A TIME
              </Typography>
            </Pressable>
          ) : null}
          {onSharePlace ? (
            <Pressable onPress={onSharePlace} style={styles.actionChip}>
              <Typography variant="labelS" color={colors.cobalt}>
                SHARE A PLACE
              </Typography>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || busy}
          style={[
            styles.sendBtn,
            (!text.trim() || busy) && { opacity: 0.4 },
          ]}
        >
          <Typography variant="labelS" color={colors.white}>
            SEND
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  actionChip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.cobalt,
  },
});
