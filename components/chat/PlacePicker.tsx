import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ActionSheet } from '@/components/ui/ActionSheet';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import type { PlaceAttachment } from '@/types';

interface PlacePickerProps {
  visible: boolean;
  onClose: () => void;
  onPick: (place: PlaceAttachment) => Promise<void> | void;
}

// MVP: hardcoded suggestions. Swap for a real geo search when we wire google places.
const SUGGESTIONS: PlaceAttachment[] = [
  { name: 'Bocca Coffee', address: 'Kerkstraat 96, Amsterdam', lat: null, lng: null, category: 'coffee' },
  { name: 'Vondelpark — south entrance', address: 'Amsterdam', lat: null, lng: null, category: 'park' },
  { name: 'Toki', address: 'Binnen Dommersstraat 15, Amsterdam', lat: null, lng: null, category: 'coffee' },
  { name: 'Sarphatipark', address: 'De Pijp, Amsterdam', lat: null, lng: null, category: 'park' },
  { name: 'CoffeeConcepts', address: 'Singel 67, Amsterdam', lat: null, lng: null, category: 'coffee' },
];

export function PlacePicker({ visible, onClose, onPick }: PlacePickerProps) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTIONS;
    return SUGGESTIONS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  async function pick(place: PlaceAttachment) {
    setBusy(true);
    try {
      await onPick(place);
      onClose();
      setQuery('');
    } finally {
      setBusy(false);
    }
  }

  async function pickCustom() {
    if (!query.trim()) return;
    await pick({
      name: query.trim(),
      address: null,
      lat: null,
      lng: null,
      category: null,
    });
  }

  return (
    <ActionSheet visible={visible} onClose={onClose} title="share a place">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="search a café, park, class…"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <View style={styles.list}>
        {filtered.map((p) => (
          <Pressable key={p.name} onPress={() => pick(p)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Typography variant="displayS" color={colors.text}>
                {p.name}
              </Typography>
              {p.address ? (
                <Typography
                  variant="bodyM"
                  color={colors.muted}
                  style={{ marginTop: 2 }}
                >
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

      {query.trim() && filtered.length === 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button
            title={`use "${query.trim()}"`}
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
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
