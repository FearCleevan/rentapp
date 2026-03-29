import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

export default function VerifyIDScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">Verify ID</AppText>

      <View style={styles.card}>
        <AppText>Upload a valid government ID.</AppText>
        <AppButton label="Upload ID" style={{ marginTop: 16 }} />
      </View>
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
});