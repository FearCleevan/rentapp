import { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useToast } from '@/components/ui/Toast';

const TOPICS = [
  'Booking Issue',
  'Payment Problem',
  'Account Access',
  'Listing Help',
  'Refund Request',
  'Other',
];

const CONTACT_LINKS = [
  { icon: 'mail',     label: 'Email Us',     sub: 'support@rentapp.ph',      onPress: () => Linking.openURL('mailto:support@rentapp.ph') },
  { icon: 'message-circle', label: 'Live Chat', sub: 'Mon–Fri, 9 AM–6 PM PHT', onPress: () => {} },
  { icon: 'phone',    label: 'Call Us',      sub: '+63 2 8XXX XXXX',          onPress: () => Linking.openURL('tel:+6328XXXXXXX') },
];

export default function SupportScreen() {
  const toast = useToast();

  const [topic,    setTopic]    = useState('');
  const [subject,  setSubject]  = useState('');
  const [message,  setMessage]  = useState('');
  const [errors,   setErrors]   = useState<{ subject?: string; message?: string; topic?: string }>({});
  const [loading,  setLoading]  = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!topic)              e.topic   = 'Please select a topic';
    if (!subject.trim())     e.subject = 'Subject is required';
    if (message.trim().length < 20) e.message = 'Please describe your issue (min. 20 characters)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    // In production: call a support ticket API or send via email
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    toast.show('Support request submitted!', 'success');
    setTopic('');
    setSubject('');
    setMessage('');
    setErrors({});
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h2" weight="extrabold">Contact Support</AppText>
      <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xl }}>
        We typically respond within 24 hours.
      </AppText>

      {/* ── Quick contact ── */}
      <View style={styles.contactRow}>
        {CONTACT_LINKS.map(c => (
          <TouchableOpacity key={c.label} style={styles.contactCard} onPress={c.onPress} activeOpacity={0.8}>
            <View style={styles.contactIcon}>
              <Feather name={c.icon as any} size={18} color={Colors.primary} />
            </View>
            <AppText variant="label" weight="semibold" style={{ marginTop: Spacing.xs }}>{c.label}</AppText>
            <AppText variant="caption" color={Colors.muted} center>{c.sub}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Submit a ticket ── */}
      <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionLabel}>
        SUBMIT A TICKET
      </AppText>

      {/* Topic selector */}
      <View style={styles.topicGrid}>
        {TOPICS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.topicChip, topic === t && styles.topicChipActive]}
            onPress={() => { setTopic(t); setErrors(e => ({ ...e, topic: undefined })); }}
            activeOpacity={0.8}
          >
            <AppText
              variant="caption"
              weight={topic === t ? 'bold' : 'medium'}
              color={topic === t ? Colors.white : Colors.muted}
            >
              {t}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
      {errors.topic && (
        <AppText variant="caption" color={Colors.error} style={{ marginBottom: Spacing.md }}>
          {errors.topic}
        </AppText>
      )}

      <View style={styles.card}>
        <AppInput
          label="Subject"
          value={subject}
          onChangeText={t => { setSubject(t); setErrors(e => ({ ...e, subject: undefined })); }}
          placeholder="Briefly describe your issue"
          required
          error={errors.subject}
          iconLeft={<Feather name="edit-2" size={16} color={Colors.subtle} />}
        />

        <AppInput
          label="Message"
          value={message}
          onChangeText={t => { setMessage(t); setErrors(e => ({ ...e, message: undefined })); }}
          placeholder="Provide as much detail as possible…"
          multiline
          numberOfLines={5}
          style={styles.textarea}
          containerStyle={{ marginTop: Spacing.md }}
          required
          error={errors.message}
          iconLeft={<Feather name="message-square" size={16} color={Colors.subtle} />}
        />
      </View>

      <AppButton
        label={loading ? 'Submitting…' : 'Submit Ticket'}
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: Spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  topicChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  topicChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
});
