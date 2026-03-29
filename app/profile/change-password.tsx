import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';

export default function ChangePasswordScreen() {
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!password) {
      toast.show('Password is required', 'error');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      toast.show(error.message, 'error');
    } else {
      toast.show('Password updated successfully!', 'success');
      setPassword('');
    }
  }

  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">
        Change Password
      </AppText>

      <View style={styles.card}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New Password"
          secureTextEntry
          style={styles.input}
        />
      </View>

      <AppButton
        label={loading ? 'Updating...' : 'Update Password'}
        onPress={handleChangePassword}
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
  },
});