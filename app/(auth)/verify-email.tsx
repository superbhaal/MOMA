import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';

const RESEND_COOLDOWN_S = 60;

const WEBMAIL_BY_DOMAIN: Record<string, string> = {
  'gmail.com': 'https://mail.google.com',
  'googlemail.com': 'https://mail.google.com',
  'outlook.com': 'https://outlook.live.com/mail',
  'hotmail.com': 'https://outlook.live.com/mail',
  'live.com': 'https://outlook.live.com/mail',
  'msn.com': 'https://outlook.live.com/mail',
  'yahoo.com': 'https://mail.yahoo.com',
  'yahoo.fr': 'https://mail.yahoo.com',
  'icloud.com': 'https://www.icloud.com/mail',
  'me.com': 'https://www.icloud.com/mail',
  'mac.com': 'https://www.icloud.com/mail',
  'proton.me': 'https://mail.proton.me',
  'protonmail.com': 'https://mail.proton.me',
};

function webmailUrlFor(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return WEBMAIL_BY_DOMAIN[domain] ?? null;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resendConfirmationEmail } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  // Start in cooldown: signup just dispatched a confirmation email, so tapping
  // resend immediately would race straight into Supabase's per-email rate limit.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    const { error: e } = await resendConfirmationEmail(email);
    if (e) {
      const msg = /rate limit/i.test(e.message)
        ? 'too many requests. please wait a moment before trying again.'
        : e.message;
      setError(msg);
      // Always cool down on failure too so a flurry of taps can't worsen the limit.
      setCooldown(RESEND_COOLDOWN_S);
      return;
    }
    setInfo('we sent a new confirmation link.');
    setCooldown(RESEND_COOLDOWN_S);
  }

  async function openMail() {
    // `mailto:` is the universal scheme — iOS 14+ routes it to whatever email
    // app the user has set as default (Apple Mail, Gmail, Outlook, Spark…).
    // (`message://` would open Apple Mail specifically and miss everyone else.)
    // If no mail app is installed at all, fall back to the webmail for the
    // user's domain instead of the iOS "No Email App Installed" dead-end.
    try {
      const canOpen = await Linking.canOpenURL('mailto:');
      if (canOpen) {
        await Linking.openURL('mailto:');
        return;
      }
    } catch {
      // canOpenURL rejected — try the webmail fallback below.
    }
    const fallback = webmailUrlFor(email);
    if (fallback) await Linking.openURL(fallback);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Typography variant="displayL" color={colors.cobalt}>
          check your email
        </Typography>
        <Typography variant="bodyL" color={colors.muted} style={{ marginTop: spacing.md }}>
          we sent a confirmation link to{' '}
          <Typography variant="bodyL" color={colors.text}>
            {email}
          </Typography>
          . tap the link in the email and you&rsquo;ll come right back here, signed in.
        </Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginTop: spacing.md }}>
            {error}
          </Typography>
        ) : null}
        {info ? (
          <Typography variant="bodyM" color={colors.cobalt} style={{ marginTop: spacing.md }}>
            {info}
          </Typography>
        ) : null}

        <Pressable onPress={handleResend} disabled={cooldown > 0} style={styles.resendBtn}>
          <Typography
            variant="labelS"
            color={cooldown > 0 ? colors.muted : colors.cobalt}
          >
            {cooldown > 0 ? `RESEND IN ${cooldown}S` : 'RESEND LINK'}
          </Typography>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button title="open mail app" onPress={openMail} size="lg" />
        <Button
          title="back to sign up"
          variant="ghost"
          onPress={() => router.replace('/(auth)/signup')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    marginTop: spacing.xxl,
  },
  resendBtn: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
});
