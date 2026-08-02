import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { AddressField } from '@/components/ui/AddressField';
import { PrefsPill } from '@/components/preferences/PrefsPill';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { LANGUAGES } from '@/constants/onboarding';
import { useAddressField } from '@/hooks/useAddressField';
import { usePreferences } from '@/hooks/usePreferences';
import type { BabyAtMeetups } from '@/types';

const AGE_WINDOWS = [2, 4, 6, 8];
const DISTANCES = [10, 20, 30, -1];
const FREE_BLOCKS = ['morning', 'afternoon', 'evening'];
const FORMATS = ['coffee', 'walk', 'park', 'class', 'home'];
const BABY_OPTIONS: { value: BabyAtMeetups; label: string }[] = [
  { value: 'always', label: 'always' },
  { value: 'sometimes_without', label: 'sometimes without' },
  { value: 'either', label: 'either is fine' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, update } = usePreferences();
  const [saving, setSaving] = useState(false);

  if (!prefs) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Typography variant="bodyL" color={colors.muted}>
          loading...
        </Typography>
      </View>
    );
  }

  const [ageWindow, setAgeWindow] = useState(prefs.pref_age_window_weeks);
  const [distance, setDistance] = useState(prefs.pref_distance_minutes);
  const [primary, setPrimary] = useState(prefs.primary_language);
  const [secondary, setSecondary] = useState<string[]>(prefs.secondary_languages);
  const [freeBlocks, setFreeBlocks] = useState<string[]>(prefs.pref_free_blocks);
  const [babyAt, setBabyAt] = useState(prefs.pref_baby_at_meetups);
  const [formats, setFormats] = useState<string[]>(prefs.pref_meetup_formats);

  // Location (address + resolved coords). Matching is distance-based, so keeping
  // this up to date matters — mirror the onboarding capture (typed + geolocate).
  const locField = useAddressField({
    address: prefs.address,
    city: prefs.city,
    neighbourhood: prefs.neighbourhood,
    latitude: prefs.latitude,
    longitude: prefs.longitude,
  });

  function toggleArr<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function handleSave() {
    // Location must resolve to coords — matching is distance-based.
    const geo = await locField.resolve();
    if (!geo || geo.latitude == null) return; // resolve() set the error

    setSaving(true);
    await update({
      pref_age_window_weeks: ageWindow,
      pref_distance_minutes: distance,
      primary_language: primary ?? undefined,
      secondary_languages: secondary,
      pref_free_blocks: freeBlocks,
      pref_baby_at_meetups: babyAt,
      pref_meetup_formats: formats,
      address: locField.address.trim(),
      city: geo.city,
      neighbourhood: geo.neighbourhood,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });
    setSaving(false);
    router.back();
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
        <Typography
          style={{ fontFamily: 'CormorantGaramond-LightItalic', fontSize: 20, lineHeight: 25 }}
          color={colors.cobalt}
        >
          Preferences
        </Typography>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Typography variant="label" color={colors.muted}>
          HARD FILTERS
        </Typography>
        <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 4 }}>
          we won&rsquo;t match you outside these.
        </Typography>

        <Section label="Where you live">
          <AddressField field={locField} />
        </Section>

        <Section label="Baby age window">
          <View style={styles.chips}>
            {AGE_WINDOWS.map((w) => (
              <PrefsPill
                key={w}
                label={`±${w} weeks`}
                active={ageWindow === w}
                onPress={() => setAgeWindow(w)}
              />
            ))}
          </View>
        </Section>

        <Section label="Distance">
          <View style={styles.chips}>
            {DISTANCES.map((d) => (
              <PrefsPill
                key={d}
                label={d === -1 ? 'anywhere in city' : `${d} min walk`}
                active={distance === d}
                onPress={() => setDistance(d)}
              />
            ))}
          </View>
        </Section>

        <Section label="Primary language">
          <View style={styles.chips}>
            {LANGUAGES.map((l) => (
              <PrefsPill
                key={l}
                label={l}
                active={primary === l}
                onPress={() => {
                  setPrimary(l);
                  setSecondary((cur) => cur.filter((x) => x !== l));
                }}
              />
            ))}
          </View>
        </Section>

        <Typography variant="label" color={colors.muted} style={{ marginTop: spacing.xxl }}>
          SOFT SIGNALS
        </Typography>
        <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 4 }}>
          we&rsquo;ll favour these but won&rsquo;t hard-block.
        </Typography>

        <Section label="Other languages (max 2)">
          <View style={styles.chips}>
            {LANGUAGES.filter((l) => l !== primary).map((l) => (
              <PrefsPill
                key={l}
                label={l}
                active={secondary.includes(l)}
                onPress={() => {
                  if (secondary.includes(l)) setSecondary(secondary.filter((x) => x !== l));
                  else if (secondary.length < 2) setSecondary([...secondary, l]);
                }}
              />
            ))}
          </View>
        </Section>

        <Section label="When you&rsquo;re free">
          <View style={styles.chips}>
            {FREE_BLOCKS.map((b) => (
              <PrefsPill
                key={b}
                label={b}
                active={freeBlocks.includes(b)}
                onPress={() => setFreeBlocks(toggleArr(freeBlocks, b))}
              />
            ))}
          </View>
        </Section>

        <Section label="Baby at meetups">
          <View style={styles.chips}>
            {BABY_OPTIONS.map((o) => (
              <PrefsPill
                key={o.value}
                label={o.label}
                active={babyAt === o.value}
                onPress={() => setBabyAt(o.value)}
              />
            ))}
          </View>
        </Section>

        <Section label="Preferred formats">
          <View style={styles.chips}>
            {FORMATS.map((f) => (
              <PrefsPill
                key={f}
                label={f}
                active={formats.includes(f)}
                onPress={() => setFormats(toggleArr(formats, f))}
              />
            ))}
          </View>
        </Section>

        <Typography variant="bodyM" color={colors.muted} style={styles.footnote}>
          changes apply to your next match. current groups unaffected.
        </Typography>

        <View style={{ marginTop: spacing.xl }}>
          <Button title={saving ? 'saving...' : 'save'} onPress={handleSave} disabled={saving} size="lg" />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Typography variant="labelS" color={colors.muted}>
        {label.toUpperCase()}
      </Typography>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  scroll: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xxxl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footnote: {
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },
});
