import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';

interface SavedFilterToggleProps {
  active: boolean;
  onChange: (next: boolean) => void;
}

/**
 * "Only what I liked", per Discover tab.
 *
 * Liking used to pile everything into one shelf on the profile, which grew
 * until it was no use — Maria's words were that it had become a list too long
 * to find anything in. So the shelf is gone and this took its place: the same
 * hearts, but you filter where you browse. Learn shows her articles, Explore
 * her places, Regulars the mothers she wants to find again. Nothing ever shows
 * all of it at once, which is the point.
 */
export function SavedFilterToggle({ active, onChange }: SavedFilterToggleProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => onChange(!active)}
      style={[styles.btn, active && styles.btnActive]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t(active ? 'dis.savedFilterOn' : 'dis.savedFilterOff')}
    >
      <Ionicons
        name={active ? 'heart' : 'heart-outline'}
        size={19}
        color={active ? colors.white : colors.fuchsia}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
  },
  btnActive: {
    backgroundColor: colors.fuchsia,
    borderColor: colors.fuchsia,
  },
});
