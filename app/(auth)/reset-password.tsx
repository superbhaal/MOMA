import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';

const MIN_LENGTH = 8;

/**
 * Step two: the recovery link has already opened a session, so she is signed in
 * — with the password she cannot remember still in force. This screen is the
 * only thing standing between that session and the app, which is why the auth
 * gate in _layout.tsx routes here on `passwordRecovery` and lets nothing else
 * win until a new password is saved.
 */
export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = password.length >= MIN_LENGTH && confirm === password && !saving;

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updatePassword(password);
    setSaving(false);
    if (err) {
      // The commonest failure by far is an expired link, and the raw message
      // ("Auth session missing", "token has expired") means nothing to her.
      setError(t('auth.pwLinkExpired'));
      return;
    }
    // No navigation here: clearing passwordRecovery releases the gate in
    // _layout.tsx, which routes on where she actually is — Home if onboarded,
    // the quiz if she never finished it.
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Typography variant="displayL" color={colors.cobalt} style={styles.heading}>
          {t('auth.newPwTitle')}
        </Typography>
        <Typography variant="bodyL" color={colors.mutedStrong} style={styles.blurb}>
          {t('auth.newPwBlurb')}
        </Typography>

        {error ? (
          <View style={styles.errorBox}>
            <Typography variant="bodyL" color={colors.cherry}>
              {error}
            </Typography>
          </View>
        ) : null}

        <View style={styles.fields}>
          <View style={styles.field}>
            <Typography variant="label" color={colors.muted}>
              {t('auth.newPassword')}
            </Typography>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
              textContentType="newPassword"
            />
            {tooShort ? (
              <Typography variant="bodyM" color={colors.cherry}>
                {t('auth.pwTooShort')}
              </Typography>
            ) : null}
          </View>

          <View style={styles.field}>
            <Typography variant="label" color={colors.muted}>
              {t('auth.confirmPassword')}
            </Typography>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textContentType="newPassword"
            />
            {mismatch ? (
              <Typography variant="bodyM" color={colors.cherry}>
                {t('auth.pwMismatch')}
              </Typography>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={saving ? t('auth.newPwSaving') : t('auth.newPwSave')}
            onPress={submit}
            disabled={!canSubmit}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: 90, paddingBottom: spacing.xxl },
  heading: { marginBottom: spacing.md },
  blurb: { marginBottom: spacing.xxl, lineHeight: scaled(23) },
  errorBox: { marginBottom: spacing.lg },
  fields: { gap: spacing.xl },
  field: { gap: spacing.sm },
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
  actions: { marginTop: spacing.xxl },
});
