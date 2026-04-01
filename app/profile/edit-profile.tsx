import { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useToast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';

export default function EditProfileScreen() {
  const toast = useToast();
  const { profile, update, changeAvatar, isUpdating } = useProfile();

  const [fullName,    setFullName]    = useState('');
  const [bio,         setBio]         = useState('');
  const [phone,       setPhone]       = useState('');
  const [city,        setCity]        = useState('');
  const [previewUri,  setPreviewUri]  = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setBio(profile.bio ?? '');
      setPhone(profile.phone ?? '');
      setCity(profile.default_city ?? '');
    }
  }, [profile]);

  async function handleSave() {
    const { error } = await update({
      full_name:    fullName,
      bio,
      phone,
      default_city: city,
    });
    if (error) toast.show(error.message, 'error');
    else       toast.show('Profile updated!', 'success');
  }

  async function handleAvatarChange() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const localUri = result.assets[0].uri;
      setPreviewUri(localUri);           // show immediately — no waiting for upload
      const { error } = await changeAvatar(localUri);
      if (error) {
        setPreviewUri(null);             // revert preview on failure
        toast.show('Failed to upload image', 'error');
      } else {
        setPreviewUri(null);             // store url now in profile; clear local preview
        toast.show('Avatar updated!', 'success');
      }
    }
  }

  if (!profile) return null;

  const initials   = profile.full_name?.slice(0, 2).toUpperCase() ?? '??';
  const displayUri = previewUri ?? profile.avatar_url;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Avatar ── */}
      <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarChange} activeOpacity={0.8}>
        {displayUri ? (
          <Image
            key={displayUri}
            source={{ uri: displayUri }}
            style={styles.avatarImg}
            contentFit="cover"
            cachePolicy="none"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <AppText variant="h2" weight="extrabold" color={Colors.white}>{initials}</AppText>
          </View>
        )}
        <View style={styles.avatarBadge}>
          {isUpdating
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Feather name="camera" size={14} color={Colors.white} />}
        </View>
      </TouchableOpacity>

      <AppText variant="label" color={Colors.muted} center style={{ marginBottom: Spacing.lg }}>
        Tap to change photo
      </AppText>

      {/* ── Stats row ── */}
      <View style={styles.statsRow}>
        <StatCard label="Listings"  value={String(profile.total_listings  ?? 0)} />
        <StatCard label="Bookings"  value={String(profile.total_bookings  ?? 0)} />
        {profile.is_host && profile.host_rating ? (
          <StatCard label="Host ★"   value={profile.host_rating.toFixed(1)} accent />
        ) : (
          <StatCard label="Trips"    value={String(profile.renter_review_count ?? 0)} />
        )}
      </View>

      {/* ── Form ── */}
      <View style={styles.section}>
        <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionTitle}>
          PERSONAL INFO
        </AppText>

        <AppInput
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          required
          iconLeft={<Feather name="user" size={16} color={Colors.subtle} />}
        />

        <AppInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself"
          multiline
          numberOfLines={3}
          style={styles.textArea}
          containerStyle={{ marginTop: Spacing.md }}
          iconLeft={<Feather name="edit-3" size={16} color={Colors.subtle} />}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionTitle}>
          CONTACT
        </AppText>

        <AppInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+63 9XX XXX XXXX"
          keyboardType="phone-pad"
          iconLeft={<Feather name="phone" size={16} color={Colors.subtle} />}
        />

        <AppInput
          label="City"
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Davao City"
          containerStyle={{ marginTop: Spacing.md }}
          iconLeft={<Feather name="map-pin" size={16} color={Colors.subtle} />}
        />
      </View>

      <AppButton
        label={isUpdating ? 'Saving…' : 'Save Changes'}
        onPress={handleSave}
        loading={isUpdating}
        style={{ marginTop: Spacing.lg }}
      />
    </ScrollView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={statStyles.card}>
      <AppText
        variant="h3"
        weight="extrabold"
        color={accent ? Colors.teal : Colors.ink}
      >
        {value}
      </AppText>
      <AppText variant="caption" color={Colors.muted}>{label}</AppText>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: Spacing.xs,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
