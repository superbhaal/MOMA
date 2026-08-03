import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

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
            <Ionicons name="location-outline" size={13} color={colors.cobalt} />
            <Typography style={styles.placeChipText} color={colors.cobalt}>
              SHARE A PLACE YOU LOVE
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
          accessibilityLabel="Send"
        >
          <Ionicons name="arrow-up" size={18} color={colors.white} />
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
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 1,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  placeChipText: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10),
    letterSpacing: 1.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  // v11: quiet underlined field, serif-italic voice, no filled box.
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    fontFamily: fonts.readingItal,
    fontSize: scaled(15),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    paddingHorizontal: 2,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
