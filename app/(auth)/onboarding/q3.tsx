import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { LANGUAGE_OPTIONS, languageLabel } from '@/constants/onboarding';
import { scaled } from '@/constants/scale';
import { useOnboarding } from '@/hooks/useOnboarding';

const MAX_SECONDARY = 2;

export default function Q3LanguagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { onboardingData, saveProgress } = useOnboarding();

  const [primary, setPrimary] = useState<string | null>(onboardingData.primaryLanguage);
  const [secondary, setSecondary] = useState<string[]>(onboardingData.secondaryLanguages ?? []);
  // Hydrate custom languages from any saved values not in the static list.
  const initialCustom = useMemo(() => {
    const known = new Set(LANGUAGE_OPTIONS.map((l) => l.label));
    const all = [
      ...(onboardingData.primaryLanguage ? [onboardingData.primaryLanguage] : []),
      ...(onboardingData.secondaryLanguages ?? []),
    ];
    return all.filter((l) => !known.has(l));
  }, []);
  const [customLanguages, setCustomLanguages] = useState<string[]>(initialCustom);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<'primary' | 'secondary'>('primary');
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  const allLanguages = useMemo(
    () => [...LANGUAGE_OPTIONS.map((l) => l.label), ...customLanguages],
    [customLanguages],
  );

  function selectPrimary(label: string) {
    setPrimary(label);
    setSecondary((cur) => cur.filter((x) => x !== label));
  }

  function toggleSecondary(label: string) {
    if (label === primary) return;
    setSecondary((cur) => {
      if (cur.includes(label)) return cur.filter((x) => x !== label);
      if (cur.length >= MAX_SECONDARY) return cur;
      return [...cur, label];
    });
  }

  function openAdd(target: 'primary' | 'secondary') {
    setAddTarget(target);
    setDraft('');
    setAddOpen(true);
  }

  function commitAdd() {
    const value = draft.trim();
    if (!value) return;
    const existing = allLanguages.find((l) => l.toLowerCase() === value.toLowerCase());
    const finalLabel = existing ?? value;

    if (!existing) {
      setCustomLanguages((cur) => [...cur, value]);
    }
    if (addTarget === 'primary') {
      selectPrimary(finalLabel);
    } else if (finalLabel !== primary) {
      setSecondary((cur) => {
        if (cur.includes(finalLabel)) return cur;
        if (cur.length >= MAX_SECONDARY) return cur;
        return [...cur, finalLabel];
      });
    }
    setAddOpen(false);
  }

  async function advance(skip = false) {
    setError(null);
    setSaving(true);
    if (!skip && primary) {
      const { error: saveError } = await saveProgress({
        primary_language: primary,
        secondary_languages: secondary.slice(0, MAX_SECONDARY),
      });
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
    } else {
      setSaving(false);
    }
    router.push('/(auth)/onboarding/q4');
  }

  return (
    <View style={styles.container}>
      <OnboardingHeader current={3} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.heading}>
          {t('ob.q3heading')}
        </Typography>
        <Typography style={styles.sub}>{t('ob.q3sub')}</Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <Typography style={styles.sectionLabel}>{t('ob.primary')}</Typography>
        <Typography style={styles.sectionSub}>{t('ob.strongest')}</Typography>
        <View style={styles.grid}>
          {allLanguages.map((label) => {
            const active = primary === label;
            return (
              <Pressable
                key={`p-${label}`}
                onPress={() => selectPrimary(label)}
                style={[styles.pill, active && styles.pillSel]}
              >
                <Typography style={[styles.pillText, active && styles.pillTextSel]}>
                  {languageLabel(label, t)}
                </Typography>
              </Pressable>
            );
          })}
          <Pressable style={[styles.pill, styles.pillAdd]} onPress={() => openAdd('primary')}>
            <Typography style={[styles.pillText, styles.pillAddText]}>{t('ob.addPill')}</Typography>
          </Pressable>
        </View>

        <View style={styles.sectionGap}>
          <View style={styles.alsoRow}>
            <Typography style={styles.sectionLabel}>{t('ob.q3alsoSpeak')}</Typography>
            <Typography style={[styles.sectionLabel, styles.alsoRight]}>{t('ob.upToTwo')}</Typography>
          </View>
          <Typography style={styles.sectionSub}>
            {t('ob.q3optional')}
          </Typography>
        </View>
        <View style={styles.grid}>
          {allLanguages.map((label) => {
            const isPrimary = label === primary;
            const active = secondary.includes(label);
            const capped = !active && secondary.length >= MAX_SECONDARY;
            const disabled = isPrimary || capped;
            return (
              <Pressable
                key={`s-${label}`}
                onPress={() => toggleSecondary(label)}
                disabled={disabled}
                style={[
                  styles.pill,
                  active && styles.pillSel,
                  disabled && styles.pillDisabled,
                ]}
              >
                <Typography
                  style={[
                    styles.pillText,
                    active && styles.pillTextSel,
                    disabled && styles.pillTextDisabled,
                  ]}
                >
                  {languageLabel(label, t)}
                </Typography>
              </Pressable>
            );
          })}
          <Pressable style={[styles.pill, styles.pillAdd]} onPress={() => openAdd('secondary')}>
            <Typography style={[styles.pillText, styles.pillAddText]}>{t('ob.addPill')}</Typography>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? t('ob.saving') : t('ob.continue')}
          onPress={() => advance(false)}
          disabled={!primary || saving}
        />
        <OnboardingSaveHint />
      </View>

      <ActionSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onShow={() => inputRef.current?.focus()}
        title={addTarget === 'primary' ? 'Add a primary language' : 'Add another language'}
      >
        <View>
          <Typography variant="bodyM" color={colors.muted} style={styles.sheetHint}>
            Type any language. We&rsquo;ll keep it as-is.
          </Typography>
          <TextInput
            ref={inputRef}
            style={styles.sheetInput}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('ob.q3addPlaceholder')}
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={commitAdd}
            maxLength={32}
          />
          <Button
            title={t('ob.q3add')}
            size="lg"
            onPress={commitAdd}
            disabled={!draft.trim()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: {
    paddingHorizontal: 26,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  heading: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(40),
    lineHeight: scaled(46),
    letterSpacing: -0.8,
    color: colors.cobalt,
    marginBottom: spacing.md,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    lineHeight: scaled(23),
    color: colors.mutedStrong,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 2.4,
    color: colors.cobalt,
    marginBottom: 6,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: scaled(13),
    lineHeight: scaled(19),
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  sectionGap: {
    marginTop: spacing.xl,
  },
  alsoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  alsoRight: {
    color: colors.muted,
    fontSize: scaled(10.5),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  pillSel: {
    backgroundColor: colors.cobaltSoft,
    borderWidth: 1.5,
    borderColor: colors.cobalt,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillAdd: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  pillText: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(15),
    color: colors.text,
  },
  pillTextSel: {
    color: colors.cobalt,
    fontFamily: fonts.bodySemi,
  },
  pillTextDisabled: {},
  pillAddText: {
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 26,
    paddingTop: spacing.sm,
    position: 'relative',
  },
  sheetHint: {
    marginBottom: spacing.sm,
  },
  sheetInput: {
    fontFamily: fonts.body,
    fontSize: scaled(18),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
});
