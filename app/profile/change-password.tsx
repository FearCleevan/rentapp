import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useToast } from '@/components/ui/Toast';

export default function ChangePasswordScreen() {
  const toast = useToast();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState<{ password?: string; confirm?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!password)          e.password = 'New password is required';
    else if (password.length < 8) e.password = 'Must be at least 8 characters';
    if (!confirm)           e.confirm  = 'Please confirm your password';
    else if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleChangePassword() {
    if (!validate()) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.show(error.message, 'error');
    } else {
      toast.show('Password updated successfully!', 'success');
      setPassword('');
      setConfirm('');
      setErrors({});
    }
  }

  const strong = password.length >= 12;
  const medium = password.length >= 8 && !strong;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h2" weight="extrabold">Change Password</AppText>

      <View style={styles.card}>
        <AppInput
          label="New Password"
          value={password}
          onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
          placeholder="Min. 8 characters"
          isPassword
          required
          error={errors.password}
          iconLeft={<Feather name="lock" size={16} color={Colors.subtle} />}
        />

        {/* Strength indicator */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { backgroundColor: strong ? Colors.teal : medium ? Colors.amber : Colors.error }]} />
            <View style={[styles.strengthBar, { backgroundColor: strong ? Colors.teal : medium ? Colors.amber : Colors.border }]} />
            <View style={[styles.strengthBar, { backgroundColor: strong ? Colors.teal : Colors.border }]} />
            <AppText variant="caption" color={strong ? Colors.teal : medium ? Colors.amber : Colors.error}>
              {strong ? 'Strong' : medium ? 'Medium' : 'Weak'}
            </AppText>
          </View>
        )}

        <AppInput
          label="Confirm Password"
          value={confirm}
          onChangeText={t => { setConfirm(t); setErrors(e => ({ ...e, confirm: undefined })); }}
          placeholder="Re-enter new password"
          isPassword
          required
          error={errors.confirm}
          containerStyle={{ marginTop: Spacing.md }}
          iconLeft={<Feather name="lock" size={16} color={Colors.subtle} />}
        />
      </View>

      <View style={styles.tips}>
        <AppText variant="caption" weight="semibold" color={Colors.muted} style={{ marginBottom: Spacing.xs }}>
          Password requirements:
        </AppText>
        {['At least 8 characters', 'Mix of letters and numbers', 'Use symbols for stronger security'].map(tip => (
          <View key={tip} style={styles.tipRow}>
            <Feather name="check" size={12} color={Colors.subtle} />
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: Spacing.xs }}>{tip}</AppText>
          </View>
        ))}
      </View>

      <AppButton
        label={loading ? 'Updating…' : 'Update Password'}
        onPress={handleChangePassword}
        loading={loading}
        style={{ marginTop: Spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  tips: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
