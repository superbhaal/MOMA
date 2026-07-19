import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Typography } from '@/components/ui/Typography';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useOnboarding } from '@/hooks/useOnboarding';
import { lifeStageFromDob } from '@/lib/lifeStage';

const DOB_MAX = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() + 9);
  return d;
})();
const DOB_MIN = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
})();

function formatDob(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function Q2BabyDobScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onboardingData, saveProgress } = useOnboarding();
  const [babyDob, setBabyDob] = useState(onboardingData.babyDob);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advance(skip = false) {
    setError(null);
    setSaving(true);
    if (!skip && babyDob) {
      const lifeStage = lifeStageFromDob(babyDob);
      const { error: saveError } = await saveProgress({
        baby_dob: babyDob,
        life_stage: lifeStage,
      });
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
    } else {
      setSaving(false);
    }
    router.push('/(auth)/onboarding/q3');
  }

  // Exact spec wording (.standalone obDateChange logic):
  // - First baby: covers both expecting AND just-delivered moms.
  // - Otherwise: focused on the youngest, regardless of how many.
  const isFirstBaby = onboardingData.isFirstBaby;
  const heading = isFirstBaby
    ? 'When are you due,\nor when was your baby born?'
    : 'When was your\nyoungest baby born?';

  return (
    <View style={styles.container}>
      <OnboardingHeader current={2} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.heading}>{heading}</Typography>
        <Typography style={styles.sub}>Roughly. Doesn&rsquo;t have to be exact.</Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <Pressable style={styles.dateInput} onPress={() => setPickerOpen(true)}>
          <Typography style={[styles.dateText, babyDob ? styles.dateTextFilled : null]}>
            {babyDob ? formatDob(babyDob) : 'mm / dd / yyyy'}
          </Typography>
          <Ionicons name="calendar-outline" size={20} color="rgba(26,75,204,0.55)" />
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? 'saving…' : 'Continue'}
          onPress={() => advance(false)}
          disabled={!babyDob || saving}
        />
        <OnboardingSaveHint />
      </View>

      {Platform.OS === 'ios' ? (
        <ActionSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title="baby's date"
        >
          <DateTimePicker
            value={babyDob ? new Date(babyDob) : new Date()}
            mode="date"
            display="inline"
            minimumDate={DOB_MIN}
            maximumDate={DOB_MAX}
            themeVariant="light"
            onChange={(_e, d) => {
              if (d) setBabyDob(toIsoDate(d));
            }}
          />
          <Button
            title="done"
            size="lg"
            onPress={() => setPickerOpen(false)}
            style={{ marginTop: spacing.md }}
          />
        </ActionSheet>
      ) : pickerOpen ? (
        <DateTimePicker
          value={babyDob ? new Date(babyDob) : new Date()}
          mode="date"
          display="default"
          minimumDate={DOB_MIN}
          maximumDate={DOB_MAX}
          onChange={(_e: DateTimePickerEvent, d?: Date) => {
            setPickerOpen(false);
            if (d) setBabyDob(toIsoDate(d));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cobalt },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  heading: {
    fontFamily: fonts.serif,
    fontWeight: '300',
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.md,
  },
  sub: {
    fontFamily: fonts.body,
    fontWeight: '300',
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.60)',
    marginBottom: spacing.xl,
  },
  dateInput: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: fonts.bodyMed,
    fontSize: 20,
    color: 'rgba(26,75,204,0.45)',
    letterSpacing: 0.5,
  },
  dateTextFilled: {
    color: colors.cobalt,
    letterSpacing: 0,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    position: 'relative',
  },
});
