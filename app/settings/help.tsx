import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';

function faqs(t: TFunction): { q: string; a: string }[] {
  return [
    { q: t('set.q1'), a: t('set.a1') },
    { q: t('set.q2'), a: t('set.a2') },
    { q: t('set.q3'), a: t('set.a3') },
    { q: t('set.q4'), a: t('set.a4') },
  ];
}

export default function HelpScreen() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <SettingsHeader title={t('set.helpTitle')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MeSectionLabel label={t('set.faq')} />
        <MeCard>
          {faqs(t).map((item, i) => {
            const isOpen = open === i;
            return (
              <Pressable
                key={i}
                onPress={() => setOpen(isOpen ? null : i)}
                style={[styles.faqRow, i === faqs(t).length - 1 && styles.faqRowLast]}
              >
                <View style={styles.faqHead}>
                  <Typography style={styles.faqQ}>{item.q}</Typography>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
                {isOpen ? <Typography style={styles.faqA}>{item.a}</Typography> : null}
              </Pressable>
            );
          })}
        </MeCard>

        <MeSectionLabel label={t('set.getInTouch')} />
        <MeCard>
          <MeRow
            icon="mail-outline"
            iconTint={colors.cobalt}
            iconBg="#eef2ff"
            label={t('set.emailSupport')}
            value="hello@moma.app"
            onPress={() => Linking.openURL('mailto:hello@moma.app?subject=møma%20support')}
          />
          <MeRow
            icon="document-text-outline"
            iconTint="#2a7a2a"
            iconBg="#f0faf0"
            label={t('set.guidelines')}
            isLast
            onPress={() => Linking.openURL('https://moma.app/guidelines')}
          />
        </MeCard>

        <Typography style={styles.version}>møma v{version}</Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: spacing.xxxl },
  faqRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQ: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: scaled(14),
    color: colors.text,
  },
  faqA: {
    fontFamily: fonts.reading,
    fontSize: scaled(13),
    lineHeight: scaled(21),
    color: colors.muted,
    marginTop: spacing.sm,
  },
  version: {
    fontFamily: fonts.body,
    fontSize: scaled(12),
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
