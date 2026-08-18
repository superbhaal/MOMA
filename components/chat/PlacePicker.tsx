import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { searchPlaces } from '@/lib/places';
import type { PlaceAttachment } from '@/types';

interface PlacePickerProps {
  visible: boolean;
  onClose: () => void;
  /** The group's city — scopes the place search. */
  city: string | null;
  onPick: (place: PlaceAttachment) => Promise<void> | void;
}

export function PlacePicker({ visible, onClose, city, onPick }: PlacePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceAttachment[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const reqId = useRef(0);

  // Debounced Google Places search (via the places-search Edge Function),
  // scoped to the group's city.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const found = await searchPlaces(q, city);
      if (id === reqId.current) {
        setResults(found);
        setSearching(false);
      }
    }, 450); // Debounce to limit Places API calls (and cost) while typing.
    return () => clearTimeout(t);
  }, [query, city]);

  const hint = useMemo(
    () => `search a café, park, spot${city ? ` in ${city}` : ''}…`,
    [city],
  );

  async function pick(place: PlaceAttachment) {
    setBusy(true);
    try {
      await onPick(place);
      onClose();
      setQuery('');
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  async function pickCustom() {
    const q = query.trim();
    if (!q) return;
    await pick({ name: q, address: city, lat: null, lng: null, category: null });
  }

  return (
    <ActionSheet visible={visible} onClose={onClose} title={t('grp.sharePlace')}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={hint}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCorrect={false}
      />

      {searching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" color={colors.cobalt} />
          <Typography variant="bodyM" color={colors.muted}>
            searching {city ?? 'nearby'}…
          </Typography>
        </View>
      ) : null}

      <View style={styles.list}>
        {results.map((p, i) => (
          <Pressable key={`${p.name}-${i}`} onPress={() => pick(p)} style={styles.row} disabled={busy}>
            <View style={{ flex: 1 }}>
              <Typography variant="displayS" color={colors.text}>
                {p.name}
              </Typography>
              {p.address ? (
                <Typography variant="bodyM" color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                  {p.address}
                </Typography>
              ) : null}
            </View>
            {p.category ? (
              <View style={styles.categoryPill}>
                <Typography variant="labelS" color={colors.muted}>
                  {p.category.toUpperCase()}
                </Typography>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {query.trim().length >= 2 && !searching && results.length === 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <Typography variant="bodyM" color={colors.muted} style={{ marginBottom: spacing.sm }}>
            No match found — share it by name anyway.
          </Typography>
          <Button
            title={`Share "${query.trim()}"`}
            onPress={pickCustom}
            disabled={busy}
            size="lg"
            variant="secondary"
          />
        </View>
      ) : null}
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  list: { marginTop: spacing.md, maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
  },
});
