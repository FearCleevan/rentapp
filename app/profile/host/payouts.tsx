import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';

export default function PayoutsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AppText variant="h2" weight="extrabold">
          Payout Settings
        </AppText>

        <View style={styles.card}>
          <AppText variant="label" weight="bold">
            No payout method added
          </AppText>

          <AppText style={styles.text}>
            Add a bank account or e-wallet to receive payments.
          </AppText>

          <AppButton label="Add Payout Method" style={{ marginTop: Spacing.md }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  text: {
    marginTop: Spacing.sm,
    color: Colors.muted,
  },
});