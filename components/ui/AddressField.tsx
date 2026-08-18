import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import type { AddressFieldState } from '@/hooks/useAddressField';

/**
 * Address input + "use my location" button + the resolved/erroring line under
 * it. Pair with useAddressField, which owns the state and the geocoding.
 */
export function AddressField({
  field,
  placeholder,
  hint,
}: {
  field: AddressFieldState;
  placeholder?: string;
  hint?: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <View style={styles.inputWithIcon}>
        <TextInput
          style={styles.input}
          value={field.address}
          onChangeText={field.setAddress}
          onSubmitEditing={field.verify}
          returnKeyType="search"
          placeholder={placeholder ?? t('misc.addressPlaceholder')}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
        />
        {field.verifying ? (
          <ActivityIndicator size="small" color={colors.cobalt} />
        ) : (
          <Pressable onPress={field.useCurrentLocation} disabled={field.locating} hitSlop={10}>
            {field.locating ? (
              <ActivityIndicator size="small" color={colors.cobalt} />
            ) : (
              <Ionicons name="location-outline" size={20} color={colors.cobalt} />
            )}
          </Pressable>
        )}
      </View>

      {field.verified ? (
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={15} color={colors.cobalt} />
          <Typography variant="bodyM" color={colors.cobalt} style={styles.verifiedText}>
            {field.label ?? 'location verified'}
          </Typography>
        </View>
      ) : field.error ? (
        <Typography variant="bodyM" color={colors.cherry} style={styles.note}>
          {field.error}
        </Typography>
      ) : (
        <Typography variant="bodyM" color={colors.muted} style={[styles.note, styles.hint]}>
          {hint ?? t('misc.addressHint')}
        </Typography>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    paddingVertical: spacing.md,
  },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  verifiedText: { fontFamily: fonts.bodyMed },
  note: { marginTop: 6 },
  hint: { fontStyle: 'italic' },
});
