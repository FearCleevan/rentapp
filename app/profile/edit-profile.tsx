import { useState, useEffect } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';

import { useProfile } from '@/hooks/useProfile';

export default function EditProfileScreen() {
  const toast = useToast();
  const { profile, update, changeAvatar, isUpdating } = useProfile();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

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
      full_name: fullName,
      bio,
      phone,
      default_city: city,
    });

    if (error) {
      toast.show(error.message, 'error');
    } else {
      toast.show('Profile updated!', 'success');
    }
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
      const { error } = await changeAvatar(result.assets[0].uri);

      if (error) toast.show('Failed to upload image', 'error');
      else toast.show('Avatar updated!', 'success');
    }
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">Edit Profile</AppText>

      {/* Avatar */}
      <TouchableOpacity style={styles.avatar} onPress={handleAvatarChange}>
        {isUpdating ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <AppText color={Colors.white} weight="extrabold">
            {profile.full_name?.[0]}
          </AppText>
        )}
      </TouchableOpacity>

      {/* Form */}
      <View style={styles.card}>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          style={styles.input}
        />

        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Bio"
          multiline
          style={[styles.input, styles.textArea]}
        />

        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone"
          style={styles.input}
        />

        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City"
          style={styles.input}
        />
      </View>

      <AppButton
        label={isUpdating ? 'Saving...' : 'Save Changes'}
        onPress={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    backgroundColor: Colors.bg,
  },
  avatar: {
    marginTop: Spacing.lg,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 100,
  },
});