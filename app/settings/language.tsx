import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { SUPPORTED, osLocale, type Locale } from '@/lib/i18n';

const TINT: Record<Locale, { fg: string; bg: string }> = {
  en: { fg: colors.cobalt, bg: 'rgba(26,75,204,0.10)' },
  fr: { fg: colors.lavender, bg: 'rgba(152,120,200,0.14)' },
  es: { fg: colors.orange, bg: 'rgba(255,122,0,0.12)' },
};

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { locale, isExplicit, choose, followSystem } = useLocale();

  // What "match my phone" would actually resolve to, named in its own language
  // so the choice is legible before she makes it.
  const os = osLocale();

  return (
    <View style={styles.container}>
      <SettingsHeader title={t('settings.languageTitle')} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.hint} color={colors.muted}>
          {t('settings.languageHint')}
        </Typography>

        <MeCard>
          {SUPPORTED.map((code, i) => (
            <MeRow
              key={code}
              icon={isExplicit && locale === code ? 'checkmark-circle' : 'ellipse-outline'}
              iconTint={TINT[code].fg}
              iconBg={TINT[code].bg}
              label={t(`settings.${code}`)}
              onPress={() => choose(code, user?.id)}
              showArrow={false}
              isLast={i === SUPPORTED.length - 1}
            />
          ))}
        </MeCard>

        <View style={styles.gap} />

        <MeCard>
          <MeRow
            icon={isExplicit ? 'ellipse-outline' : 'checkmark-circle'}
            iconTint={colors.mutedStrong}
            iconBg="rgba(17,17,24,0.06)"
            label={t('settings.systemDefault')}
            value={t(`settings.${os}`)}
            onPress={() => followSystem(user?.id, user?.primary_language)}
            showArrow={false}
            isLast
          />
        </MeCard>

        <Typography style={styles.foot} color={colors.muted}>
          {t('settings.systemDefaultHint', { name: t(`settings.${os}`) })}
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.xl, paddingTop: spacing.lg },
  hint: {
    fontFamily: fonts.reading,
    fontSize: scaled(14),
    lineHeight: scaled(20),
    marginBottom: spacing.lg,
  },
  gap: { height: spacing.lg },
  foot: {
    fontFamily: fonts.body,
    fontSize: scaled(12),
    lineHeight: scaled(17),
    marginTop: spacing.md,
  },
});
