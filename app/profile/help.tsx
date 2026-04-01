import { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

const FAQS: { section: string; icon: string; items: { q: string; a: string }[] }[] = [
  {
    section: 'Account',
    icon: 'user',
    items: [
      {
        q: 'How do I verify my identity?',
        a: 'Go to Profile → Verify ID. Upload a clear photo of a valid government-issued ID and a selfie holding the same ID. Our team reviews submissions within 1–2 business days.',
      },
      {
        q: 'Can I change my email address?',
        a: 'Email changes are handled through your account security settings. Contact support if you need assistance changing your registered email.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To delete your account, please contact our support team. Note that deleting your account is permanent and will remove all your listings and booking history.',
      },
    ],
  },
  {
    section: 'Bookings',
    icon: 'calendar',
    items: [
      {
        q: 'How do I make a booking?',
        a: 'Browse listings, select a listing that meets your needs, choose your dates and times, then proceed to payment. Instant Book listings are confirmed immediately; others require host approval.',
      },
      {
        q: 'Can I cancel a booking?',
        a: 'Yes. Go to your Bookings tab, select the booking, and tap Cancel. Cancellation fees depend on the listing\'s cancellation policy and how far in advance you cancel.',
      },
      {
        q: 'What if the listing is not as described?',
        a: 'Contact the host directly via in-app messages. If the issue is not resolved, reach out to our support team within 24 hours of check-in for assistance.',
      },
    ],
  },
  {
    section: 'Payments',
    icon: 'credit-card',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept GCash, Maya, and major credit/debit cards via PayMongo. All transactions are processed securely.',
      },
      {
        q: 'When will I be charged?',
        a: 'Payment is collected at the time of booking confirmation. For Instant Book listings, you are charged immediately. For request-based listings, payment is captured once the host approves.',
      },
      {
        q: 'How do refunds work?',
        a: 'Refunds are processed based on the listing\'s cancellation policy. Eligible refunds are returned to your original payment method within 5–10 business days.',
      },
    ],
  },
  {
    section: 'Hosting',
    icon: 'home',
    items: [
      {
        q: 'How do I become a host?',
        a: 'You can create a listing from the Profile → My Listings page. Fill in the details about your space, set your availability and pricing, and publish when ready.',
      },
      {
        q: 'When do I receive my payout?',
        a: 'Payouts are released 24 hours after a booking is marked as completed. Funds arrive within 3–5 business days depending on your payout method.',
      },
      {
        q: 'Can I pause or deactivate a listing?',
        a: 'Yes. From My Listings, you can toggle a listing to Paused at any time. Paused listings won\'t appear in search results but won\'t be deleted.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={faqStyles.item}
      onPress={() => setOpen(v => !v)}
      activeOpacity={0.8}
    >
      <View style={faqStyles.row}>
        <AppText variant="label" weight="semibold" style={{ flex: 1 }}>{q}</AppText>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.subtle} />
      </View>
      {open && (
        <AppText variant="body" color={Colors.muted} style={faqStyles.answer}>
          {a}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  answer: {
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});

export default function HelpScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h2" weight="extrabold">Help & FAQ</AppText>
      <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xl }}>
        Find answers to common questions below.
      </AppText>

      {FAQS.map(section => (
        <View key={section.section} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Feather name={section.icon as any} size={16} color={Colors.primary} />
            </View>
            <AppText variant="label" weight="bold">{section.section}</AppText>
          </View>

          <View style={styles.card}>
            {section.items.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  section:   { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
});
