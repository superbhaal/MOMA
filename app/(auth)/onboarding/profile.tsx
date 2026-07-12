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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { resolveCurrentLocation, resolveTypedAddress } from '@/lib/geocode';
import { uploadAvatar } from '@/lib/avatar';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { onboardingData, saveProgress } = useOnboarding();

  const [avatarUri, setAvatarUri] = useState<string | null>(onboardingData.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState(onboardingData.displayName);
  const [lastName, setLastName] = useState(onboardingData.lastName ?? '');
  const [age, setAge] = useState(onboardingData.age ? String(onboardingData.age) : '');
  const [address, setAddress] = useState(onboardingData.address ?? '');
  const [resolved, setResolved] = useState<{
    city: string | null;
    neighbourhood: string | null;
    latitude: number | null;
    longitude: number | null;
  }>({
    city: onboardingData.city,
    neighbourhood: onboardingData.neighbourhood,
    latitude: onboardingData.latitude,
    longitude: onboardingData.longitude,
  });
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ageNum = age ? parseInt(age, 10) : NaN;
  const ageValid = Number.isFinite(ageNum) && ageNum >= 16 && ageNum <= 60;

  const canContinue =
    displayName.trim().length > 0 &&
    ageValid &&
    !saving &&
    !uploadingAvatar;

  async function handlePickPhoto() {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('we need photo permission to set your picture');
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
      setError(upErr ?? 'upload failed');
      return;
    }
    setAvatarUri(url);
    await saveProgress({ avatar_url: url });
  }

  async function handleUseLocation() {
    setError(null);
    setLocating(true);
    const r = await resolveCurrentLocation();
    setLocating(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setAddress(r.result.address);
    setResolved({
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    });
  }

  async function handleContinue() {
    setError(null);
    setSaving(true);

    let geo = resolved;
    const addrTyped = address.trim();
    if (addrTyped && !geo.latitude) {
      const r = await resolveTypedAddress(addrTyped);
      if (r.ok) {
        geo = {
          city: r.result.city,
          neighbourhood: r.result.neighbourhood,
          latitude: r.result.latitude,
          longitude: r.result.longitude,
        };
      }
    }

    const { error: saveError } = await saveProgress({
      display_name: displayName.trim(),
      last_name: lastName.trim() || null,
      age: age ? parseInt(age, 10) : null,
      address: addrTyped || null,
      city: geo.city,
      neighbourhood: geo.neighbourhood,
      latitude: geo.latitude,
      longitude: geo.longitude,
      avatar_url: avatarUri,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    router.push('/(auth)/onboarding/q1');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={18} color={colors.cobalt} />
          <Typography variant="bodyL" color={colors.cobalt} style={styles.backText}>
            Back
          </Typography>
        </Pressable>
        <Typography variant="labelS" style={styles.stepLabel}>
          STEP 2 OF 2 · ABOUT YOU
        </Typography>
        <View style={styles.stepBar}>
          <View style={[styles.stepSeg, styles.stepSegHalfDone]} />
          <View style={[styles.stepSeg, styles.stepSegDone]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Typography variant="displayL" style={styles.heading}>
          Tell us a little{'\n'}about you.
        </Typography>
        <Typography variant="bodyL" color={colors.muted} style={styles.subhead}>
          Only shared with your matched group. Never public.
        </Typography>

        {error ? (
          <View style={styles.errorBox}>
            <Typography variant="bodyL" color={colors.cherry}>
              {error}
            </Typography>
          </View>
        ) : null}

        <Pressable style={styles.avatarWrap} onPress={handlePickPhoto}>
          <View style={styles.avatarCircle}>
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.cobalt} />
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera-outline" size={32} color="rgba(26,75,204,0.55)" />
            )}
          </View>
          <Typography variant="label" color={colors.muted} style={styles.avatarLabel}>
            {avatarUri ? 'TAP TO CHANGE PHOTO' : 'TAP TO UPLOAD A PHOTO'}
          </Typography>
        </Pressable>

        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <Typography variant="label" color={colors.muted}>
              FIRST NAME
            </Typography>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Sofia"
              placeholderTextColor={colors.muted}
              textContentType="givenName"
              autoComplete="name-given"
              autoCapitalize="words"
            />
          </View>
          <View style={styles.nameCol}>
            <Typography variant="label" color={colors.muted}>
              LAST NAME
            </Typography>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="van Dijk"
              placeholderTextColor={colors.muted}
              textContentType="familyName"
              autoComplete="name-family"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            YOUR AGE
          </Typography>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 28"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Typography variant="bodyM" color={colors.muted} style={styles.helper}>
            Used softly in matching. We avoid very wide age gaps.
          </Typography>
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            YOUR NEIGHBOURHOOD OR CITY
          </Typography>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                setResolved({
                  city: null,
                  neighbourhood: null,
                  latitude: null,
                  longitude: null,
                });
              }}
              placeholder="e.g. Jordaan, Amsterdam"
              placeholderTextColor={colors.muted}
              textContentType="fullStreetAddress"
              autoCapitalize="words"
            />
            <Pressable onPress={handleUseLocation} disabled={locating} hitSlop={10}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.cobalt} />
              ) : (
                <Ionicons name="location-outline" size={20} color={colors.cobalt} />
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? 'saving...' : 'Continue to matching quiz →'}
          onPress={handleContinue}
          disabled={!canContinue}
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
  },
  stepLabel: {
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 4,
  },
  stepSeg: {
    flex: 1,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(26,75,204,0.20)',
  },
  stepSegHalfDone: {
    backgroundColor: 'rgba(26,75,204,0.40)',
  },
  stepSegDone: {
    backgroundColor: colors.cobalt,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  heading: {
    fontFamily: fonts.serifReg,
    fontSize: 36,
    lineHeight: 40,
    color: colors.text,
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  subhead: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    color: colors.muted,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: 'rgba(26,75,204,0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLabel: {
    marginTop: spacing.sm,
    letterSpacing: 2,
    fontSize: 10,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  nameCol: {
    flex: 1,
    gap: spacing.xs,
  },
  field: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  helper: {
    fontStyle: 'italic',
    marginTop: 4,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
  },
});
