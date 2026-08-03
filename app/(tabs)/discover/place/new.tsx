import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressSegments } from '@/components/discover/composer/ProgressSegments';
import { LovedSpotRow } from '@/components/discover/LovedSpotRow';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { PLACE_CATEGORIES, PERSON_CATEGORIES } from '@/constants/discover';
import { scaled } from '@/constants/scale';
import { searchPlaces } from '@/lib/places';
import {
  clearDraft,
  isDraftDirty,
  loadDraft,
  saveDraft,
  type ComposerDraft,
} from '@/lib/composerDraft';
import { useAuth } from '@/hooks/useAuth';
import { useCreateLovedSpot } from '@/hooks/useCreateLovedSpot';
import type { LovedCategory, LovedKind, LovedSpotWithPoster, PlaceAttachment } from '@/types';

const NOTE_MIN = 15;
const NOTE_MAX = 280;
const STEPS = 6;

const TITLES = [
  'What are you adding?',
  'Where is it?',
  'What kind is it?',
  'Why do you love it?',
  'Look right?',
  'It’s on the map.',
];

export default function PlaceComposer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { create, submitting, error } = useCreateLovedSpot();

  const [draft, setDraft] = useState<ComposerDraft>(() => loadDraft());
  const [step, setStep] = useState(0);

  // Persist the draft on every change so a dismissal never loses the note.
  useEffect(() => saveDraft(draft), [draft]);

  const patch = (p: Partial<ComposerDraft>) => setDraft((d) => ({ ...d, ...p }));

  const exit = () => router.back();

  const confirmDiscard = () => {
    if (!isDraftDirty(draft)) {
      exit();
      return;
    }
    Alert.alert('Discard this recommendation?', 'Your note won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          clearDraft();
          exit();
        },
      },
    ]);
  };

  const back = () => {
    if (step === 0) confirmDiscard();
    else setStep((s) => s - 1);
  };

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0:
        return !!draft.kind;
      case 1:
        return !!draft.location?.name;
      case 2:
        return !!draft.category;
      case 3:
        return draft.note.trim().length >= NOTE_MIN;
      default:
        return true;
    }
  }, [step, draft]);

  const publish = async () => {
    if (!draft.kind || !draft.category || !draft.location) return;
    try {
      await create({
        kind: draft.kind,
        name: draft.location.name,
        category: draft.category,
        note: draft.note.trim(),
        address: draft.location.address,
        lat: draft.location.lat,
        lng: draft.location.lng,
        place_id: draft.location.place_id,
        city: user?.city ?? null,
      });
      clearDraft();
      setStep(5);
    } catch {
      // Error surfaced via `error`; stay on the preview with input intact.
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      {/* Chrome */}
      {step < 5 ? (
        <View style={styles.chrome}>
          <Pressable onPress={back} hitSlop={8} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <ProgressSegments count={STEPS} filled={step + 1} />
          <Pressable onPress={confirmDiscard} hitSlop={8} accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step < 5 ? (
          <Typography style={styles.title} color={colors.cobalt}>
            {TITLES[step]}
          </Typography>
        ) : null}

        {step === 0 && <StepType kind={draft.kind} onPick={(kind) => patch({ kind })} />}

        {step === 1 && (
          <StepLocation
            city={user?.city ?? null}
            selected={draft.location}
            onSelect={(location) => patch({ location })}
          />
        )}

        {step === 2 && draft.kind && (
          <StepCategory
            kind={draft.kind}
            value={draft.category}
            onPick={(category) => patch({ category })}
          />
        )}

        {step === 3 && (
          <StepNote value={draft.note} onChange={(note) => patch({ note })} />
        )}

        {step === 4 && (
          <StepPreview draft={draft} user={user} onEditNote={() => setStep(3)} error={error} />
        )}

        {step === 5 && <StepDone city={user?.city ?? null} />}
      </ScrollView>

      {/* Footer action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {step < 3 && (
          <Button title="Next" onPress={() => setStep((s) => s + 1)} disabled={!canAdvance} />
        )}
        {step === 3 && (
          <Button title="Next" onPress={() => setStep(4)} disabled={!canAdvance} />
        )}
        {step === 4 &&
          (submitting ? (
            <View style={styles.submitting}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : (
            <Button title="Publish to the map" onPress={publish} />
          ))}
        {step === 5 && (
          <Button
            title="Back to the map"
            onPress={() => router.replace('/discover/explore')}
          />
        )}
      </View>
    </View>
  );
}

// ── Step 0 · type ────────────────────────────────────────────────
function StepType({
  kind,
  onPick,
}: {
  kind: LovedKind | null;
  onPick: (k: LovedKind) => void;
}) {
  const cards: { key: LovedKind; label: string; hint: string }[] = [
    { key: 'place', label: 'A place', hint: 'Café, park, shop, class…' },
    { key: 'person', label: 'A person', hint: 'Pediatrician, midwife, physio…' },
  ];
  return (
    <View style={{ gap: spacing.md }}>
      {cards.map((c) => {
        const on = kind === c.key;
        return (
          <Pressable
            key={c.key}
            onPress={() => onPick(c.key)}
            style={[styles.typeCard, on && styles.typeCardOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${c.label} — ${c.hint}`}
          >
            <Typography style={styles.typeLabel} color={colors.text}>
              {c.label}
            </Typography>
            <Typography style={styles.typeHint} color={colors.labelMuted}>
              {c.hint}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Step 1 · location ────────────────────────────────────────────
function StepLocation({
  city,
  selected,
  onSelect,
}: {
  city: string | null;
  selected: ComposerDraft['location'];
  onSelect: (loc: ComposerDraft['location']) => void;
}) {
  const [query, setQuery] = useState(selected?.name ?? '');
  const [results, setResults] = useState<PlaceAttachment[]>([]);
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const found = await searchPlaces(q, city);
      if (id === reqId.current) {
        setResults(found);
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query, city]);

  const pick = (p: PlaceAttachment) =>
    onSelect({
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      place_id: p.place_id ?? null,
    });

  const addManually = () => {
    const q = query.trim();
    if (q.length < 2) return;
    onSelect({ name: q, address: city, lat: null, lng: null, place_id: null });
  };

  return (
    <View>
      <Typography style={styles.helper} color={colors.labelMuted}>
        Search for it, or add it by name.
      </Typography>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={`Search a place${city ? ` in ${city}` : ''}…`}
        placeholderTextColor={colors.labelTertiary}
        style={styles.search}
        autoCorrect={false}
      />

      {searching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={colors.cobalt} />
          <Typography variant="bodyM" color={colors.muted}>
            searching {city ?? 'nearby'}…
          </Typography>
        </View>
      ) : null}

      {results.map((p, i) => {
        const on = selected?.name === p.name && selected?.place_id === (p.place_id ?? null);
        return (
          <Pressable
            key={`${p.place_id ?? p.name}-${i}`}
            onPress={() => pick(p)}
            style={[styles.suggestion, on && styles.suggestionOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={p.name}
          >
            <View style={styles.pinBadge}>
              <Ionicons name="location-sharp" size={18} color={colors.cobalt} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.suggestionName} color={colors.text} numberOfLines={1}>
                {p.name}
              </Typography>
              {p.address ? (
                <Typography style={styles.suggestionMeta} color={colors.labelMuted} numberOfLines={1}>
                  {p.address}
                </Typography>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {query.trim().length >= 2 && !searching ? (
        <Pressable onPress={addManually} style={styles.manual} accessibilityRole="button">
          <Typography style={styles.manualText} color={colors.cobalt}>
            + Can’t find it? Add “{query.trim()}” manually
          </Typography>
        </Pressable>
      ) : null}

      {selected ? (
        <Typography style={styles.selectedNote} color={colors.cobalt}>
          Selected: {selected.name}
        </Typography>
      ) : null}
    </View>
  );
}

// ── Step 2 · category ────────────────────────────────────────────
function StepCategory({
  kind,
  value,
  onPick,
}: {
  kind: LovedKind;
  value: LovedCategory | null;
  onPick: (c: LovedCategory) => void;
}) {
  const set = kind === 'place' ? PLACE_CATEGORIES : PERSON_CATEGORIES;
  return (
    <View style={styles.chipWrap}>
      {set.map((c) => {
        const on = value === c.value;
        return (
          <Pressable
            key={c.value}
            onPress={() => onPick(c.value)}
            style={[styles.catChip, on && styles.catChipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Typography style={styles.catChipText} color={on ? colors.white : colors.text}>
              {c.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Step 3 · note ────────────────────────────────────────────────
function StepNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const len = value.trim().length;
  return (
    <View>
      <Typography style={styles.helper} color={colors.labelMuted}>
        One honest line. This is what other moms read first.
      </Typography>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, NOTE_MAX))}
        placeholder="Quiet corner upstairs, great changing table, staff don’t side-eye you for breastfeeding…"
        placeholderTextColor={colors.labelTertiary}
        style={styles.textarea}
        multiline
        textAlignVertical="top"
      />
      <Typography style={styles.counter} color={len < NOTE_MIN ? colors.labelTertiary : colors.labelMuted}>
        {len < NOTE_MIN ? `${NOTE_MIN - len} more characters` : `${value.length}/${NOTE_MAX}`}
      </Typography>
    </View>
  );
}

// ── Step 4 · preview ─────────────────────────────────────────────
function StepPreview({
  draft,
  user,
  onEditNote,
  error,
}: {
  draft: ComposerDraft;
  user: ReturnType<typeof useAuth>['user'];
  onEditNote: () => void;
  error: string | null;
}) {
  if (!draft.kind || !draft.category || !draft.location) return null;
  const preview: LovedSpotWithPoster = {
    id: 'preview',
    kind: draft.kind,
    poster_id: user?.id ?? 'me',
    name: draft.location.name,
    category: draft.category,
    note: draft.note,
    address: draft.location.address,
    lat: draft.location.lat,
    lng: draft.location.lng,
    place_id: draft.location.place_id,
    city: user?.city ?? null,
    phone: null,
    booking_url: null,
    created_at: new Date().toISOString(),
    poster: {
      id: user?.id ?? 'me',
      display_name: user?.display_name ?? 'You',
      profile_color: user?.profile_color ?? null,
      neighbourhood: user?.neighbourhood ?? null,
    },
  };
  return (
    <View>
      <Typography style={styles.helper} color={colors.labelMuted}>
        This is exactly what other moms will see.
      </Typography>
      <View style={styles.previewCard} pointerEvents="none">
        <LovedSpotRow spot={preview} onPress={() => {}} />
      </View>
      <View style={styles.previewNote}>
        <Typography style={styles.previewNoteText} color={colors.mutedStrong}>
          “{draft.note}”
        </Typography>
      </View>
      {error ? (
        <Typography variant="bodyL" color={colors.cherry} style={{ marginTop: spacing.md }}>
          {error}
        </Typography>
      ) : null}
      <Pressable onPress={onEditNote} hitSlop={6} style={{ marginTop: spacing.lg }}>
        <Typography style={styles.editLink} color={colors.cobalt}>
          Edit my note
        </Typography>
      </Pressable>
    </View>
  );
}

// ── Step 5 · done ────────────────────────────────────────────────
function StepDone({ city }: { city: string | null }) {
  return (
    <View style={styles.done}>
      <View style={styles.doneCircle}>
        <Ionicons name="checkmark" size={32} color={colors.white} />
      </View>
      <Typography style={styles.doneTitle} color={colors.text}>
        It’s on the map.
      </Typography>
      <Typography style={styles.doneBody} color={colors.labelMuted}>
        Other moms{city ? ` in ${city}` : ''} will see it now — loved by you.
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg, paddingHorizontal: spacing.xxl },
  chrome: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.xl },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  title: { fontFamily: fonts.serifItal, fontSize: scaled(30), lineHeight: scaled(35), marginBottom: spacing.md },
  helper: { fontFamily: fonts.body, fontSize: scaled(14.5), lineHeight: scaled(22), marginBottom: spacing.lg },

  // step 0
  typeCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  typeCardOn: { borderColor: colors.cobalt, backgroundColor: colors.cobaltSoft },
  typeLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(17) },
  typeHint: { fontFamily: fonts.body, fontSize: scaled(13.5), marginTop: 3 },

  // step 1
  search: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: fonts.body,
    fontSize: scaled(17),
    color: colors.text,
  },
  searchingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  suggestionOn: { backgroundColor: colors.cobaltSoft, borderRadius: radius.sm },
  pinBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cobaltSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionName: { fontFamily: fonts.bodyMed, fontSize: scaled(16) },
  suggestionMeta: { fontFamily: fonts.body, fontSize: scaled(13), marginTop: 1 },
  manual: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: 14,
    marginTop: spacing.lg,
  },
  manualText: { fontFamily: fonts.bodySemi, fontSize: scaled(14) },
  selectedNote: { fontFamily: fonts.bodyMed, fontSize: scaled(13), marginTop: spacing.lg },

  // step 2
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  catChip: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  catChipOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  catChipText: { fontFamily: fonts.bodyMed, fontSize: scaled(14) },

  // step 3
  textarea: {
    minHeight: 120,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: scaled(16),
    lineHeight: scaled(24),
    color: colors.text,
  },
  counter: { fontFamily: fonts.body, fontSize: scaled(12.5), marginTop: spacing.sm, textAlign: 'right' },

  // step 4
  previewCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  previewNote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.cobalt,
    paddingLeft: spacing.lg,
    marginTop: spacing.lg,
  },
  previewNoteText: { fontFamily: fonts.readingItal, fontSize: scaled(15), lineHeight: scaled(23) },
  editLink: { fontFamily: fonts.bodySemi, fontSize: scaled(15) },

  // step 5
  done: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.md },
  doneCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cobalt,
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  doneTitle: { fontFamily: fonts.serifReg, fontSize: scaled(30), lineHeight: scaled(34), marginTop: spacing.sm },
  doneBody: { fontFamily: fonts.body, fontSize: scaled(15), lineHeight: scaled(22), textAlign: 'center' },

  footer: { paddingTop: spacing.md },
  submitting: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.cobaltDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
