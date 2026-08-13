import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { KIND_COURSE, KIND_LABEL } from '@/constants/brought';
import { useBroughtFor } from '@/hooks/useBrought';
import { useAuth } from '@/hooks/useAuth';
import type { RecipeIngredient } from '@/types';

/**
 * The whole of what someone brought.
 *
 * This page is the client's call on the first arbitration: the composer asks
 * for ingredients with quantities and steps one by one, and the profile card
 * shows three lines. Without somewhere to read the rest, we'd be asking moms to
 * type out a recipe we never intended to show — which she called, fairly, a
 * small betrayal.
 */
export default function BroughtDetail() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, loading } = useBroughtFor(userId ? [userId] : []);

  const item = userId ? items[userId] : undefined;
  const isMine = user?.id === userId;
  const p = (item?.payload ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof p[k] === 'string' ? (p[k] as string).trim() : '');

  const ingredients: RecipeIngredient[] = Array.isArray(p.ingredients)
    ? (p.ingredients as RecipeIngredient[]).filter((i) => i?.name?.trim())
    : [];
  const steps: string[] = Array.isArray(p.steps)
    ? (p.steps as string[]).filter((s) => s?.trim())
    : [];

  if (!loading && !item) {
    return (
      <View style={[styles.container, styles.center]}>
        <Typography variant="bodyL" color={colors.muted} style={styles.centerText}>
          There’s nothing on the table here.
        </Typography>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Typography style={styles.backLink} color={colors.cobalt}>
            ‹ Back
          </Typography>
        </Pressable>
      </View>
    );
  }
  if (!item) return <View style={styles.container} />;

  const who = isMine ? 'You' : item.poster_name ?? 'a mom';
  const title = item.kind === 'tip' ? str('tip') : str('title');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]} />
        )}
        <Pressable
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </Pressable>

        <View style={styles.body}>
          <Typography style={styles.kind} color={colors.cobalt}>
            {KIND_LABEL[item.kind].toUpperCase()} · {KIND_COURSE[item.kind].title.toUpperCase()}
          </Typography>
          <Typography style={styles.title} color={colors.text}>
            {title}
          </Typography>

          <View style={styles.byRow}>
            <Avatar
              name={item.poster_name ?? 'a mom'}
              ringColor={item.poster_color ?? colors.fuchsia}
              size={36}
              ringWidth={2}
            />
            <Typography style={styles.by} color={colors.mutedStrong}>
              Brought by {who}
            </Typography>
          </View>

          {/* The line that made her bring it, in her voice. */}
          {str('why') ? (
            <View style={styles.quote}>
              <Typography style={styles.quoteText} color={colors.mutedStrong}>
                “{str('why')}”
              </Typography>
            </View>
          ) : null}

          {item.kind === 'book' ? (
            <>
              <Detail label="Author" value={str('author')} />
              {str('quote') ? (
                <View style={styles.underlined}>
                  <Typography style={styles.underlinedText} color={colors.text}>
                    “{str('quote')}”
                  </Typography>
                  <Typography style={styles.underlinedNote} color={colors.muted}>
                    A line she underlined
                  </Typography>
                </View>
              ) : null}
            </>
          ) : null}

          {item.kind === 'find' ? <Detail label="Where she got it" value={str('where')} /> : null}

          {item.kind === 'listen' ? (
            <>
              <Detail label="Who made it" value={str('maker')} />
              <Detail label="When it works" value={str('when')} />
            </>
          ) : null}

          {item.kind === 'tip' ? (
            <>
              <Detail label="How she found out" value={str('how')} />
              <Detail label="Who told her" value={str('who')} />
            </>
          ) : null}

          {item.kind === 'recipe' && ingredients.length ? (
            <View style={styles.block}>
              <Typography style={styles.blockLabel} color={colors.cobalt}>
                INGREDIENTS
              </Typography>
              {ingredients.map((ing, i) => (
                <View key={i} style={styles.ingRow}>
                  <Typography style={styles.ingQty} color={colors.mutedStrong}>
                    {ing.qty}
                  </Typography>
                  <Typography style={styles.ingName} color={colors.text}>
                    {ing.name}
                  </Typography>
                </View>
              ))}
            </View>
          ) : null}

          {item.kind === 'recipe' && steps.length ? (
            <View style={styles.block}>
              <Typography style={styles.blockLabel} color={colors.cobalt}>
                METHOD
              </Typography>
              {steps.map((st, i) => (
                <View key={i} style={styles.stepRow}>
                  <Typography style={styles.stepNum} color={colors.cobalt}>
                    {i + 1}
                  </Typography>
                  <Typography style={styles.stepText} color={colors.text}>
                    {st}
                  </Typography>
                </View>
              ))}
            </View>
          ) : null}

          {isMine ? (
            <Pressable
              onPress={() => router.push('/brought/new')}
              style={styles.editRow}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Typography style={styles.editText} color={colors.cobalt}>
                Edit what’s on the table
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Typography style={styles.detailLabel} color={colors.muted}>
        {label.toUpperCase()}
      </Typography>
      <Typography style={styles.detailValue} color={colors.text}>
        {value}
      </Typography>
    </View>
  );
}

const HERO_H = 260;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  centerText: { textAlign: 'center', paddingHorizontal: spacing.xxl },
  backLink: textStyles.controlStrong,

  hero: { width: '100%', height: HERO_H, backgroundColor: colors.sable },
  heroEmpty: { height: 140, backgroundColor: colors.cobaltSoft },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17,17,24,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  kind: textStyles.labelS,
  title: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(30),
    lineHeight: scaled(36),
    marginTop: 6,
  },
  byRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  by: textStyles.cardBody,

  quote: {
    borderLeftWidth: 2,
    borderLeftColor: colors.cobalt,
    paddingLeft: spacing.lg,
    marginTop: spacing.xl,
  },
  quoteText: {
    ...textStyles.cardBody,
    fontFamily: fonts.readingItal,
    fontSize: scaled(16),
    lineHeight: scaled(25),
  },

  underlined: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  underlinedText: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(16),
    lineHeight: scaled(25),
  },
  underlinedNote: { ...textStyles.labelS, marginTop: spacing.sm },

  detail: { marginTop: spacing.xl },
  detailLabel: textStyles.labelS,
  detailValue: { ...textStyles.cardBody, marginTop: 3 },

  block: { marginTop: spacing.xxl },
  blockLabel: { ...textStyles.labelS, marginBottom: spacing.md },
  ingRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: 5 },
  ingQty: { ...textStyles.cardBody, width: 86 },
  ingName: { ...textStyles.cardBody, flex: 1, color: colors.text },
  stepRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  stepNum: { ...textStyles.controlStrong, width: 18 },
  stepText: { ...textStyles.cardBody, flex: 1, lineHeight: scaled(22) },

  editRow: { alignItems: 'center', paddingTop: spacing.xxl },
  editText: textStyles.controlStrong,
});
