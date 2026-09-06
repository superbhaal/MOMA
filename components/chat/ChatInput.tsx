import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

/** What the send helpers actually return. Narrow enough to read the failure. */
type SendResult = { error?: unknown } | void;

interface ChatInputProps {
  // The return type used to be `unknown`, and the composer threw it away. That
  // is how a failed message became a silent one — see handleSend.
  onSend: (text: string) => Promise<SendResult> | SendResult;
  onSharePlace?: () => void;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onSharePlace,
  placeholder,
}: ChatInputProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
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

  /**
   * Send, and keep her words if it fails.
   *
   * This used to clear the field BEFORE awaiting, and discard the result. So a
   * failed send — offline, an RLS refusal, a thread that could not be opened —
   * emptied the composer, put nothing in the thread (the optimistic append is
   * guarded on success), and said nothing. She watched what she had written
   * disappear with no way to get it back.
   *
   * The field now clears only on success. That single change is most of the
   * fix; the line underneath is so she knows why the message is still sitting
   * there.
   */
  async function handleSend() {
    const v = text.trim();
    if (!v || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const result = await onSend(v);
      const failure =
        result && typeof result === 'object' && 'error' in result
          ? (result as { error?: unknown }).error
          : null;
      if (failure) {
        setFailed(true);
        return;
      }
      setText('');
    } catch {
      setFailed(true);
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
              {t('grp.sharePlaceCta')}
            </Typography>
          </Pressable>
        </View>
      ) : null}
      {failed ? (
        <Typography style={styles.failed} color={colors.cherry}>
          {t('grp.sendFailed')}
        </Typography>
      ) : null}
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={(v) => {
            // Touching the message is the retry gesture; drop the warning.
            if (failed) setFailed(false);
            setText(v);
          }}
          placeholder={placeholder ?? t('grp.messageGroup')}
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
  failed: {
    fontFamily: fonts.body,
    fontSize: scaled(12.5),
    textAlign: 'center',
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
    fontSize: scaled(10.5),
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
