import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AppText variant="h2" weight="extrabold">
          Privacy Policy
        </AppText>

        <View style={styles.card}>
          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            1. Information We Collect
          </AppText>
          <AppText style={styles.text}>
            We collect personal information such as your name, email, and usage data.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            2. How We Use Your Data
          </AppText>
          <AppText style={styles.text}>
            Your data is used to improve our services and provide a better experience.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            3. Data Protection
          </AppText>
          <AppText style={styles.text}>
            We implement security measures to protect your information.
          </AppText>

          <AppText variant="label" weight="bold" style={styles.sectionTitle}>
            4. Your Rights
          </AppText>
          <AppText style={styles.text}>
            You have the right to access, update, or delete your personal data.
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