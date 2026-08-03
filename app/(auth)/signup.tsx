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
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/useAppStore';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { updateOnboarding } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirm &&
    !loading;

  async function handleSignUp() {
    setError(null);
    if (password !== confirm) {
      setError('passwords don\'t match');
      return;
    }
    if (password.length < 6) {
      setError('password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error: authError, needsEmailConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (needsEmailConfirmation) {
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: email.trim() },
      });
      return;
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const { error: e } = await signInWithGoogle();
    setLoading(false);
    if (e) setError(e.message);
  }

  async function handleApple() {
    setError(null);
    setLoading(true);
    const result = await signInWithApple();
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.fullName) {
      updateOnboarding({
        displayName: result.fullName.givenName ?? '',
        lastName: result.fullName.familyName ?? null,
      });
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
            EVERYONE SAYS IT TAKES A VILLAGE.
          </Typography>
        </View>

        <Typography variant="displayL" color={colors.cobalt} style={styles.heading}>
          create your account
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
              EMAIL
            </Typography>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="hello@email.com"
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
              PASSWORD
            </Typography>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="at least 6 characters"
              placeholderTextColor={colors.muted}
              secureTextEntry
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
            />
          </View>

          <View style={styles.field}>
            <Typography variant="label" color={colors.muted}>
              CONFIRM PASSWORD
            </Typography>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="repeat your password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              textContentType="oneTimeCode"
              autoComplete="off"
              importantForAutofill="no"
            />
            {confirm.length > 0 && password !== confirm ? (
              <Typography variant="bodyM" color={colors.cherry}>
                passwords don&rsquo;t match
              </Typography>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={loading ? 'creating account...' : 'create account'}
            onPress={handleSignUp}
            disabled={!canSubmit}
            size="lg"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Typography variant="bodyM" color={colors.muted} style={styles.dividerText}>
              or
            </Typography>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === 'ios' ? (
            <Button
              title="continue with apple"
              variant="secondary"
              size="lg"
              onPress={handleApple}
              disabled={loading}
              icon={<Ionicons name="logo-apple" size={18} color={colors.cobalt} />}
            />
          ) : null}
          <Button
            title="continue with google"
            variant="secondary"
            size="lg"
            onPress={handleGoogle}
            disabled={loading}
            icon={<Ionicons name="logo-google" size={16} color={colors.cobalt} />}
          />

          <Button
            title="already have an account? log in"
            variant="ghost"
            onPress={() => router.replace('/(auth)/login')}
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
