import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleLogin() {
    setError(null);
    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);
    if (authError) setError(authError.message);
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const { error: e } = await signInWithGoogle({ requireExistingAccount: true });
    setLoading(false);
    if (e) setError(e.message);
  }

  async function handleApple() {
    console.log('[Login] handleApple start');
    setError(null);
    setLoading(true);
    const result = await signInWithApple({ requireExistingAccount: true });
    console.log('[Login] handleApple result', result);
    setLoading(false);
    if (result.error) {
      console.log('[Login] setError:', result.error.message);
      setError(result.error.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <Typography color={colors.cobalt} style={styles.brand}>
            møma
          </Typography>
          <Typography color={colors.muted} style={styles.tagline}>
            {t('welcome.tagline')}
          </Typography>
        </View>

        <Typography variant="displayL" color={colors.cobalt} style={styles.heading}>
          {t('auth.welcomeBack')}
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
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
            />
          </View>

          <View style={styles.field}>
            <Typography variant="label" color={colors.muted}>
              {t('auth.password')}
            </Typography>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={colors.muted}
              secureTextEntry
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={loading ? 'logging in...' : 'log in'}
            onPress={handleLogin}
            disabled={!canSubmit}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Typography variant="bodyM" color={colors.muted} style={styles.dividerText}>
              {t('auth.or')}
            </Typography>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === 'ios' ? (
            <Button
              title={t('auth.continueApple')}
              variant="secondary"
              size="lg"
              onPress={handleApple}
              disabled={loading}
              icon={<Ionicons name="logo-apple" size={18} color={colors.cobalt} />}
            />
          ) : null}
          <Button
            title={t('auth.continueGoogle')}
            variant="secondary"
            size="lg"
            onPress={handleGoogle}
            disabled={loading}
            icon={<Ionicons name="logo-google" size={16} color={colors.cobalt} />}
          />

          <Button
            title={t('auth.noAccountSignUp')}
            variant="ghost"
            onPress={() => router.replace('/(auth)/signup')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: scaled(52),
    lineHeight: scaled(56),
  },
  tagline: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(11),
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  heading: {
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  fields: {
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
  actions: {
    gap: spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    color: colors.muted,
  },
});
