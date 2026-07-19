import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

interface ChatInputProps {
  // Return type is intentionally loose — send helpers return { error } but the
  // composer only cares that it's callable/awaitable.
  onSend: (text: string) => Promise<unknown> | unknown;
  onSharePlace?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onSharePlace,
  placeholder = 'message your group',
}: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    // When the keyboard is up it already covers the home-indicator area, so the
    // safe-area bottom padding must collapse — otherwise it stacks on top of the
    // KeyboardAvoidingView push and leaves a big gap above the keyboard.
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const bottomPad = keyboardUp ? spacing.sm : Math.max(insets.bottom, spacing.sm);

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
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      {onSharePlace ? (
        <View style={styles.actions}>
          <Pressable onPress={onSharePlace} style={styles.placeChip}>
            <Ionicons name="location-outline" size={15} color={colors.cobalt} />
            <Typography style={styles.placeChipText} color={colors.cobalt}>
              Share a place you love
            </Typography>
          </Pressable>
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
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  placeChipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
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
