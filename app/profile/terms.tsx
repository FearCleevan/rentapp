import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AppText variant="h2" weight="extrabold">
          Terms of Service
        </AppText>

        <View style={styles.card}>
          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            1. Acceptance of Terms
          </AppText>
          <AppText style={styles.text}>
            By using this app, you agree to our terms and conditions.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            2. User Responsibilities
          </AppText>
          <AppText style={styles.text}>
            You are responsible for maintaining the confidentiality of your account.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            3. Prohibited Activities
          </AppText>
          <AppText style={styles.text}>
            You may not use the platform for illegal or unauthorized purposes.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            4. Changes to Terms
          </AppText>
          <AppText style={styles.text}>
            We reserve the right to update these terms at any time.
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
  sectionTitle: {
    marginTop: Spacing.md,
  },
  text: {
    marginTop: Spacing.xs,
    color: Colors.muted,
    lineHeight: 20,
  },
});