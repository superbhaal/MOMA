import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';

/**
 * Step one of "I've forgotten my password": ask for the address.
 *
 * The screen tells her the same thing whether or not the address is registered.
 * A different answer for a known address would make this a way of finding out
 * who is on møma — for an app whose whole promise is a small private table,
 * that matters more than the small convenience of a "no such account" message.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = /.+@.+\..+/.test(email.trim()) && !sending;

  async function submit() {
    if (!canSubmit) return;
    setSending(true);
    // The error is deliberately swallowed: see the note above. A failure to send
    // and an address that was never registered must look identical from here.
    await requestPasswordReset(email);
    setSending(false);
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Typography variant="displayL" color={colors.cobalt} style={styles.heading}>
          {sent ? t('auth.forgotSentTitle') : t('auth.forgotTitle')}
        </Typography>

        <Typography variant="bodyL" color={colors.mutedStrong} style={styles.blurb}>
          {sent ? t('auth.forgotSentBlurb', { email: email.trim() }) : t('auth.forgotBlurb')}
        </Typography>

        {!sent ? (
          <>
            <View style={styles.field}>
              <Typography variant="label" color={colors.muted}>
                {t('auth.email')}
              </Typography>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View style={styles.actions}>
              <Button
                title={sending ? t('auth.forgotSending') : t('auth.forgotSend')}
                onPress={submit}
                disabled={!canSubmit}
                size="lg"
              />
            </View>
          </>
        ) : null}

        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={10}>
          <Typography variant="bodyM" color={colors.cobalt} style={styles.back}>
            {t('auth.backToLogin')}
          </Typography>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 90, paddingBottom: spacing.xxl },
  heading: { marginBottom: spacing.md },
  blurb: { marginBottom: spacing.xxl, lineHeight: scaled(23) },
  field: { gap: spacing.sm },
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
  actions: { marginTop: spacing.xxl, marginBottom: spacing.xl },
  back: { textAlign: 'center', marginTop: spacing.xl },
});
