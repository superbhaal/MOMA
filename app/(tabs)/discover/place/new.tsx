import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressSegments } from '@/components/discover/composer/ProgressSegments';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { PLACE_CATEGORIES, PERSON_CATEGORIES, categoryLabel } from '@/constants/discover';
import { scaled } from '@/constants/scale';
import { searchPlaces } from '@/lib/places';
import { staticMapUri } from '@/lib/maps';
import { uploadImage } from '@/lib/uploadImage';
import {
  clearDraft,
  isDraftDirty,
  loadDraft,
  saveDraft,
  type ComposerDraft,
} from '@/lib/composerDraft';
import {
  ComposerChips,
  ComposerCta,
  ComposerDisclosure,
  ComposerField,
  ComposerInput,
  ComposerPhoto,
} from '@/components/composer';
import { useAuth } from '@/hooks/useAuth';
import { useCreateLovedSpot } from '@/hooks/useCreateLovedSpot';
import type { LovedCategory, LovedKind, PlaceAttachment } from '@/types';

const NOTE_MIN = 15;
const NOTE_MAX = 240;
const STEPS = 6;

/**
 * Add-a-place composer, v11. Six steps: find it, confirm it, photograph it,
 * classify it, say why, look at it. Kind (place or person) is a pair of tabs on
 * the first step rather than a step of its own — asking "what are you adding?"
 * before "which one?" made a decision out of something the answer already
 * contains.
 */

type Copy = { title: string; sub?: string };

const COPY: Record<LovedKind, Copy[]> = {
  place: [
    { title: 'Where is it?', sub: 'A place all moms should know about.' },
    { title: 'Right place?', sub: 'We’ll drop a pin here so other moms can find it.' },
    { title: 'Add a photo', sub: 'One picture that captures it best.' },
    { title: 'What kind of place?', sub: 'Pick one. We’ll use it to filter the map.' },
    {
      title: 'Why is it good for moms?',
      sub: 'Keep it short and honest. The specific stuff matters most.',
    },
    { title: 'Look right?', sub: 'This is how it’ll appear on the map.' },
  ],
  person: [
    { title: 'Who is it?', sub: 'A professional you’d send your closest friend to.' },
    { title: 'Right person?', sub: 'We’ll list the practice address so other moms can reach them.' },
    { title: 'Add a photo', sub: 'One picture that captures it best.' },
    { title: 'Who do they help?', sub: 'Pick one. We’ll use it to filter the map.' },
    {
      title: 'Why is she/he great with moms?',
      sub: 'Keep it affirmative & positive, this is a real recommendation another mom will act on. Warnings belong in private chats, not on a public map.',
    },
    { title: 'Look right?', sub: 'This is how it’ll appear on the map.' },
  ],
};

const TIPS: Record<LovedKind, string[]> = {
  place: [
    'Great changing table in the bathroom, quiet corner upstairs.',
    'Stroller-friendly entrance, staff are wonderful with babies.',
    'Storytime Wednesdays at 10am. They have a small play area.',
  ],
  person: [
    'She’s calm with anxious moms — never makes you feel rushed.',
    'Takes the time to explain. Answers questions over email between visits.',
    'She held my hand through a really hard week and didn’t bill me extra for it.',
  ],
};

export default function PlaceComposer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { create, submitting, error } = useCreateLovedSpot();

  // Opened from the People tab? Then that's what she's adding. Landing on
  // "A place" when the map behind you says People is the app not listening.
  const { kind: kindParam } = useLocalSearchParams<{ kind?: string }>();
  const [draft, setDraft] = useState<ComposerDraft>(() => {
    const d = loadDraft();
    return kindParam === 'person' || kindParam === 'place'
      ? { ...d, kind: kindParam as LovedKind }
      : d;
  });
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Persist the draft on every change so a dismissal never loses the note.
  useEffect(() => saveDraft(draft), [draft]);

  const kind: LovedKind = draft.kind ?? 'place';
  const copy = COPY[kind][step];

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
        return !!draft.location?.name;
      case 1:
        return true;
      case 2:
        return true; // the photo is optional — "Skip for now" is a real answer
      case 3:
        return !!draft.category;
      case 4:
        return draft.note.trim().length >= NOTE_MIN;
      default:
        return true;
    }
  }, [step, draft]);

  /** Switching tabs changes what the search means and what the categories are,
   *  so anything downstream of the choice has to go with it. */
  const switchKind = (next: LovedKind) => {
    if (next === kind) return;
    patch({ kind: next, location: null, category: null });
  };

  const publish = async () => {
    if (!draft.category || !draft.location) return;
    setPhotoError(null);

    // The photo goes up only now: a composer abandoned at step 4 shouldn't have
    // left a file in the bucket for nobody.
    let photoUrl: string | null = null;
    if (draft.photoUri && user?.id) {
      setUploading(true);
      const { url, error: upErr } = await uploadImage('spot-photos', user.id, draft.photoUri);
      setUploading(false);
      if (upErr) {
        // The photo was optional; the recommendation isn't. Say what happened
        // and let them post without it rather than losing the note.
        setPhotoError('Couldn’t upload the photo. Post without it, or go back and pick another.');
        patch({ photoUri: null });
        return;
      }
      photoUrl = url;
    }

    try {
      await create({
        kind,
        name: draft.location.name,
        category: draft.category,
        note: draft.note.trim(),
        address: draft.location.address,
        lat: draft.location.lat,
        lng: draft.location.lng,
        place_id: draft.location.place_id,
        city: user?.city ?? null,
        photo_url: photoUrl,
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        booking_url: draft.website.trim() || null,
      });
      clearDraft();
      router.replace('/discover/explore');
    } catch {
      // Error surfaced via `error`; stay on the preview with input intact.
    }
  };

  const busy = submitting || uploading;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.chrome}>
        <Pressable onPress={back} hitSlop={8} accessibilityLabel={step === 0 ? 'Close' : 'Back'}>
          <Ionicons name="arrow-back" size={22} color={colors.cobalt} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressSegments count={STEPS} filled={step + 1} />
        </View>
        <Typography style={styles.counter} color={colors.mutedStrong}>
          {step + 1}/{STEPS}
        </Typography>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // Scrolling the results puts the keyboard away — on a phone that's the
        // gesture you make when you want to see the list you're scrolling.
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? <KindTabs kind={kind} onChange={switchKind} /> : null}

        {/* The badge appears once the kind stops being editable, so the poster
            can still see which map they're posting to. */}
        {step === 3 || step === 4 ? (
          <View style={styles.postingBadge}>
            <View style={styles.postingDot} />
            <Typography style={styles.postingText} color={colors.cobalt}>
              POSTING · {kind === 'place' ? 'PLACES' : 'PEOPLE'}
            </Typography>
          </View>
        ) : null}

        <Typography style={styles.title} color={colors.text}>
          {copy.title}
        </Typography>
        {copy.sub ? (
          <Typography style={styles.sub} color={colors.mutedStrong}>
            {copy.sub}
          </Typography>
        ) : null}

        {step === 0 && (
          <StepFind
            kind={kind}
            city={user?.city ?? null}
            selected={draft.location}
            onSelect={(location) => {
              // Picking IS the answer to "where is it?", so it moves on to the
              // confirmation rather than quietly enabling a button at the far
              // end of the screen. "Add manually" looked broken for exactly
              // that reason: it worked, but nothing on screen said so.
              patch({ location });
              Keyboard.dismiss();
              setStep(1);
            }}
          />
        )}

        {step === 1 && <StepConfirm location={draft.location} />}

        {step === 2 && (
          <StepPhoto
            uri={draft.photoUri}
            onPick={(photoUri) => patch({ photoUri })}
            onClear={() => patch({ photoUri: null })}
            onSkip={() => {
              patch({ photoUri: null });
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <StepCategory
            kind={kind}
            value={draft.category}
            onPick={(category) => patch({ category })}
          />
        )}

        {step === 4 && (
          <StepNote
            kind={kind}
            value={draft.note}
            onChange={(note) => patch({ note })}
            phone={draft.phone}
            email={draft.email}
            website={draft.website}
            onContact={(p) => patch(p)}
          />
        )}

        {step === 5 && (
          <StepPreview
            draft={draft}
            kind={kind}
            posterName={user?.display_name ?? null}
            error={error ?? photoError}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {step > 0 ? (
          <View style={styles.footerHalf}>
            <Button title="Back" variant="secondary" onPress={back} />
          </View>
        ) : null}
        <View style={step > 0 ? styles.footerHalf : styles.footerSolo}>
          {step < 4 ? (
            <Button title="Next" onPress={() => setStep((s) => s + 1)} disabled={!canAdvance} />
          ) : null}
          {step === 4 ? (
            <Button title="Preview" onPress={() => setStep(5)} disabled={!canAdvance} />
          ) : null}
          {step === 5 ? (
            busy ? (
              <View style={styles.submitting}>
                <ActivityIndicator color={colors.white} />
              </View>
            ) : (
              <Button title="Post" onPress={publish} />
            )
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ── Step 1 · kind tabs + find ────────────────────────────────────
function KindTabs({ kind, onChange }: { kind: LovedKind; onChange: (k: LovedKind) => void }) {
  // No sub-labels: "café · park · shop" explained a distinction the two words
  // already make, and the step's own question says the rest.
  const tabs: { key: LovedKind; label: string }[] = [
    { key: 'place', label: 'A place' },
    { key: 'person', label: 'A person' },
  ];
  return (
    <View style={styles.tabRow} accessibilityRole="tablist">
      {tabs.map((t) => {
        const on = t.key === kind;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, on && styles.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Typography style={styles.tabLabel} color={on ? colors.cobalt : colors.text}>
              {t.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepFind({
  kind,
  city,
  selected,
  onSelect,
}: {
  kind: LovedKind;
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

  // Manual entry used to save the search box verbatim: a name, no address, and
  // therefore no coordinates — the place existed in the list and nowhere on the
  // map. It now asks for both, and geocodes the address so it gets a pin like
  // any other. Explore is a map; a place without a point on it is half there.
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [locating, setLocating] = useState(false);

  const manualReady = manualName.trim().length >= 2 && manualAddress.trim().length >= 4;

  const saveManual = async () => {
    if (!manualReady) return;
    setLocating(true);
    // Reuse the places search to turn the address into coordinates. If Google
    // doesn't recognise it we still save what she typed — losing her entry to
    // punish a bad postcode would be the worse trade.
    const [hit] = await searchPlaces(manualAddress.trim(), city);
    setLocating(false);
    onSelect({
      name: manualName.trim(),
      address: hit?.address ?? manualAddress.trim(),
      lat: hit?.lat ?? null,
      lng: hit?.lng ?? null,
      place_id: null,
    });
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={
          kind === 'place' ? `Search a place${city ? ` in ${city}` : ''}…` : 'Search by name…'
        }
        placeholderTextColor={colors.muted}
        style={styles.search}
        autoCorrect={false}
      />

      {searching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={colors.cobalt} />
          <Typography style={styles.searchingText} color={colors.muted}>
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
            <View style={[styles.pinBadge, kind === 'person' && styles.pinBadgePerson]}>
              <Ionicons
                name={kind === 'place' ? 'location-sharp' : 'person'}
                size={18}
                color={kind === 'place' ? colors.cobalt : colors.orange}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Typography style={styles.suggestionName} color={colors.text} numberOfLines={1}>
                {p.name}
              </Typography>
              {p.address ? (
                <Typography
                  style={styles.suggestionMeta}
                  color={colors.mutedStrong}
                  numberOfLines={1}
                >
                  {p.address}
                </Typography>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {!manualOpen ? (
        <Pressable
          onPress={() => {
            setManualOpen(true);
            setManualName(query.trim());
          }}
          style={styles.manual}
          accessibilityRole="button"
        >
          <Typography style={styles.manualText} color={colors.cobalt}>
            + Can’t find {kind === 'place' ? 'it' : 'them'}? Add manually
          </Typography>
        </Pressable>
      ) : (
        <View style={styles.manualForm}>
          <ComposerField label={kind === 'place' ? 'Name' : 'Their name'} hint="required">
            <ComposerInput
              value={manualName}
              onChangeText={setManualName}
              placeholder={kind === 'place' ? 'Café Lindengracht' : 'Dr. Nora van Dijk'}
              autoFocus
            />
          </ComposerField>

          <ComposerField label="Address" hint="required">
            <ComposerInput
              value={manualAddress}
              onChangeText={setManualAddress}
              placeholder={`Street and number${city ? `, ${city}` : ''}`}
            />
          </ComposerField>
          <Typography style={styles.manualHint} color={colors.muted}>
            We need the address to drop a pin — without one it won’t show on the map.
          </Typography>

          <ComposerCta
            title="Use this"
            onPress={saveManual}
            disabled={!manualReady}
            busy={locating}
            size="md"
          />
        </View>
      )}
    </View>
  );
}

// ── Step 2 · confirm ─────────────────────────────────────────────
function StepConfirm({ location }: { location: ComposerDraft['location'] }) {
  if (!location) return null;
  const map = staticMapUri({ lat: location.lat, lng: location.lng });
  return (
    <View>
      <View style={styles.mapFrame}>
        {map ? (
          <Image source={{ uri: map }} style={styles.mapImage} resizeMode="cover" />
        ) : (
          // A manually-added spot has no coordinates, so there is no pin to
          // show. Saying so beats an empty frame that looks like a failure.
          <View style={styles.mapEmpty}>
            <Ionicons name="location-outline" size={22} color={colors.mutedStrong} />
            <Typography style={styles.mapEmptyText} color={colors.mutedStrong}>
              No pin — added by name
            </Typography>
          </View>
        )}
      </View>
      <Typography style={styles.confirmName} color={colors.text}>
        {location.name}
      </Typography>
      {location.address ? (
        <Typography style={styles.confirmAddress} color={colors.mutedStrong}>
          {location.address}
        </Typography>
      ) : null}
    </View>
  );
}

// ── Step 3 · photo ───────────────────────────────────────────────
function StepPhoto({
  uri,
  onPick,
  onClear,
  onSkip,
}: {
  uri: string | null;
  onPick: (uri: string) => void;
  onClear: () => void;
  onSkip: () => void;
}) {
  return <ComposerPhoto uri={uri} onPick={onPick} onClear={onClear} onSkip={onSkip} />;
}

// ── Step 4 · category ────────────────────────────────────────────
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
    <ComposerChips
      options={set}
      selected={value ? [value] : []}
      onToggle={(v) => onPick(v as LovedCategory)}
    />
  );
}

// ── Step 5 · note ────────────────────────────────────────────────
function StepNote({
  kind,
  value,
  onChange,
  phone,
  email,
  website,
  onContact,
}: {
  kind: LovedKind;
  value: string;
  onChange: (v: string) => void;
  phone: string;
  email: string;
  website: string;
  onContact: (p: { phone?: string; email?: string; website?: string }) => void;
}) {
  const len = value.trim().length;
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, NOTE_MAX))}
        placeholder={TIPS[kind][0]}
        placeholderTextColor={colors.muted}
        style={styles.textarea}
        multiline
        textAlignVertical="top"
      />
      <Typography
        style={styles.charCount}
        color={len < NOTE_MIN ? colors.muted : colors.mutedStrong}
      >
        {len < NOTE_MIN ? `${NOTE_MIN - len} more characters` : `${value.length}/${NOTE_MAX}`}
      </Typography>

      <ComposerDisclosure title="Tips for a good tip">
        {TIPS[kind].map((tip) => (
          <View key={tip} style={styles.tip}>
            <Typography style={styles.tipText} color={colors.mutedStrong}>
              &ldquo;{tip}&rdquo;
            </Typography>
          </View>
        ))}
      </ComposerDisclosure>

      {/* Contact details, offered and never asked for. Folded away by default:
          the note is what this step is for, and a row of empty fields under it
          would read as four more things to fill in. */}
      <ComposerDisclosure title="Anything else worth knowing?">
        <Typography style={styles.contactHint} color={colors.muted}>
          All optional — add a way to reach them if you have one.
        </Typography>
        <ComposerField label="Phone">
          <ComposerInput
            value={phone}
            onChangeText={(v) => onContact({ phone: v })}
            placeholder="Phone"
            keyboardType="phone-pad"
          />
        </ComposerField>
        <ComposerField label="Email">
          <ComposerInput
            value={email}
            onChangeText={(v) => onContact({ email: v })}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </ComposerField>
        <ComposerField label="Website">
          <ComposerInput
            value={website}
            onChangeText={(v) => onContact({ website: v })}
            placeholder="Website"
            autoCapitalize="none"
            keyboardType="url"
          />
        </ComposerField>
      </ComposerDisclosure>
    </View>
  );
}

// ── Step 6 · preview ─────────────────────────────────────────────
function StepPreview({
  draft,
  kind,
  posterName,
  error,
}: {
  draft: ComposerDraft;
  kind: LovedKind;
  posterName: string | null;
  error: string | null;
}) {
  if (!draft.location || !draft.category) return null;
  return (
    <View>
      <View style={styles.previewCard}>
        {draft.photoUri ? (
          <Image source={{ uri: draft.photoUri }} style={styles.previewPhoto} resizeMode="cover" />
        ) : null}
        <Typography style={styles.previewName} color={colors.text}>
          {draft.location.name}
        </Typography>
        <Typography style={styles.previewPosted} color={colors.mutedStrong}>
          POSTED BY {posterName ? posterName.split(' ')[0].toUpperCase() : 'YOU'} · JUST NOW
        </Typography>
        <Typography style={styles.previewNote} color={colors.text}>
          &ldquo;{draft.note.trim()}&rdquo;
        </Typography>
        <Typography style={styles.previewCategory} color={colors.mutedStrong}>
          {categoryLabel(draft.category).toUpperCase()}
        </Typography>
      </View>

      {error ? (
        <Typography style={styles.errorText} color={colors.cherry}>
          {error}
        </Typography>
      ) : null}

      <Typography style={styles.previewFoot} color={colors.muted}>
        {kind === 'place'
          ? 'It goes on the Places map, attributed to you.'
          : 'It goes on the People map, attributed to you.'}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xxl },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  counter: textStyles.control,
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },

  title: {
    fontFamily: fonts.serifReg,
    fontSize: scaled(32),
    lineHeight: scaled(38),
    marginBottom: 6,
  },
  sub: { ...textStyles.cardBody, marginBottom: spacing.xl },

  // kind tabs
  tabRow: { flexDirection: 'row', marginBottom: spacing.xl },
  tab: {
    flex: 1,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
  },
  tabOn: { borderBottomColor: colors.cobalt },
  tabLabel: { ...textStyles.cardTitle },
  tabHint: { ...textStyles.cardBody, marginTop: 1 },

  postingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.cobaltSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  postingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cobalt },
  postingText: textStyles.labelS,

  // find
  search: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  searchingText: textStyles.cardBody,
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
    borderRadius: radius.sm,
    backgroundColor: colors.cobaltSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadgePerson: { backgroundColor: colors.peche },
  suggestionName: textStyles.cardTitle,
  suggestionMeta: { ...textStyles.cardBody, marginTop: 1 },
  manual: {
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    padding: 14,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  manualText: textStyles.controlStrong,
  manualForm: { marginTop: spacing.lg },
  rule: { height: 1, backgroundColor: colors.line },
  manualHint: { ...textStyles.cardBody, marginTop: spacing.md },

  // confirm
  // A rectangle, not the pill the other frames use: an oval crops the four
  // corners of a real map, and the corners are where the streets you recognise
  // are. The pill shape stays on the photo and preview frames, which crop
  // nothing that matters.
  mapFrame: {
    height: 170,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.sable,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mapImage: { width: '100%', height: '100%' },
  mapEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapEmptyText: textStyles.cardBody,
  confirmName: { ...textStyles.cardTitle, textAlign: 'center', marginTop: spacing.lg },
  confirmAddress: { ...textStyles.cardBody, textAlign: 'center', marginTop: 2 },

  // photo

  // category

  // note
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: fonts.readingItal,
    fontSize: scaled(16),
    lineHeight: scaled(24),
    color: colors.text,
  },
  charCount: { ...textStyles.cardBody, marginTop: spacing.sm, textAlign: 'right' },
  tip: {
    borderLeftWidth: 2,
    borderLeftColor: colors.line,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  tipText: { ...textStyles.cardBody, fontFamily: fonts.readingItal },
  contactHint: { ...textStyles.cardBody, marginBottom: spacing.sm },

  // preview
  previewCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 90,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  previewPhoto: {
    width: '100%',
    height: 120,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  previewName: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(24),
    lineHeight: scaled(30),
    textAlign: 'center',
  },
  previewPosted: { ...textStyles.labelS, marginTop: 6 },
  previewNote: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    fontSize: scaled(15),
    lineHeight: scaled(23),
    textAlign: 'center',
    marginTop: spacing.md,
  },
  previewCategory: { ...textStyles.labelS, marginTop: spacing.lg },
  previewFoot: { ...textStyles.cardBody, textAlign: 'center', marginTop: spacing.lg },

  errorText: { ...textStyles.cardBody, marginTop: spacing.md, textAlign: 'center' },

  footer: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.md },
  footerHalf: { flex: 1 },
  footerSolo: { flex: 1 },
  submitting: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.cobaltDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
