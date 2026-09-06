import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/lib/supabase';
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
  const { t } = useTranslation();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resendConfirmationEmail, fetchProfile } = useAuth();

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

  // Notice the confirmation instead of waiting forever.
  //
  // She signs up, leaves for her mail app, taps the link, comes back — and the
  // screen still said "check your email" because nothing here ever looked
  // again.
  //
  // What we can look at is narrow, and worth being precise about: signUp
  // returns NO session when confirmation is required, so there is no session to
  // refresh, and Supabase deliberately offers no way to ask "is this address
  // confirmed yet?" — that would be an account-enumeration oracle. So we watch
  // for a session APPEARING, which is what the deep-link handler creates when
  // she confirms on this device. getSession() reads local storage, so polling
  // it is free and rotates no tokens.
  //
  // Confirming on a different device cannot be detected from here at all. That
  // path is covered by the sign-in link at the bottom of this screen.
  useEffect(() => {
    let stop = false;
    async function check() {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (stop || !uid) return;
      stop = true;
      await fetchProfile(uid);
      router.replace('/(auth)/onboarding/resume');
    }
    const id = setInterval(check, 3000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void check();
    });
    return () => {
      stop = true;
      clearInterval(id);
      sub.remove();
    };
  }, [router, fetchProfile]);

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    const { error: e } = await resendConfirmationEmail(email);
    if (e) {
      const msg = /rate limit/i.test(e.message)
        ? t('verify.tooManyRequests')
        : e.message;
      setError(msg);
      // Always cool down on failure too so a flurry of taps can't worsen the limit.
      setCooldown(RESEND_COOLDOWN_S);
      return;
    }
    setInfo(t('verify.newLinkSent'));
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
          {t('verify.title')}
        </Typography>
        <Typography variant="bodyL" color={colors.muted} style={{ marginTop: spacing.md }}>
          {t('verify.sentTo')}
          <Typography variant="bodyL" color={colors.text}>
            {email}
          </Typography>
          {t('verify.tapLink')}
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
            {cooldown > 0 ? t('verify.resendIn', { seconds: cooldown }) : t('verify.resendLink')}
          </Typography>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button title={t('verify.openMail')} onPress={openMail} size="lg" />
        <Button
          title={t('verify.backToSignUp')}
          variant="ghost"
          onPress={() => router.replace('/(auth)/signup')}
        />

        {/* The exit that was missing, and it is not cosmetic.
            Signing up with an address that ALREADY has a confirmed account
            returns 200 and sends nothing — Supabase does that on purpose, so
            the response cannot be used to discover who is registered. From here
            it looks identical to a successful signup: this screen appears, and
            no email ever comes. Our first outside tester hit exactly that and
            reported it as "I never received the message". Resending does not
            help either, for the same reason. The only way out is to log in, so
            say so. */}
        <Pressable onPress={() => router.replace('/(auth)/login')} hitSlop={10}>
          <Typography variant="bodyM" color={colors.cobalt} style={styles.alreadyHave}>
            {t('verify.alreadyHave')}
          </Typography>
        </Pressable>
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
  alreadyHave: { textAlign: 'center', marginTop: spacing.lg },
  resendBtn: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.md,
  },
});
