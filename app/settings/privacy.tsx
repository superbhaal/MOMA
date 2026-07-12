import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';

const PROMISES = [
  'Your profile is only shared with the groups you join — never made public.',
  'We never collect personality, income, ethnicity, or religion.',
  'Row-level security means no one can read a stranger’s data, ever.',
  'Direct messages stay between you and your group members.',
];

export default function PrivacyScreen() {
  const { user, deleteAccount } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    if (!user) return;
    const payload = {
      profile: user,
      exported_at: new Date().toISOString(),
    };
    try {
      await Share.share({
        message: JSON.stringify(payload, null, 2),
        title: 'My møma data',
      });
    } catch {
      // dismissed
    }
  }

  function handleDelete() {
    Alert.alert(
      'Delete your account?',
      'This removes your profile, group memberships, saved tips, and matching queue. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const { error } = await deleteAccount();
            setBusy(false);
            if (error) {
              Alert.alert('Could not delete', error.message);
            }
            // On success, the auth gate routes back to welcome automatically.
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <SettingsHeader title="Privacy & data" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MeSectionLabel label="Our promise" />
        <MeCard padded>
          {PROMISES.map((p, i) => (
            <View key={i} style={[styles.promiseRow, i === PROMISES.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.dot} />
              <Typography style={styles.promiseText}>{p}</Typography>
            </View>
          ))}
        </MeCard>

        <MeSectionLabel label="Your data" />
        <MeCard>
          <MeRow
            icon="download-outline"
            iconTint={colors.cobalt}
            iconBg="#eef2ff"
            label="Export my data"
            isLast
            onPress={handleExport}
          />
        </MeCard>

        <MeSectionLabel label="Danger zone" />
        <MeCard>
          <MeRow
            icon="trash-outline"
            iconTint={colors.cherry}
            iconBg="#fce8ec"
            label={busy ? 'Deleting…' : 'Delete my account'}
            danger
            isLast
            showArrow={false}
            onPress={busy ? undefined : handleDelete}
          />
        </MeCard>

        <Typography style={styles.footnote}>
          Questions about your data? Reach us at privacy@moma.app
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: spacing.xxxl },
  promiseRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cobalt,
    marginTop: 7,
  },
  promiseText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
