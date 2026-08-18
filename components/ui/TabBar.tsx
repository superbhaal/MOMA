import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { scaled } from '@/constants/scale';

// Routes that should appear as tabs, in display order.
function tabs(t: TFunction) {
  return [
    { name: 'index', label: t('set.tabHome') },
    { name: 'chats', label: t('set.tabChats') },
    { name: 'discover', label: t('set.tabDiscover') },
    { name: 'me', label: t('set.tabMe') },
  ];
}

/**
 * Bottom tab bar matching `.bottom-nav` in design/moma standalone:
 * label-only, no icon. Active item gets bolder text + a 4px cobalt dot.
 */
export function MomaTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: 14 + insets.bottom * 0.6 }]}>
      {tabs(t).map((tab) => {
        const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
        if (routeIndex === -1) return null;
        const focused = state.index === routeIndex;
        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={styles.item}
            hitSlop={6}
          >
            <Typography
              color={focused ? colors.text : colors.muted}
              style={[styles.label, focused && styles.labelActive]}
            >
              {tab.label}
            </Typography>
            {focused ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontFamily: 'DMSans-Medium',
    fontSize: scaled(11),
    letterSpacing: 0.2,
  },
  labelActive: {
    fontFamily: 'DMSans-SemiBold',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cobalt,
    marginTop: 4,
  },
});
