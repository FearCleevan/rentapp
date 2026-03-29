import { View, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

export default function ChangePasswordScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">Change Password</AppText>

      <View style={styles.card}>
        <TextInput placeholder="Current Password" secureTextEntry style={styles.input} />
        <TextInput placeholder="New Password" secureTextEntry style={styles.input} />
      </View>

      <AppButton label="Update Password" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, backgroundColor: Colors.bg },
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
});