import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { LovedSpotRow } from '@/components/discover/LovedSpotRow';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import type { LovedKind, LovedSpotWithPoster } from '@/types';

const DISCLAIMER =
  'These are personal recommendations from other moms. Always do your own due diligence for healthcare decisions.';

const COLLAPSED_DEFAULT = 244;
const EXPANDED_DEFAULT = 560;

interface ExploreSheetProps {
  mode: LovedKind;
  spots: LovedSpotWithPoster[];
  loading: boolean;
  error: string | null;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  currentUserId?: string;
  bottomInset: number;
  /** A specific category is selected (not "All") — enables Clear filters. */
  hasCategoryFilter: boolean;
  /** Current user can post — unlocks "Be the first" in the truly-empty state. */
  canPost: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onCompose: () => void;
  /** Rest heights of the collapsed peek / expanded list. */
  collapsedHeight?: number;
  expandedHeight?: number;
}

/**
 * Persistent Explore sheet: count head, attributed spot rows, and the
 * always-present due-diligence disclaimer (escalated in People mode). Tapping
 * the grab handle or "See all" toggles collapsed peek ↔ expanded list.
 */
export function ExploreSheet({
  mode,
  spots,
  loading,
  error,
  expanded,
  onToggle,
  onSelect,
  currentUserId,
  bottomInset,
  hasCategoryFilter,
  canPost,
  onRetry,
  onClearFilters,
  onCompose,
  collapsedHeight = COLLAPSED_DEFAULT,
  expandedHeight = EXPANDED_DEFAULT,
}: ExploreSheetProps) {
  const height = useRef(new Animated.Value(collapsedHeight)).current;

  // Animate between the two rest heights when `expanded` flips.
  useEffect(() => {
    Animated.timing(height, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [expanded, height, collapsedHeight, expandedHeight]);

  const count = spots.length;
  const countLabel =
    mode === 'place' ? 'places loved nearby' : 'people moms trust nearby';
  const isPeople = mode === 'person';

  return (
    <Animated.View style={[styles.sheet, { height, paddingBottom: bottomInset + spacing.lg }]}>
      <Pressable
        onPress={onToggle}
        style={styles.handleHit}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Collapse list' : 'Expand list'}
        accessibilityState={{ expanded }}
      >
        <View style={styles.handle} />
      </Pressable>

      <View style={styles.head}>
        <Typography style={styles.countText} color={colors.labelMuted}>
          <Typography style={styles.countNum} color={colors.text}>
            {count}{' '}
          </Typography>
          {countLabel}
        </Typography>
        {count > 0 ? (
          <Pressable
            onPress={onToggle}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Collapse list' : 'See all'}
          >
            <Typography style={styles.seeAll} color={colors.cobalt}>
              {expanded ? 'Collapse ↓' : 'See all ↑'}
            </Typography>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        scrollEnabled={expanded}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {loading ? (
          [0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)
        ) : error ? (
          <View style={styles.state}>
            <Typography variant="bodyL" color={colors.cherry} style={styles.stateText}>
              {error}
            </Typography>
            <Pressable onPress={onRetry} style={styles.retryBtn} accessibilityRole="button">
              <Typography style={styles.retryText} color={colors.cobalt}>
                Try again
              </Typography>
            </Pressable>
          </View>
        ) : count === 0 && hasCategoryFilter ? (
          // Nothing in THIS category, but other categories may have spots.
          <View style={styles.state}>
            <Typography variant="bodyL" color={colors.muted} style={styles.stateText}>
              Nothing in this category yet.
            </Typography>
            <Pressable onPress={onClearFilters} style={styles.retryBtn} accessibilityRole="button">
              <Typography style={styles.retryText} color={colors.cobalt}>
                Clear filters
              </Typography>
            </Pressable>
          </View>
        ) : count === 0 ? (
          // Truly empty. Contributors are invited to seed it; readers are not.
          <View style={styles.state}>
            <Typography variant="bodyL" color={colors.muted} style={styles.stateText}>
              No one has added anything here yet.
            </Typography>
            {canPost ? (
              <Pressable onPress={onCompose} style={styles.retryBtn} accessibilityRole="button">
                <Typography style={styles.retryText} color={colors.cobalt}>
                  Be the first →
                </Typography>
              </Pressable>
            ) : null}
          </View>
        ) : (
          spots.map((s) => (
            <LovedSpotRow
              key={s.id}
              spot={s}
              addedByYou={!!currentUserId && s.poster_id === currentUserId}
              onPress={() => onSelect(s.id)}
            />
          ))
        )}

        <View style={[styles.disclaimer, isPeople && styles.disclaimerPeople]}>
          <Typography
            style={[styles.disclaimerText, isPeople && styles.disclaimerTextPeople]}
            color={isPeople ? colors.soleilInkSm : colors.muted}
          >
            {DISCLAIMER}
          </Typography>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    shadowColor: 'rgba(17,17,24,1)',
    shadowOpacity: 0.1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  handleHit: { alignItems: 'center', justifyContent: 'center', height: 30, marginTop: -6 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  countText: { fontFamily: fonts.body, fontSize: 14 },
  countNum: { fontFamily: fonts.bodySemi, fontSize: 14 },
  seeAll: { fontFamily: fonts.bodySemi, fontSize: 13 },
  listContent: { paddingBottom: spacing.md },
  skeleton: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.line,
    marginBottom: spacing.sm,
  },
  state: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  stateText: { textAlign: 'center' },
  retryBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  retryText: { fontFamily: fonts.bodySemi, fontSize: 14 },
  disclaimer: { paddingTop: spacing.md },
  disclaimerPeople: {
    marginTop: spacing.sm,
    backgroundColor: '#FEF4CC', // soleil 18% on white — escalated healthcare notice
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  disclaimerText: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  disclaimerTextPeople: { fontFamily: fonts.bodyMed },
});
