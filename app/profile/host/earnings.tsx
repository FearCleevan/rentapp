import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AppText variant="h2" weight="extrabold">
          Earnings
        </AppText>

        <View style={styles.card}>
          <AppText variant="label" weight="bold">
            ₱0.00 Total Earnings
          </AppText>

          <AppText style={styles.text}>
            Your earnings will appear here once you start hosting.
          </AppText>
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