import { View, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

export default function EditProfileScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">Edit Profile</AppText>

      <View style={styles.card}>
        <TextInput placeholder="Full Name" style={styles.input} />
        <TextInput placeholder="Bio" multiline style={[styles.input, styles.textArea]} />
      </View>

      <AppButton label="Save Changes" />
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
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 100,
  },
});