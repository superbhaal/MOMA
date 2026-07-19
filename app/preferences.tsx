import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { PrefsPill } from '@/components/preferences/PrefsPill';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { LANGUAGES } from '@/constants/onboarding';
import { usePreferences } from '@/hooks/usePreferences';
import { resolveCurrentLocation, resolveTypedAddress } from '@/lib/geocode';
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
  const [address, setAddress] = useState(prefs.address ?? '');
  const [loc, setLoc] = useState<{
    city: string | null;
    neighbourhood: string | null;
    latitude: number | null;
    longitude: number | null;
  }>({
    city: prefs.city,
    neighbourhood: prefs.neighbourhood,
    latitude: prefs.latitude,
    longitude: prefs.longitude,
  });
  const [locating, setLocating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const locVerified = loc.latitude != null && loc.longitude != null;
  const locLabel = loc.neighbourhood
    ? `${loc.neighbourhood}, ${loc.city ?? ''}`.replace(/, $/, '')
    : loc.city;

  function toggleArr<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function handleUseLocation() {
    setLocError(null);
    setLocating(true);
    const r = await resolveCurrentLocation();
    setLocating(false);
    if (!r.ok) {
      setLocError(r.error);
      return;
    }
    setAddress(r.result.address);
    setLoc({
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    });
  }

  async function verifyAddress(): Promise<typeof loc | null> {
    const addr = address.trim();
    if (!addr) return null;
    if (loc.latitude != null) return loc;
    setLocError(null);
    setVerifying(true);
    const r = await resolveTypedAddress(addr);
    setVerifying(false);
    if (!r.ok || r.result.latitude == null) {
      setLocError("we couldn't find that address. check the spelling, or tap the location icon.");
      return null;
    }
    const next = {
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    };
    setLoc(next);
    return next;
  }

  async function handleSave() {
    // Location must resolve to coords — matching is distance-based.
    const addr = address.trim();
    if (!addr) {
      setLocError('your address is needed so we can match you within walking distance.');
      return;
    }
    const geo = loc.latitude != null ? loc : await verifyAddress();
    if (!geo || geo.latitude == null) return; // verifyAddress set the error

    setSaving(true);
    await update({
      pref_age_window_weeks: ageWindow,
      pref_distance_minutes: distance,
      primary_language: primary ?? undefined,
      secondary_languages: secondary,
      pref_free_blocks: freeBlocks,
      pref_baby_at_meetups: babyAt,
      pref_meetup_formats: formats,
      address: addr,
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
        <Typography variant="displayS" color={colors.text}>
          preferences
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
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.addrInput}
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                if (locError) setLocError(null);
                setLoc({ city: null, neighbourhood: null, latitude: null, longitude: null });
              }}
              onSubmitEditing={verifyAddress}
              returnKeyType="search"
              placeholder="e.g. Rue de Rivoli, Paris"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
            />
            {verifying ? (
              <ActivityIndicator size="small" color={colors.cobalt} />
            ) : (
              <Pressable onPress={handleUseLocation} disabled={locating} hitSlop={10}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.cobalt} />
                ) : (
                  <Ionicons name="location-outline" size={20} color={colors.cobalt} />
                )}
              </Pressable>
            )}
          </View>
          {locVerified ? (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.cobalt} />
              <Typography variant="bodyM" color={colors.cobalt} style={styles.verifiedText}>
                {locLabel ?? 'location verified'}
              </Typography>
            </View>
          ) : locError ? (
            <Typography variant="bodyM" color={colors.cherry} style={{ marginTop: 6 }}>
              {locError}
            </Typography>
          ) : (
            <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 6, fontStyle: 'italic' }}>
              Used to match you with moms within walking distance.
            </Typography>
          )}
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  addrInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  verifiedText: { fontFamily: fonts.bodyMed },
  footnote: {
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },
});
