import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';

// Copy, so built from `t` at render rather than frozen at import.
function promises(t: TFunction): string[] {
  return [t('set.p1'), t('set.p2'), t('set.p3'), t('set.p4')];
}

export default function PrivacyScreen() {
  const { t } = useTranslation();
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
        title: t('misc.myMomaData'),
      });
    } catch {
      // dismissed
    }
  }

  function handleDelete() {
    Alert.alert(
      t('set.deleteTitle'),
      t('set.deleteBody'),
      [
        { text: t('misc.cancel'), style: 'cancel' },
        {
          text: t('misc.delete'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const { error } = await deleteAccount();
            setBusy(false);
            if (error) {
              Alert.alert(t('set.couldNotDelete'), error.message);
            }
            // On success, the auth gate routes back to welcome automatically.
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <SettingsHeader title={t('set.privacyTitle')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MeSectionLabel label={t('set.ourPromise')} />
        <MeCard padded>
          {promises(t).map((p, i) => (
            <View key={i} style={[styles.promiseRow, i === promises(t).length - 1 && { marginBottom: 0 }]}>
              <View style={styles.dot} />
              <Typography style={styles.promiseText}>{p}</Typography>
            </View>
          ))}
        </MeCard>

        <MeSectionLabel label={t('set.yourData')} />
        <MeCard>
          <MeRow
            icon="download-outline"
            iconTint={colors.cobalt}
            iconBg="#eef2ff"
            label={t('set.exportData')}
            isLast
            onPress={handleExport}
          />
        </MeCard>

        <MeSectionLabel label={t('set.dangerZone')} />
        <MeCard>
          <MeRow
            icon="trash-outline"
            iconTint={colors.cherry}
            iconBg="#fce8ec"
            label={busy ? t('set.deleting') : t('set.deleteAccount')}
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
    fontSize: scaled(13),
    lineHeight: scaled(20),
    color: colors.text,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: scaled(12),
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
});
