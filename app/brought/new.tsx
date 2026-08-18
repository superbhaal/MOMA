import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import {
  ComposerCta,
  ComposerField,
  ComposerInput,
  ComposerLabel,
  ComposerPhoto,
} from '@/components/composer';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import {
  BROUGHT_KINDS,
  kindCourse,
  KIND_INK,
  KIND_HAS_PHOTO,
  kindLabel,
  kindPhotoHint,
  broughtIsComplete,
} from '@/constants/brought';
import { uploadImage } from '@/lib/uploadImage';
import { useAuth } from '@/hooks/useAuth';
import { useMyBrought } from '@/hooks/useBrought';
import type { BroughtKind, RecipeIngredient } from '@/types';

/**
 * "Bring something" — one thing per mom, on her profile, for everyone at her
 * table.
 *
 * Five kinds with five sets of fields, and the course notes above each are the
 * client's own words. They're the feature: without them this is a form, and
 * with them it's an invitation.
 */
export default function BringSomethingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { item, save, saving } = useMyBrought();

  const replacing = !!item;
  const [kind, setKind] = useState<BroughtKind>(item?.kind ?? 'recipe');
  const [payload, setPayload] = useState<Record<string, unknown>>(
    item ? { ...item.payload } : {},
  );
  const [photoUri, setPhotoUri] = useState<string | null>(item?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);

  const set = (k: string, v: unknown) => setPayload((p) => ({ ...p, [k]: v }));
  const str = (k: string) => (typeof payload[k] === 'string' ? (payload[k] as string) : '');

  const ingredients: RecipeIngredient[] = Array.isArray(payload.ingredients)
    ? (payload.ingredients as RecipeIngredient[])
    : [{ qty: '', name: '' }];
  const steps: string[] = Array.isArray(payload.steps) ? (payload.steps as string[]) : [''];

  // Switching kind keeps nothing: the fields don't line up, and a book's author
  // sitting in a recipe's "why you love it" would be worse than an empty form.
  const switchKind = (next: BroughtKind) => {
    if (next === kind) return;
    setKind(next);
    setPayload({});
    if (!KIND_HAS_PHOTO[next]) setPhotoUri(null);
  };

  const ready = broughtIsComplete(kind, payload);

  async function put() {
    if (!ready || !user) return;

    let photoUrl: string | null = item?.photo_url ?? null;
    // A newly picked photo is a local file URI; an untouched one is already a
    // remote URL and needs no second upload.
    if (photoUri && !photoUri.startsWith('http')) {
      setUploading(true);
      const { url, error } = await uploadImage('spot-photos', user.id, photoUri);
      setUploading(false);
      if (error) {
        Alert.alert(t('brought.errPhotoTitle'), t('brought.errPhotoBody'));
        setPhotoUri(null);
        return;
      }
      photoUrl = url;
    } else if (!photoUri) {
      photoUrl = null;
    }

    const commit = async () => {
      const { error } = await save({ kind, payload, photoUrl });
      if (error) {
        Alert.alert(t('brought.errSaveTitle'), error);
        return;
      }
      router.back();
    };

    // The client's rule: bringing something else REPLACES what's there, and she
    // asked for the warning that says so. No history, so this is the only
    // moment anyone can be told.
    if (replacing) {
      Alert.alert(
        t('brought.replaceTitle'),
        t('brought.replaceBody'),
        [
          { text: t('brought.keepOld'), style: 'cancel' },
          { text: t('brought.replaceIt'), style: 'destructive', onPress: commit },
        ],
      );
      return;
    }
    await commit();
  }

  const course = kindCourse(t)[kind];
  const ink = KIND_INK[kind];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography style={styles.cancel} color={colors.mutedStrong}>
            Cancel
          </Typography>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Typography style={styles.head} color={colors.text}>
          {t('brought.headBring')}
        </Typography>
        <Typography style={styles.deck} color={colors.mutedStrong}>
          {t('brought.deckBring')}
        </Typography>
        {replacing ? (
          <Typography style={styles.onlyOne} color={colors.cobalt}>
            {t('brought.onlyOne')}
          </Typography>
        ) : null}

        <View style={styles.kinds}>
          {BROUGHT_KINDS.map((k, i) => (
            <View key={k} style={styles.kindWrap}>
              {i > 0 ? (
                <Typography style={styles.kindSep} color={colors.cobaltMuted}>
                  ·
                </Typography>
              ) : null}
              <Pressable
                onPress={() => switchKind(k)}
                style={[
                  styles.kind,
                  k === kind && { borderBottomColor: KIND_INK[k].accent },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: k === kind }}
              >
                <Typography
                  style={styles.kindLabel}
                  color={k === kind ? KIND_INK[k].text : colors.muted}
                >
                  {kindLabel(t)[k].toUpperCase()}
                </Typography>
              </Pressable>
            </View>
          ))}
        </View>

        <Typography style={styles.course} color={ink.text}>
          {course.title}
        </Typography>
        <Typography style={styles.courseNote} color={colors.mutedStrong}>
          {course.note}
        </Typography>

        {KIND_HAS_PHOTO[kind] ? (
          <View style={styles.photoWrap}>
            <ComposerPhoto
              uri={photoUri}
              onPick={setPhotoUri}
              onClear={() => setPhotoUri(null)}
              hint={kindPhotoHint(t)[kind]}
              optional
            />
          </View>
        ) : null}

        {kind === 'recipe' ? (
          <>
            <ComposerField label={t('brought.fRecipeName')} hint={t('brought.required')}>
              <ComposerInput
                value={str('title')}
                onChangeText={(v) => set('title', v)}
                placeholder={t('brought.pRecipeName')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhyLove')} hint={t('brought.required')}>
              <ComposerInput
                value={str('why')}
                onChangeText={(v) => set('why', v)}
                placeholder={t('brought.pWhyLove')}
                multiline
              />
            </ComposerField>

            <ComposerLabel label={t('brought.fIngredients')} hint={t('brought.optional')} />
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingRow}>
                <View style={styles.qty}>
                  <ComposerInput
                    value={ing.qty}
                    onChangeText={(v) => {
                      const next = [...ingredients];
                      next[i] = { ...next[i], qty: v };
                      set('ingredients', next);
                    }}
                    placeholder={t('brought.pQty')}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ComposerInput
                    value={ing.name}
                    onChangeText={(v) => {
                      const next = [...ingredients];
                      next[i] = { ...next[i], name: v };
                      set('ingredients', next);
                    }}
                    placeholder={t('brought.pIngredient')}
                  />
                </View>
              </View>
            ))}
            <AddLine
              label={t('brought.addIngredient')}
              onPress={() => set('ingredients', [...ingredients, { qty: '', name: '' }])}
            />

            <ComposerLabel label={t('brought.fSteps')} hint={t('brought.optional')} />
            {steps.map((st, i) => (
              <ComposerField key={i} label={`Step ${i + 1}`}>
                <ComposerInput
                  value={st}
                  onChangeText={(v) => {
                    const next = [...steps];
                    next[i] = v;
                    set('steps', next);
                  }}
                  placeholder={t('brought.pStep')}
                  multiline
                />
              </ComposerField>
            ))}
            <AddLine label={t('brought.addStep')} onPress={() => set('steps', [...steps, ''])} />
          </>
        ) : null}

        {kind === 'book' ? (
          <>
            <ComposerField label={t('brought.fTitle')} hint={t('brought.required')}>
              <ComposerInput
                value={str('title')}
                onChangeText={(v) => set('title', v)}
                placeholder={t('brought.pTitle')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fAuthor')} hint={t('brought.required')}>
              <ComposerInput
                value={str('author')}
                onChangeText={(v) => set('author', v)}
                placeholder={t('brought.pAuthor')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhyPass')} hint={t('brought.required')}>
              <ComposerInput
                value={str('why')}
                onChangeText={(v) => set('why', v)}
                placeholder={t('brought.pWhyPass')}
                multiline
              />
            </ComposerField>
            <ComposerField label={t('brought.fUnderlined')} hint={t('brought.optional')}>
              <ComposerInput
                value={str('quote')}
                onChangeText={(v) => set('quote', v)}
                placeholder={t('brought.pUnderlined')}
                multiline
              />
            </ComposerField>
          </>
        ) : null}

        {kind === 'find' ? (
          <>
            <ComposerField label={t('brought.fWhatIsIt')} hint={t('brought.required')}>
              <ComposerInput
                value={str('title')}
                onChangeText={(v) => set('title', v)}
                placeholder={t('brought.pWhatFind')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhyWorks')} hint={t('brought.required')}>
              <ComposerInput
                value={str('why')}
                onChangeText={(v) => set('why', v)}
                placeholder={t('brought.pWhyWorks')}
                multiline
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhereGot')} hint={t('brought.optional')}>
              <ComposerInput
                value={str('where')}
                onChangeText={(v) => set('where', v)}
                placeholder={t('brought.pWhereGot')}
              />
            </ComposerField>
          </>
        ) : null}

        {kind === 'listen' ? (
          <>
            <ComposerField label={t('brought.fWhatIsIt')} hint={t('brought.required')}>
              <ComposerInput
                value={str('title')}
                onChangeText={(v) => set('title', v)}
                placeholder={t('brought.pWhatListen')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhoMade')} hint={t('brought.required')}>
              <ComposerInput
                value={str('maker')}
                onChangeText={(v) => set('maker', v)}
                placeholder={t('brought.pWhoMade')}
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhenWorks')} hint={t('brought.required')}>
              <ComposerInput
                value={str('when')}
                onChangeText={(v) => set('when', v)}
                placeholder={t('brought.pWhenWorks')}
                multiline
              />
            </ComposerField>
          </>
        ) : null}

        {kind === 'tip' ? (
          <>
            <ComposerField label={t('brought.fTheTip')} hint={t('brought.required')}>
              <ComposerInput
                value={str('tip')}
                onChangeText={(v) => set('tip', v)}
                placeholder={t('brought.pTheTip')}
                multiline
              />
            </ComposerField>
            <ComposerField label={t('brought.fHowFound')} hint={t('brought.required')}>
              <ComposerInput
                value={str('how')}
                onChangeText={(v) => set('how', v)}
                placeholder={t('brought.pHowFound')}
                multiline
              />
            </ComposerField>
            <ComposerField label={t('brought.fWhoTold')} hint={t('brought.optional')}>
              <ComposerInput
                value={str('who')}
                onChangeText={(v) => set('who', v)}
                placeholder={t('brought.pWhoTold')}
              />
            </ComposerField>
          </>
        ) : null}

        <Typography style={styles.visibility} color={colors.muted}>
          Public · everyone at the table can see it
        </Typography>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <ComposerCta
          title={t('brought.cta')}
          onPress={put}
          disabled={!ready}
          busy={saving || uploading}
        />
      </View>
    </View>
  );
}

function AddLine({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.addLine} hitSlop={8} accessibilityRole="button">
      <Ionicons name="add" size={15} color={colors.cobalt} />
      <Typography style={styles.addLineText} color={colors.cobalt}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.xxl },
  topbar: { alignItems: 'flex-start', paddingBottom: spacing.md },
  cancel: textStyles.control,
  scroll: { paddingBottom: spacing.xxl },

  head: {
    fontFamily: fonts.serifReg,
    fontSize: scaled(32),
    lineHeight: scaled(38),
    textAlign: 'center',
  },
  deck: { ...textStyles.cardBody, textAlign: 'center', marginTop: 6 },
  onlyOne: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  kinds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  kindWrap: { flexDirection: 'row', alignItems: 'center' },
  kindSep: { ...textStyles.control, paddingHorizontal: 2 },
  kind: { paddingHorizontal: 6, paddingBottom: 4, borderBottomWidth: 1.5, borderBottomColor: 'transparent' },
  kindLabel: textStyles.controlCaps,

  course: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(22),
    lineHeight: scaled(28),
    textAlign: 'center',
  },
  courseNote: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  photoWrap: { marginBottom: spacing.sm },

  ingRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  qty: { width: 90 },
  addLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
  },
  addLineText: textStyles.controlStrong,

  visibility: { ...textStyles.cardBody, textAlign: 'center', marginTop: spacing.xxl },
  footer: { paddingTop: spacing.md },
});
