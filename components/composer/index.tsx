import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { ensurePhotoPermission } from '@/lib/photoPermission';

/**
 * The parts every composer in the app is made of.
 *
 * There are three now — a place or a person on Explore, a reel on Watch, and
 * whatever a mom brings to the table — and before this they were three
 * hand-written copies of the same six things: a labelled field over a hairline,
 * a pill CTA that goes pale rather than faded, a row of chips, a photo
 * dropzone, a fold-away section. The copies had already drifted (three input
 * treatments, two chip paddings, two CTA heights), which is how you can tell
 * they were copies.
 *
 * Where the drift was a real distinction it survives as a prop — chips come in
 * two tones because a category is a choice about the thing and a stage filter
 * is not. Where it was just drift, it's gone.
 */

const DISABLED_COBALT = '#93A8E8';
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// ── Field ────────────────────────────────────────────────────────
/**
 * A labelled row over a hairline. `hint` is the quiet right-hand word —
 * "required", "optional" — that saves the label from having to say it.
 */
export function ComposerField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View>
      <ComposerLabel label={label} hint={hint} />
      {children}
      <View style={styles.rule} />
    </View>
  );
}

/**
 * The label row on its own — for sections whose answer isn't a text field and
 * so doesn't want a hairline under it (a row of chips, a photo).
 */
export function ComposerLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.labelRow}>
      <Typography style={styles.label} color={colors.text}>
        {label.toUpperCase()}
      </Typography>
      {hint ? (
        <Typography style={styles.hint} color={colors.muted}>
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

/**
 * What she writes, in the reading italic — the answer is in her voice, not the
 * interface's. Search boxes stay in DM Sans; they're the app asking, not her
 * answering.
 */
export function ComposerInput({
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  keyboardType,
  autoCapitalize,
  autoFocus,
  trailing,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoFocus?: boolean;
  /** Rendered to the right of the field — a spinner, usually. */
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.inputRow}>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize === 'none' ? false : undefined}
        autoFocus={autoFocus}
        textAlignVertical={multiline ? 'top' : undefined}
      />
      {trailing}
    </View>
  );
}

// ── Call to action ───────────────────────────────────────────────
/**
 * The publish button. Disabled reads pale rather than faded: a button at 22%
 * opacity looks broken, a lighter one looks like it's waiting for you.
 */
export function ComposerCta({
  title,
  onPress,
  disabled,
  busy,
  size = 'lg',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  size?: 'md' | 'lg';
}) {
  const off = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[styles.cta, size === 'md' && styles.ctaMd, off && styles.ctaOff]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <Typography
          style={[styles.ctaLabel, size === 'md' && styles.ctaLabelMd]}
          color={colors.white}
        >
          {title}
        </Typography>
      )}
    </Pressable>
  );
}

// ── Chips ────────────────────────────────────────────────────────
export interface ComposerChip {
  value: string;
  label: string;
}

/**
 * A row of chips, single- or multi-select.
 *
 * Two tones, and the difference is not decoration: `cobalt` is a choice about
 * the thing itself (what kind of place is this), `neutral` is a filter-ish
 * multi-select (who is this for). Outlining the second in cobalt would make
 * ten unanswered questions look like ten pending decisions.
 */
export function ComposerChips({
  options,
  selected,
  onToggle,
  tone = 'cobalt',
}: {
  options: ComposerChip[];
  selected: string[];
  onToggle: (value: string) => void;
  tone?: 'cobalt' | 'neutral';
}) {
  const multi = selected.length > 1 || tone === 'neutral';
  return (
    <View style={[styles.chipRow, tone === 'cobalt' && styles.chipRowWide]}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <Pressable
            key={o.value}
            onPress={() => onToggle(o.value)}
            style={[
              styles.chip,
              tone === 'cobalt' ? styles.chipCobalt : styles.chipNeutral,
              on && styles.chipOn,
            ]}
            accessibilityRole={multi ? 'checkbox' : 'button'}
            accessibilityState={multi ? { checked: on } : { selected: on }}
          >
            <Typography
              style={tone === 'cobalt' ? styles.chipLabelStrong : styles.chipLabel}
              color={on ? colors.white : tone === 'cobalt' ? colors.cobalt : colors.text}
            >
              {o.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Photo ────────────────────────────────────────────────────────
/**
 * Pick one picture, or don't. Returns a local URI — uploading is the caller's
 * job, and should happen at publish rather than at pick: a composer abandoned
 * three steps later shouldn't have left a file in a bucket for nobody.
 *
 * The size check happens here, while she's still looking at the picker.
 * Finding out at publish is finding out too late.
 */
export function ComposerPhoto({
  uri,
  onPick,
  onClear,
  onSkip,
  hint = 'JPG, PNG · up to 8MB',
}: {
  uri: string | null;
  onPick: (uri: string) => void;
  onClear: () => void;
  /** Renders the "Skip for now" link when given. */
  onSkip?: () => void;
  hint?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setError(null);
    if (!(await ensurePhotoPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      // iOS ignores this and always crops square (it says so in the package's
      // own types), so the well is square to match rather than promising a
      // frame the picker won't honour. Android follows the ratio.
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      setError('That one’s over 8MB — try a smaller picture.');
      return;
    }
    onPick(asset.uri);
  }

  if (uri) {
    return (
      <View>
        <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
        <View style={styles.photoActions}>
          <Pressable onPress={pick} hitSlop={8}>
            <Typography style={styles.photoAction} color={colors.cobalt}>
              Replace
            </Typography>
          </Pressable>
          <Pressable onPress={onClear} hitSlop={8}>
            <Typography style={styles.photoAction} color={colors.cherry}>
              Remove
            </Typography>
          </Pressable>
        </View>
        {error ? (
          <Typography style={styles.error} color={colors.cherry}>
            {error}
          </Typography>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <Pressable style={styles.dropzone} onPress={pick} accessibilityRole="button">
        <Ionicons name="add" size={26} color={colors.cobalt} />
        <Typography style={styles.dropzoneLabel} color={colors.cobalt}>
          Add a photo
        </Typography>
        <Typography style={styles.dropzoneHint} color={colors.muted}>
          {hint}
        </Typography>
      </Pressable>
      {onSkip ? (
        <Pressable onPress={onSkip} style={styles.skip} hitSlop={8}>
          <Typography style={styles.skipText} color={colors.mutedStrong}>
            Skip for now
          </Typography>
        </Pressable>
      ) : null}
      {error ? (
        <Typography style={styles.error} color={colors.cherry}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

// ── Disclosure ───────────────────────────────────────────────────
/** A fold-away section — examples, extra fields, anything not load-bearing. */
export function ComposerDisclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.discHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Typography style={styles.discTitle} color={colors.text}>
          {title.toUpperCase()}
        </Typography>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.mutedStrong}
        />
      </Pressable>
      {open ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  label: textStyles.labelS,
  hint: textStyles.cardBody,
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    fontFamily: fonts.readingItal,
    fontSize: scaled(15),
    lineHeight: scaled(22),
    color: colors.text,
    paddingVertical: spacing.md,
  },
  inputMulti: { minHeight: 64 },
  rule: { height: 1, backgroundColor: colors.line },

  cta: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: spacing.xl,
  },
  ctaMd: { height: 48, marginTop: spacing.lg },
  ctaOff: { backgroundColor: DISABLED_COBALT },
  ctaLabel: { fontFamily: fonts.bodySemi, fontSize: scaled(16) },
  ctaLabelMd: { fontSize: scaled(15) },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipRowWide: { gap: 9 },
  chip: { borderRadius: radius.pill },
  chipNeutral: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipCobalt: {
    borderWidth: 1.5,
    borderColor: colors.cobalt,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  chipOn: { backgroundColor: colors.cobalt, borderColor: colors.cobalt },
  chipLabel: textStyles.control,
  chipLabelStrong: textStyles.controlStrong,

  // Square, and small. iOS's crop rectangle is always a square whatever we ask
  // for, so a rectangular well would promise a framing the picker can't give —
  // we match it instead. Kept to 48% of the column so "square" doesn't mean a
  // 335pt wall down the middle of the step.
  dropzone: {
    width: '48%',
    maxWidth: 190,
    alignSelf: 'center',
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.cobalt,
    borderStyle: 'dashed',
    backgroundColor: colors.cobaltSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dropzoneLabel: textStyles.controlStrong,
  dropzoneHint: textStyles.cardBody,
  skip: { alignItems: 'center', paddingVertical: spacing.lg },
  skipText: { ...textStyles.control, textDecorationLine: 'underline' },
  photo: {
    width: '48%',
    maxWidth: 190,
    alignSelf: 'center',
    aspectRatio: 1,
    borderRadius: radius.xl,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  photoAction: textStyles.controlStrong,

  discHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  discTitle: textStyles.labelS,

  error: { ...textStyles.cardBody, marginTop: spacing.md, color: colors.cherry },
});
