import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { uploadGovId, submitIdVerification } from '@/lib/profileService';
import { useAuthStore } from '@/store/authStore';

type VerifStatus = 'none' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<VerifStatus, { label: string; color: string; bg: string; icon: string }> = {
  none:     { label: 'Not Verified',      color: Colors.muted,   bg: Colors.bg,           icon: 'shield' },
  pending:  { label: 'Under Review',      color: Colors.amber,   bg: Colors.amberLight,   icon: 'clock' },
  approved: { label: 'Verified',          color: Colors.teal,    bg: Colors.tealLight,    icon: 'shield' },
  rejected: { label: 'Verification Failed', color: Colors.error, bg: Colors.errorLight,   icon: 'x-circle' },
};

export default function VerifyIDScreen() {
  const toast   = useToast();
  const user    = useAuthStore(s => s.user);
  const { profile, refresh } = useProfile();

  const [frontUri,   setFrontUri]   = useState<string | null>(null);
  const [selfieUri,  setSelfieUri]  = useState<string | null>(null);
  const [uploading,  setUploading]  = useState<'front' | 'selfie' | 'submit' | null>(null);

  const status = (profile?.id_verification_status ?? 'none') as VerifStatus;
  const cfg    = STATUS_CONFIG[status];

  async function pickImage(type: 'front' | 'selfie') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast.show('Permission required', 'error'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;

    setUploading(type);
    if (!user) return;

    const { error } = await uploadGovId(user.id, uri, type);
    setUploading(null);

    if (error) {
      toast.show('Upload failed. Try again.', 'error');
    } else {
      if (type === 'front') setFrontUri(uri);
      else                  setSelfieUri(uri);
      toast.show('Image uploaded!', 'success');
      refresh();
    }
  }

  async function handleSubmit() {
    if (!user) return;
    const hasFront  = frontUri  || profile?.gov_id_url;
    const hasSelfie = selfieUri || profile?.gov_id_selfie_url;

    if (!hasFront || !hasSelfie) {
      toast.show('Please upload both images before submitting.', 'error');
      return;
    }

    setUploading('submit');
    const { error } = await submitIdVerification(user.id);
    setUploading(null);

    if (error) toast.show(error.message, 'error');
    else {
      toast.show('Submitted for review!', 'success');
      refresh();
    }
  }

  const frontSrc    = frontUri  || profile?.gov_id_url  || null;
  const selfieSrc   = selfieUri || profile?.gov_id_selfie_url || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Status banner ── */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon as any} size={20} color={cfg.color} />
        <AppText variant="label" weight="bold" color={cfg.color} style={{ marginLeft: Spacing.sm }}>
          {cfg.label}
        </AppText>
      </View>

      {status === 'approved' && (
        <View style={styles.approvedCard}>
          <Feather name="check-circle" size={48} color={Colors.teal} />
          <AppText variant="h3" weight="bold" style={{ marginTop: Spacing.md }}>
            Identity Verified
          </AppText>
          <AppText style={styles.approvedText}>
            Your government ID has been verified. You now have a verified badge on your profile.
          </AppText>
        </View>
      )}

      {status === 'pending' && (
        <View style={styles.pendingCard}>
          <AppText variant="body" color={Colors.muted} center>
            Your documents are currently under review. We'll notify you within 1–2 business days.
          </AppText>
        </View>
      )}

      {(status === 'none' || status === 'rejected') && (
        <>
          {status === 'rejected' && (
            <View style={styles.rejectedCard}>
              <AppText variant="label" weight="bold" color={Colors.error}>Why was it rejected?</AppText>
              <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.xs }}>
                Your ID could not be verified. Please re-upload a clear, unobstructed photo of a valid government ID and a matching selfie.
              </AppText>
            </View>
          )}

          <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionLabel}>
            STEP 1 — Government ID (Front)
          </AppText>
          <UploadSlot
            uri={frontSrc}
            label="Upload ID Front"
            hint="Passport, driver's license, or national ID"
            loading={uploading === 'front'}
            onPress={() => pickImage('front')}
          />

          <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionLabel}>
            STEP 2 — Selfie Holding ID
          </AppText>
          <UploadSlot
            uri={selfieSrc}
            label="Upload Selfie with ID"
            hint="Hold your ID next to your face, clearly visible"
            loading={uploading === 'selfie'}
            onPress={() => pickImage('selfie')}
          />

          <AppButton
            label={uploading === 'submit' ? 'Submitting…' : 'Submit for Verification'}
            onPress={handleSubmit}
            loading={uploading === 'submit'}
            style={{ marginTop: Spacing.xl }}
          />
        </>
      )}
    </ScrollView>
  );
}

function UploadSlot({
  uri, label, hint, loading, onPress,
}: {
  uri: string | null;
  label: string;
  hint: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={slotStyles.slot} onPress={onPress} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : uri ? (
        <>
          <Image source={{ uri }} style={slotStyles.preview} resizeMode="cover" />
          <View style={slotStyles.reuploadBadge}>
            <Feather name="refresh-cw" size={12} color={Colors.white} />
            <AppText variant="caption" color={Colors.white} style={{ marginLeft: 4 }}>Change</AppText>
          </View>
        </>
      ) : (
        <View style={slotStyles.placeholder}>
          <Feather name="upload" size={28} color={Colors.subtle} />
          <AppText variant="label" weight="semibold" color={Colors.ink} style={{ marginTop: Spacing.sm }}>
            {label}
          </AppText>
          <AppText variant="caption" color={Colors.muted} center style={{ marginTop: Spacing.xs }}>
            {hint}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const slotStyles = StyleSheet.create({
  slot: {
    height: 160,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  placeholder: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  reuploadBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  approvedCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  approvedText: {
    marginTop: Spacing.sm,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  pendingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  rejectedCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
});
