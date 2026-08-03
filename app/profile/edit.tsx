import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { AddressField } from '@/components/ui/AddressField';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAddressField } from '@/hooks/useAddressField';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { uploadAvatar } from '@/lib/avatar';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { update } = usePreferences();

  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  // Same capture as Preferences: matching is distance-based, so editing where
  // you live has to rewrite the coords too — a free-text city moved nobody.
  const locField = useAddressField({
    address: user?.address ?? user?.neighbourhood ?? null,
    city: user?.city ?? null,
    neighbourhood: user?.neighbourhood ?? null,
    latitude: user?.latitude ?? null,
    longitude: user?.longitude ?? null,
  });
  const [bio, setBio] = useState(user?.bio ?? '');
  const [instagram, setInstagram] = useState(user?.instagram_handle?.replace(/^@/, '') ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [interestDraft, setInterestDraft] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addInterest() {
    const v = interestDraft.trim();
    if (!v) return;
    if (interests.some((i) => i.toLowerCase() === v.toLowerCase())) {
      setInterestDraft('');
      return;
    }
    if (interests.length >= 8) return;
    setInterests((cur) => [...cur, v]);
    setInterestDraft('');
  }

  function removeInterest(tag: string) {
    setInterests((cur) => cur.filter((i) => i !== tag));
  }

  async function handlePickPhoto() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('We need photo permission to set your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);
    if (!user?.id) return;

    setUploadingAvatar(true);
    const { url, error: upErr } = await uploadAvatar(user.id, localUri);
    setUploadingAvatar(false);
    if (upErr || !url) {
      setError(upErr ?? 'Upload failed.');
      return;
    }
    setAvatarUri(url);
  }

  async function handleSave() {
    setError(null);
    if (!displayName.trim()) {
      setError('A first name is required.');
      return;
    }
    // An address only counts once it resolves to coords; resolve() geocodes it
    // if needed and surfaces its own error under the field. Left blank, we
    // simply don't touch the location — this screen also edits bio and photo,
    // and those edits shouldn't be held hostage by the address.
    let location = {};
    if (locField.address.trim()) {
      const geo = await locField.resolve();
      if (!geo || geo.latitude == null) return;
      location = {
        address: locField.address.trim(),
        city: geo.city,
        neighbourhood: geo.neighbourhood,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    }

    setSaving(true);
    const { error: saveError } = await update({
      display_name: displayName.trim(),
      ...location,
      bio: bio.trim() || null,
      interests: interests.length ? interests : null,
      instagram_handle: instagram.trim() ? instagram.trim().replace(/^@/, '') : null,
      avatar_url: avatarUri,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.cobalt} />
        </Pressable>
        <Typography style={styles.headerTitle}>Edit profile</Typography>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorBox}>
            <Typography variant="bodyL" color={colors.cherry}>
              {error}
            </Typography>
          </View>
        ) : null}

        <Pressable style={styles.avatarWrap} onPress={handlePickPhoto}>
          <View style={[styles.avatarCircle, { borderColor: user?.profile_color ?? colors.fuchsia }]}>
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.cobalt} />
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera-outline" size={30} color={colors.muted} />
            )}
          </View>
          <Typography style={styles.avatarLabel}>
            {avatarUri ? 'TAP TO CHANGE PHOTO' : 'TAP TO UPLOAD A PHOTO'}
          </Typography>
        </Pressable>

        <Field label="FIRST NAME">
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Sofia"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
        </Field>

        <Field label="WHERE YOU LIVE">
          <AddressField
            field={locField}
            placeholder="e.g. Jordaan, Amsterdam"
            hint="Moving? This is what we match you on — tap the pin to use your location."
          />
        </Field>

        <Field label="ABOUT ME">
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="A line or two about where you're at right now."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={280}
          />
          <Typography style={styles.counter}>{bio.length}/280</Typography>
        </Field>

        <Field label="INTERESTS">
          <View style={styles.chips}>
            {interests.map((tag) => (
              <Pressable key={tag} style={styles.chip} onPress={() => removeInterest(tag)}>
                <Typography style={styles.chipText}>{tag}</Typography>
                <Ionicons name="close" size={13} color={colors.muted} />
              </Pressable>
            ))}
          </View>
          <View style={styles.interestAddRow}>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              value={interestDraft}
              onChangeText={setInterestDraft}
              placeholder="Add an interest"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={addInterest}
              maxLength={24}
            />
            <Pressable onPress={addInterest} hitSlop={8} disabled={!interestDraft.trim()}>
              <Ionicons
                name="add-circle"
                size={26}
                color={interestDraft.trim() ? colors.cobalt : colors.line}
              />
            </Pressable>
          </View>
        </Field>

        <Field label="INSTAGRAM">
          <View style={styles.igRow}>
            <Typography style={styles.igAt}>@</Typography>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              value={instagram}
              onChangeText={(v) => setInstagram(v.replace(/^@/, '').trim())}
              placeholder="sofia.vandijk"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </Field>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title={saving ? 'saving…' : 'Save changes'}
          onPress={handleSave}
          disabled={saving || uploadingAvatar}
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Typography style={styles.fieldLabel}>{label}</Typography>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: { width: 40, height: 32, justifyContent: 'center' },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: scaled(22),
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarWrap: { alignItems: 'center', marginBottom: spacing.xl },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.cream,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLabel: {
    marginTop: spacing.sm,
    fontFamily: fonts.bodySemi,
    fontSize: scaled(10),
    letterSpacing: 1.6,
    color: colors.muted,
  },
  field: { marginBottom: spacing.lg },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(11),
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.sm,
  },
  multiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: fonts.body,
    fontSize: scaled(11),
    color: colors.muted,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(12),
    color: colors.text,
  },
  interestAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  igRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  igAt: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});
