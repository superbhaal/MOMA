import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ensurePhotoPermission } from '@/lib/photoPermission';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { resolveCurrentLocation, resolveTypedAddress } from '@/lib/geocode';
import { uploadAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { onboardingData, saveProgress } = useOnboarding();

  const [avatarUri, setAvatarUri] = useState<string | null>(onboardingData.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState(onboardingData.displayName);
  const [lastName, setLastName] = useState(onboardingData.lastName ?? '');
  const [age, setAge] = useState(onboardingData.age ? String(onboardingData.age) : '');
  const [bio, setBio] = useState(onboardingData.bio ?? '');
  const [interests, setInterests] = useState((onboardingData.interests ?? []).join(', '));
  const [instagram, setInstagram] = useState(onboardingData.instagramHandle ?? '');
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
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ageNum = age ? parseInt(age, 10) : NaN;
  const ageValid = Number.isFinite(ageNum) && ageNum >= 16 && ageNum <= 60;

  // Photo is required and must be an uploaded (remote) URL — a local file:// URI
  // means the upload failed and wouldn't persist for the group to see.
  const photoValid = !!avatarUri && /^https?:/.test(avatarUri);

  // A verified location = we successfully resolved coordinates for the address.
  // Matching needs these coords (distance is the hard filter), so the address is
  // required AND must geocode before the user can continue.
  const locationVerified = resolved.latitude != null && resolved.longitude != null;
  const resolvedLabel = resolved.neighbourhood
    ? `${resolved.neighbourhood}, ${resolved.city ?? ''}`.replace(/, $/, '')
    : resolved.city;

  const canContinue =
    photoValid &&
    displayName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    ageValid &&
    address.trim().length > 0 &&
    !saving &&
    !uploadingAvatar &&
    !locating &&
    !verifying;

  async function handlePickPhoto() {
    setError(null);
    // Handles the "denied and never asked again" dead end by offering Settings.
    if (!(await ensurePhotoPermission())) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const localUri = result.assets[0].uri;
    setAvatarUri(localUri);

    // Use the auth session id — during onboarding the public.users row doesn't
    // exist yet, so useAuth().user is null. The Storage RLS path is keyed on the
    // auth uid, which is present the moment the user is signed up.
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setError('your session expired — please sign in again.');
      setAvatarUri(null);
      return;
    }

    setUploadingAvatar(true);
    const { url, error: upErr } = await uploadAvatar(uid, localUri);
    setUploadingAvatar(false);
    if (upErr || !url) {
      setError(upErr ?? 'upload failed');
      setAvatarUri(null); // keep photoValid false so the requirement is honest
      return;
    }
    setAvatarUri(url);
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

  /** Geocode the typed address; returns the resolved geo or null on failure. */
  async function verifyAddress(): Promise<typeof resolved | null> {
    const addrTyped = address.trim();
    if (!addrTyped) return null;
    if (resolved.latitude != null) return resolved; // already verified
    setError(null);
    setVerifying(true);
    const r = await resolveTypedAddress(addrTyped);
    setVerifying(false);
    if (!r.ok || r.result.latitude == null) {
      setError(
        "we couldn't find that address. check the spelling, or tap the location icon to use where you are.",
      );
      return null;
    }
    const geo = {
      city: r.result.city,
      neighbourhood: r.result.neighbourhood,
      latitude: r.result.latitude,
      longitude: r.result.longitude,
    };
    setResolved(geo);
    return geo;
  }

  function handleBack() {
    // profile is the first onboarding screen, so there's no stack entry to pop
    // (router.back() throws GO_BACK-not-handled). Going back means abandoning the
    // sign-up: clear everything entered (signOut resets the store) and return to
    // the welcome / login-signup screen.
    Alert.alert(
      'Start over?',
      'This clears everything you entered and takes you back to sign in.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ],
    );
  }

  async function handleContinue() {
    setError(null);

    // Address is required and must resolve to real coordinates — matching is
    // distance-based, so we don't let anyone through without a verified location.
    const addrTyped = address.trim();
    if (!addrTyped) {
      setError('please add where you live so we can match you with nearby moms.');
      return;
    }
    const geo = resolved.latitude != null ? resolved : await verifyAddress();
    if (!geo || geo.latitude == null) return; // verifyAddress already set the error

    setSaving(true);
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
      bio: bio.trim() || null,
      interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
      instagram_handle: instagram.trim().replace(/^@+/, '') || null,
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
          onPress={handleBack}
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
          <Typography variant="label" color={photoValid ? colors.muted : colors.cobalt} style={styles.avatarLabel}>
            {photoValid ? 'TAP TO CHANGE PHOTO' : 'TAP TO UPLOAD A PHOTO · REQUIRED'}
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
            WHERE YOU LIVE · REQUIRED
          </Typography>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                if (error) setError(null);
                // Editing invalidates the previously verified location.
                setResolved({
                  city: null,
                  neighbourhood: null,
                  latitude: null,
                  longitude: null,
                });
              }}
              onSubmitEditing={verifyAddress}
              returnKeyType="search"
              placeholder="e.g. Rue de Rivoli, Paris"
              placeholderTextColor={colors.muted}
              textContentType="fullStreetAddress"
              autoCapitalize="words"
            />
            {verifying ? (
              <ActivityIndicator size="small" color={colors.cobalt} />
            ) : (
              <Pressable onPress={handleUseLocation} disabled={locating} hitSlop={10}>
                {locating ? (
                  <ActivityIndicator size="small" color={colors.cobalt} />
                ) : (
                  <Ionicons name="location-outline" size={20} color={colors.cobalt} />
                )}
              </Pressable>
            )}
          </View>
          {locationVerified ? (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={15} color={colors.cobalt} />
              <Typography variant="bodyM" color={colors.cobalt} style={styles.verifiedText}>
                {resolvedLabel ?? 'location verified'}
              </Typography>
            </View>
          ) : (
            <Typography variant="bodyM" color={colors.muted} style={styles.helper}>
              We match you with moms within walking distance, so we verify your address. Only your group sees it.
            </Typography>
          )}
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            A LITTLE ABOUT YOU · OPTIONAL
          </Typography>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="A sentence or two your group will see."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={280}
          />
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            INTERESTS · OPTIONAL
          </Typography>
          <TextInput
            style={styles.input}
            value={interests}
            onChangeText={setInterests}
            placeholder="yoga, cooking, long walks"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
          />
          <Typography variant="bodyM" color={colors.muted} style={styles.helper}>
            Separate with commas.
          </Typography>
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            INSTAGRAM · OPTIONAL
          </Typography>
          <View style={styles.inputWithIcon}>
            <Typography variant="bodyL" color={colors.muted}>
              @
            </Typography>
            <TextInput
              style={[styles.input, { flex: 1, borderBottomWidth: 0 }]}
              value={instagram}
              onChangeText={(v) => setInstagram(v.replace(/^@+/, ''))}
              placeholder="yourhandle"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
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
    fontSize: scaled(15),
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
  // Same masthead as the quiz steps that follow it: serif italic, cobalt.
  heading: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(40),
    lineHeight: scaled(46),
    color: colors.cobalt,
    marginTop: spacing.md,
    letterSpacing: -0.8,
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
    fontSize: scaled(10),
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
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  verifiedText: {
    fontFamily: fonts.bodyMed,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
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
