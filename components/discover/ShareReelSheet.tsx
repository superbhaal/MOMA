import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { stageChipGroups } from '@/constants/discover';
import {
  ComposerChips,
  ComposerCta,
  ComposerField,
  ComposerInput,
  ComposerLabel,
} from '@/components/composer';
import { useCreateReel, type ReelMeta } from '@/hooks/useCreateReel';

type Platform = 'instagram' | 'tiktok';

const IG_GRADIENT = ['#f9ce34', '#ee2a7b', '#6228d7'] as const;

// Copy, so a function of `t` rather than a module constant frozen at import.
function copyFor(t: TFunction): Record<Platform, { label: string; placeholder: string; from: string; note: string }> {
  return {
    instagram: {
      label: t('reel.igLabel'),
      placeholder: t('reel.igPlaceholder'),
      from: t('reel.igFrom'),
      // Honest about what we can and can't do. The mockup promised the
      // thumbnail, duration and handle automatically; Instagram closed its
      // public oEmbed in 2020, so for them the poster's own words ARE the card.
      note: t('reel.igNote'),
    },
    tiktok: {
      label: t('reel.ttLabel'),
      placeholder: t('reel.ttPlaceholder'),
      from: t('reel.ttFrom'),
      note: t('reel.ttNote'),
    },
  };
}

interface ShareReelSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Fired after a successful post, so the feed can refetch. */
  onPosted: () => void;
  /**
   * Rendered as a route under `presentation: 'modal'` rather than as an in-page
   * sheet. The native presentation already draws the surface AND brings the
   * pull-down-to-dismiss that the in-page ActionSheet never had — which is the
   * whole reason this option exists: Explore's "+" was a modal route and could
   * be swiped away, Watch's "+" was this component and could not.
   */
  standalone?: boolean;
}

/**
 * Watch · "Share a recommendation". A contributor pastes a reel link, says who
 * it's from and who it's for, and it lands in the community half of the feed.
 *
 * One sheet rather than the six-step wizard Explore uses: a link, a name and a
 * few chips is not a journey, and making it one would be the reason nobody
 * posts twice.
 */
export function ShareReelSheet({ visible, onClose, onPosted, standalone }: ShareReelSheetProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { resolve, create, resolving, submitting, error, setError } = useCreateReel();

  const [platform, setPlatform] = useState<Platform | null>(null);
  const [url, setUrl] = useState('');
  const [from, setFrom] = useState('');
  const [why, setWhy] = useState('');
  const [stages, setStages] = useState<string[]>([]);
  const [meta, setMeta] = useState<ReelMeta | null>(null);

  // Whether the poster has edited "who's it from" by hand. Once they have, a
  // late oEmbed answer must not overwrite them.
  const fromTouched = useRef(false);

  // Reset on close so the next open is a blank sheet, not the last attempt.
  useEffect(() => {
    if (visible) return;
    setPlatform(null);
    setUrl('');
    setFrom('');
    setWhy('');
    setStages([]);
    setMeta(null);
    setError(null);
    fromTouched.current = false;
  }, [visible, setError]);

  // Resolve the link a beat after typing stops. Debounced because a paste
  // arrives one character at a time on some keyboards, and each one would
  // otherwise be its own round-trip.
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || !platform) {
      setMeta(null);
      return;
    }
    const t = setTimeout(async () => {
      const result = await resolve(trimmed);
      if (!result) return;
      setMeta(result);
      if (result.creatorLabel && !fromTouched.current) setFrom(result.creatorLabel);
    }, 600);
    return () => clearTimeout(t);
  }, [url, platform]);

  const urlLooksRight = useMemo(() => {
    const t = url.trim();
    if (!t || !platform) return false;
    return t.includes(`${platform === 'tiktok' ? 'tiktok' : 'instagram'}.com`);
  }, [url, platform]);

  // "Why this one" is what the card now shows in bold, so it can no longer be
  // left out: a shared reel is her recommendation, and a recommendation with
  // nothing said about it is just a link. "Who's it from" stays optional — on
  // Instagram we often cannot read it, and she may not know.
  const canPost = urlLooksRight && why.trim().length > 0 && stages.length > 0 && !submitting;

  const toggleStage = (value: string) =>
    setStages((s) => (s.includes(value) ? s.filter((v) => v !== value) : [...s, value]));

  async function submit() {
    if (!canPost || !platform) return;
    try {
      await create({
        platform,
        // The canonical URL from the resolver when we have one: two share links
        // to the same reel differ only by tracking params, and the table dedupes
        // on this column.
        externalUrl: meta?.url ?? url.trim(),
        creatorLabel: from.trim() || null,
        note: why.trim(),
        babyStages: stages,
        title: meta?.title ?? null,
        thumbnailUrl: meta?.thumbnailUrl ?? null,
        thumbnailHex: platform === 'instagram' ? colors.rose : colors.pool,
      });
      onPosted();
      onClose();
    } catch {
      // `error` is already set with a sentence; the sheet stays open on it.
    }
  }

  const body = (
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Typography style={styles.title} color={colors.cobalt}>
          {t('reel.shareTitle')}
        </Typography>
        <Typography style={styles.sub} color={colors.mutedStrong}>
          {t('reel.shareSub')}
        </Typography>

        <PlatformOption
          platform="instagram"
          title={t('reel.anIg')}
          sub={t('misc.pasteEmbed')}
          active={platform === 'instagram'}
          onPress={() => setPlatform('instagram')}
        />
        <PlatformOption
          platform="tiktok"
          title={t('reel.aTt')}
          sub={t('misc.pasteSame')}
          active={platform === 'tiktok'}
          onPress={() => setPlatform('tiktok')}
        />

        {platform ? (
          <View style={styles.form}>
            <ComposerField label={copyFor(t)[platform].label} required>
              <ComposerInput
                value={url}
                onChangeText={setUrl}
                placeholder={copyFor(t)[platform].placeholder}
                autoCapitalize="none"
                keyboardType="url"
                trailing={
                  resolving ? <ActivityIndicator size="small" color={colors.cobalt} /> : null
                }
              />
            </ComposerField>

            <ComposerField label={t('reel.whyThis')} required>
              <ComposerInput
                value={why}
                onChangeText={setWhy}
                placeholder={t('reel.whyPlaceholder')}
                multiline
                maxLength={240}
              />
            </ComposerField>

            <ComposerField label={t('reel.whoFrom')} hint={t('brought.optional')}>
              <ComposerInput
                value={from}
                onChangeText={(v) => {
                  fromTouched.current = true;
                  setFrom(v);
                }}
                placeholder={copyFor(t)[platform].from}
              />
            </ComposerField>

            <ComposerLabel label={t('reel.whoFor')} hint={t('reel.whoForHint')} required />
            {stageChipGroups(t).map((g) => (
              <View key={g.group} style={styles.stageGroup}>
                <Typography style={styles.stageGroupLabel} color={colors.mutedStrong}>
                  {g.group.toUpperCase()}
                </Typography>
                <ComposerChips
                  options={g.rows}
                  selected={stages}
                  onToggle={toggleStage}
                  tone="neutral"
                />
              </View>
            ))}

            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.cobalt} />
              <Typography style={styles.hintText} color={colors.mutedStrong}>
                {copyFor(t)[platform].note}
              </Typography>
            </View>

            {error ? (
              <Typography style={styles.error} color={colors.cherry}>
                {error}
              </Typography>
            ) : null}
          </View>
        ) : null}

        <ComposerCta
          title={platform ? t('reel.ctaShare') : t('reel.ctaPick')}
          onPress={submit}
          disabled={!canPost}
          busy={submitting}
        />

        <Pressable onPress={onClose} style={styles.notNow} hitSlop={8}>
          <Typography style={styles.notNowLabel} color={colors.mutedStrong}>
            {t('misc.notNow')}
          </Typography>
        </Pressable>
      </ScrollView>
  );

  if (standalone) {
    // ActionSheet used to supply these; the native presentation supplies the
    // card and the gesture but not the margins, so the title sat against the
    // rounded corner without them.
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>{body}</View>
    );
  }
  return (
    <ActionSheet visible={visible} onClose={onClose}>
      {body}
    </ActionSheet>
  );
}

function PlatformOption({
  platform,
  title,
  sub,
  active,
  onPress,
}: {
  platform: Platform;
  title: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, active && styles.optionOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      {platform === 'instagram' ? (
        <LinearGradient
          colors={IG_GRADIENT}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.optionIcon}
        >
          <Ionicons name="logo-instagram" size={17} color={colors.white} />
        </LinearGradient>
      ) : (
        <View style={[styles.optionIcon, { backgroundColor: colors.text }]}>
          <Ionicons name="logo-tiktok" size={17} color={colors.white} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Typography style={styles.optionTitle} color={colors.text}>
          {title}
        </Typography>
        <Typography style={styles.optionSub} color={colors.mutedStrong}>
          {sub}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The modal presentation supplies the rounded card and the grabber; this only
  // has to paint the ground under the scroller.
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  // The sheet caps its own height; this has to be allowed to shrink into it,
  // or it would measure at full content height and get clipped rather than
  // scrolled. RN defaults flexShrink to 0, so it has to be said.
  scroll: { flexShrink: 1 },
  title: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(28),
    lineHeight: scaled(34),
  },
  sub: { ...textStyles.cardBody, marginTop: 2, marginBottom: spacing.lg },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionOn: { borderColor: colors.text, borderWidth: 1.5 },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: textStyles.cardTitle,
  optionSub: { ...textStyles.cardBody, marginTop: 1 },

  form: { marginTop: spacing.lg },

  stageGroup: { marginTop: spacing.md },
  stageGroupLabel: { ...textStyles.labelS, marginBottom: spacing.sm },

  hintRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  hintText: { ...textStyles.cardBody, flex: 1, fontFamily: fonts.readingItal },
  error: { ...textStyles.cardBody, marginTop: spacing.md },

  // Pale rather than faded: a 22%-opacity button reads as broken, a lighter
  // one reads as waiting for you.
  notNow: { alignItems: 'center', paddingVertical: spacing.lg },
  notNowLabel: textStyles.control,
});
