import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { STAGE_CHIP_GROUPS } from '@/constants/discover';
import { useCreateReel, type ReelMeta } from '@/hooks/useCreateReel';

type Platform = 'instagram' | 'tiktok';

const IG_GRADIENT = ['#f9ce34', '#ee2a7b', '#6228d7'] as const;

const COPY: Record<Platform, { label: string; placeholder: string; from: string; note: string }> = {
  instagram: {
    label: 'Instagram link',
    placeholder: 'https://instagram.com/reel/…',
    from: 'e.g. Dr. Sigrid Greene, perinatal psychiatrist',
    // Honest about what we can and can't do. The mockup promised the thumbnail,
    // duration and handle automatically; Instagram closed its public oEmbed in
    // 2020, so for them the poster's own words ARE the card.
    note: 'Instagram won’t let us read the video, so what you write here is what other moms will see.',
  },
  tiktok: {
    label: 'TikTok link',
    placeholder: 'https://tiktok.com/@…/video/…',
    from: 'e.g. @drsleepbaby, IBCLC',
    note: 'Just the link works — we’ll pull the cover and the creator for you.',
  },
};

interface ShareReelSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Fired after a successful post, so the feed can refetch. */
  onPosted: () => void;
}

/**
 * Watch · "Share a recommendation". A contributor pastes a reel link, says who
 * it's from and who it's for, and it lands in the community half of the feed.
 *
 * One sheet rather than the six-step wizard Explore uses: a link, a name and a
 * few chips is not a journey, and making it one would be the reason nobody
 * posts twice.
 */
export function ShareReelSheet({ visible, onClose, onPosted }: ShareReelSheetProps) {
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

  const canPost = urlLooksRight && from.trim().length > 1 && stages.length > 0 && !submitting;

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
        creatorLabel: from.trim(),
        note: why.trim() || null,
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

  return (
    <ActionSheet visible={visible} onClose={onClose}>
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Typography style={styles.title} color={colors.cobalt}>
          Share a recommendation
        </Typography>
        <Typography style={styles.sub} color={colors.mutedStrong}>
          Share a reel or video that helped you.
        </Typography>

        <PlatformOption
          platform="instagram"
          title="An Instagram reel"
          sub="Paste a link, we’ll embed it for you."
          active={platform === 'instagram'}
          onPress={() => setPlatform('instagram')}
        />
        <PlatformOption
          platform="tiktok"
          title="A TikTok"
          sub="Same idea. Paste the link and you’re done."
          active={platform === 'tiktok'}
          onPress={() => setPlatform('tiktok')}
        />

        {platform ? (
          <View style={styles.form}>
            <FieldLabel label={COPY[platform].label} hint="required" />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder={COPY[platform].placeholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                inputMode="url"
              />
              {resolving ? <ActivityIndicator size="small" color={colors.cobalt} /> : null}
            </View>
            <View style={styles.rule} />

            <FieldLabel label="Who’s it from?" hint="required" />
            <TextInput
              style={styles.input}
              value={from}
              onChangeText={(v) => {
                fromTouched.current = true;
                setFrom(v);
              }}
              placeholder={COPY[platform].from}
              placeholderTextColor={colors.muted}
            />
            <View style={styles.rule} />

            <FieldLabel label="Why this one?" hint="optional" />
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={why}
              onChangeText={setWhy}
              placeholder="One sentence on what made you save it."
              placeholderTextColor={colors.muted}
              multiline
              maxLength={240}
            />
            <View style={styles.rule} />

            <FieldLabel label="Who is this for?" hint="required · pick all that apply" />
            {STAGE_CHIP_GROUPS.map((g) => (
              <View key={g.group} style={styles.stageGroup}>
                <Typography style={styles.stageGroupLabel} color={colors.mutedStrong}>
                  {g.group.toUpperCase()}
                </Typography>
                <View style={styles.chipRow}>
                  {g.rows.map((row) => {
                    const on = stages.includes(row.value);
                    return (
                      <Pressable
                        key={row.value}
                        onPress={() => toggleStage(row.value)}
                        style={[styles.chip, on && styles.chipOn]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                      >
                        <Typography
                          style={styles.chipLabel}
                          color={on ? colors.white : colors.text}
                        >
                          {row.label}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.cobalt} />
              <Typography style={styles.hintText} color={colors.mutedStrong}>
                {COPY[platform].note}
              </Typography>
            </View>

            {error ? (
              <Typography style={styles.error} color={colors.cherry}>
                {error}
              </Typography>
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!canPost}
          style={[styles.cta, !canPost && styles.ctaOff]}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Typography style={styles.ctaLabel} color={colors.white}>
              {platform ? 'Share with the community' : 'Pick what you want to share'}
            </Typography>
          )}
        </Pressable>

        <Pressable onPress={onClose} style={styles.notNow} hitSlop={8}>
          <Typography style={styles.notNowLabel} color={colors.mutedStrong}>
            Not now
          </Typography>
        </Pressable>
      </ScrollView>
    </ActionSheet>
  );
}

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Typography style={styles.fieldLabel} color={colors.text}>
        {label.toUpperCase()}
      </Typography>
      <Typography style={styles.fieldHint} color={colors.muted}>
        {hint}
      </Typography>
    </View>
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
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  fieldLabel: textStyles.labelS,
  fieldHint: textStyles.cardBody,
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    fontFamily: fonts.readingItal,
    fontSize: scaled(15),
    lineHeight: scaled(22),
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },
  rule: { height: 1, backgroundColor: colors.line },

  stageGroup: { marginTop: spacing.md },
  stageGroupLabel: { ...textStyles.labelS, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  chipLabel: textStyles.control,

  hintRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
  },
  hintText: { ...textStyles.cardBody, flex: 1, fontFamily: fonts.readingItal },
  error: { ...textStyles.cardBody, marginTop: spacing.md },

  cta: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: spacing.xl,
  },
  // Pale rather than faded: a 22%-opacity button reads as broken, a lighter
  // one reads as waiting for you.
  ctaOff: { backgroundColor: '#93A8E8' },
  ctaLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(16) },
  notNow: { alignItems: 'center', paddingVertical: spacing.lg },
  notNowLabel: textStyles.control,
});
