import { useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { ColorSwatch } from '@/components/onboarding/ColorSwatch';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { LANGUAGE_OPTIONS, PROFILE_COLOUR_SWATCHES } from '@/constants/onboarding';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import { lifeStageFromDob } from '@/lib/lifeStage';

const MAX_SECONDARY = 2;
const DOB_MIN = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 6);
const DOB_MAX = new Date(Date.now() + 1000 * 60 * 60 * 24 * 300);

/**
 * Matching preferences — v11. The screen mirrors the onboarding quiz rather
 * than exposing the scoring knobs: a tester expected to find the same handful
 * of answers she gave when she signed up, and instead met distance sliders and
 * meetup formats she had never been asked about.
 * Ref: design/moma-v11.html · #screen-prefs.
 */
export default function PreferencesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { update } = usePreferences();

  const [isFirst, setIsFirst] = useState<boolean | null>(user?.is_first_baby ?? null);
  const [babyDob, setBabyDob] = useState<string | null>(user?.baby_dob ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // One list, in pick order: the first is the language matching leans on, the
  // rest are "also speak". Keeps the DB's primary/secondary split without
  // asking twice.
  const [languages, setLanguages] = useState<string[]>(() =>
    [user?.primary_language, ...(user?.secondary_languages ?? [])].filter(Boolean) as string[],
  );
  const [custom, setCustom] = useState<string[]>(() => {
    const known = new Set(LANGUAGE_OPTIONS.map((l) => l.label));
    return [user?.primary_language, ...(user?.secondary_languages ?? [])]
      .filter((l): l is string => !!l && !known.has(l));
  });
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const draftRef = useRef<TextInput>(null);

  const [colour, setColour] = useState<string | null>(user?.profile_color ?? null);

  const [push, setPush] = useState(user?.notif_meetup_reminders ?? true);
  const [email, setEmail] = useState(user?.notif_email ?? true);
  const [inApp, setInApp] = useState(user?.notif_in_app ?? true);

  const [saving, setSaving] = useState(false);

  // Pick order carries meaning (first = what matching leans on), so the cap has
  // to drop someone rather than silently refuse: tapping a fourth language
  // replaces the last "also speak" instead of doing nothing, which is what made
  // a newly-added language look broken.
  function toggleLanguage(label: string) {
    setLanguages((cur) => {
      if (cur.includes(label)) return cur.filter((l) => l !== label);
      if (cur.length < MAX_SECONDARY + 1) return [...cur, label];
      return [...cur.slice(0, MAX_SECONDARY), label];
    });
  }

  function commitCustom() {
    const value = draft.trim();
    if (!value) return;
    // Match an existing entry case-insensitively so "dutch" doesn't become a
    // second Dutch pill.
    const existing = [...LANGUAGE_OPTIONS.map((l) => l.label), ...custom].find(
      (l) => l.toLowerCase() === value.toLowerCase(),
    );
    const label = existing ?? value;
    if (!existing) setCustom((cur) => [...cur, label]);
    // Always end up selected — typing it in is the act of choosing it.
    if (!languages.includes(label)) toggleLanguage(label);
    setDraft('');
    setAddOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    const [primary, ...secondary] = languages;
    await update({
      is_first_baby: isFirst ?? undefined,
      ...(babyDob && { baby_dob: babyDob, life_stage: lifeStageFromDob(babyDob) }),
      ...(primary && { primary_language: primary }),
      secondary_languages: secondary.slice(0, MAX_SECONDARY),
      ...(colour && { profile_color: colour }),
      notif_meetup_reminders: push,
      notif_email: email,
      notif_in_app: inApp,
    });
    setSaving(false);
    router.back();
  }

  const allLanguages = [
    ...LANGUAGE_OPTIONS,
    ...custom.map((label) => ({ label, flag: undefined })),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Typography style={styles.back} color={colors.cobalt}>
            ←
          </Typography>
        </Pressable>
        <Typography style={styles.title} color={colors.cobalt}>
          Matching{'\n'}preferences
        </Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.sectionLabel} color={colors.cobalt}>
          WHO YOU GET MATCHED WITH
        </Typography>

        <Field
          label="First baby"
          hint="Whether this is your first time, or you&rsquo;ve been here before."
        >
          <View style={styles.pills}>
            <Choice label="Yes, first" active={isFirst === true} onPress={() => setIsFirst(true)} />
            <Choice
              label="No, been here before"
              active={isFirst === false}
              onPress={() => setIsFirst(false)}
            />
          </View>
        </Field>

        <Field
          label="Youngest baby born"
          hint="Or due date if you&rsquo;re expecting. Drives life stage and matching."
        >
          <Pressable style={styles.dateRow} onPress={() => setPickerOpen(true)}>
            <Typography style={[styles.dateText, !babyDob && styles.datePlaceholder]}>
              {babyDob ? formatDob(babyDob) : 'dd / mm / yyyy'}
            </Typography>
            <Ionicons name="calendar-outline" size={20} color={colors.cobalt} />
          </Pressable>
        </Field>

        <Field
          label="Languages spoken at home"
          hint={`Up to ${MAX_SECONDARY + 1}. The first one is what we match on.`}
        >
          <View style={styles.pills}>
            {allLanguages.map((l) => (
              <Choice
                key={l.label}
                label={l.flag ? `${l.flag}  ${l.label}` : l.label}
                active={languages.includes(l.label)}
                onPress={() => toggleLanguage(l.label)}
              />
            ))}
            <Pressable
              style={[styles.pill, styles.pillDashed]}
              onPress={() => {
                setDraft('');
                setAddOpen(true);
              }}
            >
              <Typography style={styles.pillText} color={colors.muted}>
                + Other
              </Typography>
            </Pressable>
          </View>
        </Field>

        <Field label="Your colour" hint="Shows up on your avatar across the app.">
          <View style={styles.swatches}>
            {PROFILE_COLOUR_SWATCHES.map((s) => (
              <ColorSwatch
                key={s.name}
                hex={s.hex}
                selected={colour === s.hex}
                onPress={() => setColour(s.hex)}
                size={34}
              />
            ))}
          </View>
        </Field>

        <Typography style={[styles.sectionLabel, styles.sectionLabelGap]} color={colors.cobalt}>
          NOTIFICATIONS
        </Typography>

        <ToggleRow
          label="Push"
          hint="Matches, meetup reminders, direct mentions."
          value={push}
          onChange={setPush}
        />
        <ToggleRow
          label="Email"
          hint="Match confirmation and a weekly group summary. Nothing else."
          value={email}
          onChange={setEmail}
        />
        <ToggleRow
          label="Badges in the app"
          hint="The little dot on group cards when there's something new."
          value={inApp}
          onChange={setInApp}
          isLast
        />

        <Typography style={styles.footnote} color={colors.muted}>
          Changes apply to your next match. If you&rsquo;re already in a group, nothing
          changes until you&rsquo;re matched again.
        </Typography>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            title={saving ? 'saving…' : 'Save'}
            onPress={handleSave}
            disabled={saving}
            size="lg"
          />
        </View>
      </ScrollView>

      {/* Date picker — inline sheet on iOS, native dialog on Android. */}
      {Platform.OS === 'ios' ? (
        <ActionSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          title="Youngest baby born"
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

      <ActionSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onShow={() => draftRef.current?.focus()}
        title="Add a language"
      >
        <TextInput
          ref={draftRef}
          style={styles.sheetInput}
          value={draft}
          onChangeText={setDraft}
          placeholder="e.g. Catalan, Wolof, Mandarin"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={commitCustom}
          maxLength={32}
        />
        <Button title="Add" size="lg" onPress={commitCustom} disabled={!draft.trim()} />
      </ActionSheet>
    </View>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Typography style={styles.fieldLabel} color={colors.text}>
        {label}
      </Typography>
      <Typography style={styles.fieldHint} color={colors.muted}>
        {hint}
      </Typography>
      <View style={{ marginTop: spacing.md }}>{children}</View>
    </View>
  );
}

function Choice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Typography
        style={[styles.pillText, active && styles.pillTextActive]}
        color={active ? colors.white : colors.text}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  isLast,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, isLast && styles.toggleRowLast]}>
      <View style={styles.toggleText}>
        <Typography style={styles.fieldLabel} color={colors.text}>
          {label}
        </Typography>
        <Typography style={styles.fieldHint} color={colors.muted}>
          {hint}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.lineStrong, true: colors.cobalt }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function formatDob(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d} / ${m} / ${y}`;
}
function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  // Opaque and above the list: the title is transparent over a ScrollView, so
  // rows slid underneath it and read as overlapping text.
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: 26,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    zIndex: 1,
  },
  back: { fontFamily: fonts.body, fontSize: scaled(20), marginTop: scaled(10) },
  title: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(34),
    lineHeight: scaled(40),
    letterSpacing: -0.8,
    flex: 1,
  },
  scroll: { paddingHorizontal: 26, paddingBottom: spacing.xxxl },
  sectionLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 2.4,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sectionLabelGap: { marginTop: spacing.xxl },
  field: {
    marginTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  fieldLabel: { fontFamily: fonts.bodyMed, fontSize: scaled(17) },
  fieldHint: { fontFamily: fonts.body, fontSize: scaled(13.5), lineHeight: scaled(19), marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  pillActive: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  pillDashed: { borderStyle: 'dashed' },
  pillText: { fontFamily: fonts.bodyMed, fontSize: scaled(15) },
  pillTextActive: { fontFamily: fonts.bodySemi },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontFamily: fonts.body, fontSize: scaled(20), color: colors.text },
  datePlaceholder: { color: colors.muted },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  toggleRowLast: { borderBottomWidth: 0 },
  toggleText: { flex: 1 },
  footnote: {
    fontFamily: fonts.body,
    fontSize: scaled(13),
    lineHeight: scaled(19),
    marginTop: spacing.xl,
  },
  sheetInput: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
});
