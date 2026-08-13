import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { LovedSpotRow } from '@/components/discover/LovedSpotRow';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import type { LovedKind, LovedPlace } from '@/types';

const DISCLAIMER =
  'These are personal recommendations from other moms. Always do your own due diligence for healthcare decisions.';

const COLLAPSED_DEFAULT = 244;
const EXPANDED_DEFAULT = 560;

interface ExploreSheetProps {
  mode: LovedKind;
  spots: LovedPlace[];
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
 * always-present due-diligence disclaimer (escalated in People mode).
 *
 * It's dragged, the way every other map sheet on the phone behaves — a tester
 * found the See all / Collapse buttons unintuitive next to those. Pull the
 * handle and the sheet follows the finger, then settles to whichever rest
 * height the release was heading for; a plain tap still toggles.
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
  // Mirrors `height` for the gesture maths — an Animated.Value can't be read
  // synchronously mid-drag.
  const heightNow = useRef(collapsedHeight);
  const dragStart = useRef(collapsedHeight);

  // Animate between the two rest heights when `expanded` flips.
  useEffect(() => {
    Animated.timing(height, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [expanded, height, collapsedHeight, expandedHeight]);

  useEffect(() => {
    const id = height.addListener(({ value }) => {
      heightNow.current = value;
    });
    return () => height.removeListener(id);
  }, [height]);

  // The drag behaviour is shared by two responders that differ only in when
  // they claim the gesture — see `sheetPan` and `headerPan` below.
  const dragConfig = useMemo(
    () =>
      ({
        onPanResponderGrant: () => {
          dragStart.current = heightNow.current;
          height.stopAnimation();
        },
        onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          // Dragging up grows the sheet, hence the inverted sign.
          const next = dragStart.current - g.dy;
          height.setValue(Math.min(expandedHeight, Math.max(collapsedHeight, next)));
        },
        onPanResponderRelease: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
          // A flick wins over position; otherwise settle to the nearer rest.
          const mid = (collapsedHeight + expandedHeight) / 2;
          const wantExpanded =
            g.vy < -0.5 ? true : g.vy > 0.5 ? false : heightNow.current > mid;
          if (wantExpanded !== expanded) {
            onToggle(); // parent flips `expanded`, the effect above animates
          } else {
            Animated.spring(height, {
              toValue: wantExpanded ? expandedHeight : collapsedHeight,
              useNativeDriver: false,
              bounciness: 2,
            }).start();
          }
        },
      }) as const,
    [collapsedHeight, expandedHeight, expanded, height, onToggle],
  );

  /**
   * Whole-sheet drag, claimed on capture so it beats the inner list. Only while
   * COLLAPSED, where the list is frozen (`scrollEnabled={expanded}`) and there
   * is nothing to compete with — this is what lets her open the sheet from
   * anywhere on the white.
   */
  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        ...dragConfig,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          !expanded && Math.abs(g.dy) > 4 && Math.abs(g.dy) >= Math.abs(g.dx),
      }),
    [dragConfig, expanded],
  );

  /**
   * The header — handle plus the count line — drags unconditionally, in both
   * states.
   *
   * This is the fix for the sheet she couldn't push down. The previous version
   * let an expanded sheet be dragged only while the list sat exactly at its
   * top; she had scrolled a few pixels, so the condition was false and the
   * gesture went back to the list. The handle itself was inside that condition,
   * so even the handle stopped working — I fixed "you can only drag by the
   * handle" by breaking the handle. Nothing about the list's position can
   * disable this one.
   */
  const headerPan = useMemo(
    () =>
      PanResponder.create({
        ...dragConfig,
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dy) > 4 && Math.abs(g.dy) >= Math.abs(g.dx),
      }),
    [dragConfig],
  );

  const count = spots.length;
  const countLabel =
    mode === 'place' ? 'places loved nearby' : 'people moms trust nearby';
  const isPeople = mode === 'person';

  return (
    <Animated.View
      style={[styles.sheet, { height, paddingBottom: bottomInset + spacing.lg }]}
      {...sheetPan.panHandlers}
    >
      {/* Handle and count line are one drag surface — roughly 60pt of target
          that always moves the sheet, whatever the list is doing. */}
      <View {...headerPan.panHandlers}>
        <Pressable
          onPress={onToggle}
          style={styles.handleHit}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse list' : 'Expand list'}
          accessibilityHint="Drag up for the full list, down for the map"
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
        </View>
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
              key={s.key}
              spot={s}
              addedByYou={
                !!currentUserId && s.recommendations.some((r) => r.poster_id === currentUserId)
              }
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
  countText: textStyles.cardBody,
  countNum: textStyles.controlStrong,
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
  retryText: textStyles.controlStrong,
  disclaimer: { paddingTop: spacing.md },
  disclaimerPeople: {
    marginTop: spacing.sm,
    backgroundColor: '#FEF4CC', // soleil 18% on white — escalated healthcare notice
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  disclaimerText: textStyles.cardBody,
  disclaimerTextPeople: { fontFamily: fonts.bodyMed },
});
