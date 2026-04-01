import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { uploadGovId, submitIdVerification } from '@/lib/profileService';
import { useAuthStore } from '@/store/authStore';

// ─── ID type config ───────────────────────────────────────────────────────────

interface IdType {
  id:           string;
  label:        string;
  requiresBack: boolean;
}

const ID_TYPES: IdType[] = [
  { id: 'philsys',         label: 'PhilSys (National ID)',  requiresBack: false },
  { id: 'passport',        label: 'Passport',               requiresBack: false },
  { id: 'drivers_license', label: "Driver's License",       requiresBack: true  },
  { id: 'umid',            label: 'UMID Card',              requiresBack: true  },
  { id: 'postal',          label: 'Postal ID',              requiresBack: true  },
  { id: 'voters',          label: "Voter's ID",             requiresBack: false },
  { id: 'sss',             label: 'SSS Card',               requiresBack: true  },
  { id: 'prc',             label: 'PRC ID',                 requiresBack: true  },
  { id: 'tin',             label: 'TIN ID',                 requiresBack: false },
];

// ─── Status config ────────────────────────────────────────────────────────────

type VerifStatus = 'none' | 'pending' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<VerifStatus, { label: string; color: string; bg: string; icon: string }> = {
  none:     { label: 'Not Verified',        color: Colors.muted,   bg: Colors.bg,         icon: 'shield'   },
  pending:  { label: 'Under Review',        color: Colors.primary, bg: Colors.primaryLight, icon: 'clock'  },
  approved: { label: 'Verified',            color: Colors.teal,    bg: Colors.tealLight,  icon: 'shield'   },
  rejected: { label: 'Verification Failed', color: Colors.error,   bg: Colors.errorLight, icon: 'x-circle' },
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function VerifyIDScreen() {
  const toast  = useToast();
  const user   = useAuthStore(s => s.user);
  const { profile, refresh } = useProfile();

  const [selectedTypeId, setSelectedTypeId]   = useState<string | null>(null);
  const [showPicker,     setShowPicker]        = useState(false);

  // Local previews — shown immediately on pick (before upload completes)
  const [frontPreview,  setFrontPreview]  = useState<string | null>(null);
  const [backPreview,   setBackPreview]   = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Upload progress
  const [uploading, setUploading] = useState<'front' | 'back' | 'selfie' | 'submit' | null>(null);

  const status       = (profile?.id_verification_status ?? 'none') as VerifStatus;
  const cfg          = STATUS_CONFIG[status];
  const selectedType = ID_TYPES.find(t => t.id === selectedTypeId) ?? null;

  // ── Image picker helper ──────────────────────────────────────────────────

  async function pickImage(
    slot:   'front' | 'back' | 'selfie',
    source: 'gallery' | 'camera',
  ) {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { toast.show('Camera permission required', 'error'); return; }
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { toast.show('Photo library permission required', 'error'); return; }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    };

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;

    // Optimistic preview — show immediately
    if (slot === 'front')  setFrontPreview(uri);
    if (slot === 'back')   setBackPreview(uri);
    if (slot === 'selfie') setSelfiePreview(uri);

    if (!user) return;
    setUploading(slot);

    const { error } = await uploadGovId(user.id, uri, slot);
    setUploading(null);

    if (error) {
      // Revert preview on failure
      if (slot === 'front')  setFrontPreview(null);
      if (slot === 'back')   setBackPreview(null);
      if (slot === 'selfie') setSelfiePreview(null);
      toast.show('Upload failed. Please try again.', 'error');
    } else {
      toast.show('Image saved!', 'success');
      refresh();
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedTypeId) {
      toast.show('Please select your ID type first.', 'error');
      return;
    }
    const hasFront  = frontPreview  || profile?.gov_id_url;
    const hasBack   = !selectedType?.requiresBack || backPreview;
    const hasSelfie = selfiePreview || profile?.gov_id_selfie_url;

    if (!hasFront)  { toast.show('Please upload the front of your ID.',    'error'); return; }
    if (!hasBack)   { toast.show('Please upload the back of your ID.',     'error'); return; }
    if (!hasSelfie) { toast.show('Please upload your selfie with your ID.', 'error'); return; }

    if (!user) return;
    setUploading('submit');
    const { error } = await submitIdVerification(user.id);
    setUploading(null);

    if (error) toast.show(error.message, 'error');
    else { toast.show('Submitted for review!', 'success'); refresh(); }
  }

  // ── Derived display URIs ──────────────────────────────────────────────────

  const frontSrc  = frontPreview  || profile?.gov_id_url          || null;
  const selfieSrc = selfiePreview || profile?.gov_id_selfie_url   || null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Status banner ── */}
      <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon as any} size={18} color={cfg.color} />
        <AppText variant="label" weight="bold" color={cfg.color} style={{ marginLeft: Spacing.sm }}>
          {cfg.label}
        </AppText>
      </View>

      {/* ── Approved ── */}
      {status === 'approved' && (
        <View style={styles.approvedCard}>
          <Feather name="check-circle" size={52} color={Colors.teal} />
          <AppText variant="h3" weight="bold" style={{ marginTop: Spacing.md }}>
            Identity Verified
          </AppText>
          <AppText style={styles.bodyMuted}>
            Your government ID has been verified. You now have a verified badge on your profile.
          </AppText>
        </View>
      )}

      {/* ── Pending ── */}
      {status === 'pending' && (
        <View style={styles.pendingCard}>
          <View style={styles.pendingIconRow}>
            <View style={styles.pendingSpinner}>
              <Feather name="clock" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <AppText variant="label" weight="bold">Verification In Progress</AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                Our team is reviewing your documents. You'll be notified within 1–2 business days.
              </AppText>
            </View>
          </View>

          <View style={styles.pendingStep}>
            <PendingRow icon="check" label="Documents submitted" done />
            <PendingRow icon="loader" label="Under manual review" />
            <PendingRow icon="shield" label="Verification complete" />
          </View>
        </View>
      )}

      {/* ── None / Rejected — submission form ── */}
      {(status === 'none' || status === 'rejected') && (
        <>
          {status === 'rejected' && (
            <View style={styles.rejectedCard}>
              <AppText variant="label" weight="bold" color={Colors.error}>
                Why was my submission rejected?
              </AppText>
              <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.xs }}>
                Your ID could not be verified. Please re-upload clear, unobstructed photos. Make sure all details are readable and there is no glare.
              </AppText>
            </View>
          )}

          {/* ── Step 0: ID Type selector ── */}
          <AppText variant="label" weight="bold" color={Colors.muted} style={styles.stepLabel}>
            STEP 1 — SELECT ID TYPE
          </AppText>

          <TouchableOpacity
            style={[styles.dropdownBtn, selectedTypeId ? styles.dropdownBtnActive : null]}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <Feather name="credit-card" size={16} color={selectedTypeId ? Colors.primary : Colors.subtle} />
            <AppText
              variant="label"
              weight={selectedTypeId ? 'semibold' : 'medium'}
              color={selectedTypeId ? Colors.ink : Colors.placeholder}
              style={{ flex: 1, marginLeft: Spacing.sm }}
            >
              {selectedType ? selectedType.label : 'Select your ID type…'}
            </AppText>
            <Feather name="chevron-down" size={16} color={Colors.subtle} />
          </TouchableOpacity>

          {/* ── Step 1: Front ── */}
          {selectedTypeId && (
            <>
              <AppText variant="label" weight="bold" color={Colors.muted} style={styles.stepLabel}>
                STEP 2 — ID FRONT
              </AppText>
              <IdSlot
                uri={frontSrc}
                loading={uploading === 'front'}
                label="Upload Front of ID"
                hint="Ensure all text and photo are clearly visible"
                onUpload={() => pickImage('front', 'gallery')}
              />

              {/* ── Step 2: Back (dynamic) ── */}
              {selectedType?.requiresBack && (
                <>
                  <AppText variant="label" weight="bold" color={Colors.muted} style={styles.stepLabel}>
                    STEP 3 — ID BACK
                  </AppText>
                  <IdSlot
                    uri={backPreview}
                    loading={uploading === 'back'}
                    label="Upload Back of ID"
                    hint="Ensure the barcode / signature strip is visible"
                    onUpload={() => pickImage('back', 'gallery')}
                  />
                </>
              )}

              {/* ── Step 3 / 4: Selfie ── */}
              <AppText variant="label" weight="bold" color={Colors.muted} style={styles.stepLabel}>
                {selectedType?.requiresBack ? 'STEP 4' : 'STEP 3'} — SELFIE HOLDING ID
              </AppText>
              <SelfieSlot
                uri={selfieSrc}
                loading={uploading === 'selfie'}
                onUpload={() => pickImage('selfie', 'gallery')}
                onCapture={() => pickImage('selfie', 'camera')}
              />

              <AppButton
                label={uploading === 'submit' ? 'Submitting…' : 'Submit for Verification'}
                onPress={handleSubmit}
                loading={uploading === 'submit'}
                style={{ marginTop: Spacing.lg }}
              />
            </>
          )}
        </>
      )}

      {/* ── ID Type picker modal ── */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <AppText variant="h3" weight="bold" style={styles.modalTitle}>
              Select ID Type
            </AppText>

            <FlatList
              data={ID_TYPES}
              keyExtractor={t => t.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedTypeId === item.id && styles.modalItemActive]}
                  onPress={() => { setSelectedTypeId(item.id); setShowPicker(false); }}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" weight="semibold">{item.label}</AppText>
                    <AppText variant="caption" color={Colors.muted}>
                      {item.requiresBack ? 'Front & Back required' : 'Front only'}
                    </AppText>
                  </View>
                  {selectedTypeId === item.id && (
                    <Feather name="check" size={16} color={Colors.teal} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PendingRow({ icon, label, done }: { icon: string; label: string; done?: boolean }) {
  return (
    <View style={pendingRowStyles.row}>
      <View style={[pendingRowStyles.dot, done && pendingRowStyles.dotDone]}>
        <Feather name={icon as any} size={12} color={done ? Colors.white : Colors.muted} />
      </View>
      <AppText
        variant="label"
        weight={done ? 'semibold' : 'regular'}
        color={done ? Colors.ink : Colors.muted}
        style={{ marginLeft: Spacing.sm }}
      >
        {label}
      </AppText>
    </View>
  );
}

const pendingRowStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  dot:     { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.teal },
});

// ── ID slot (front / back) ────────────────────────────────────────────────────

function IdSlot({
  uri, loading, label, hint, onUpload,
}: {
  uri: string | null;
  loading: boolean;
  label: string;
  hint: string;
  onUpload: () => void;
}) {
  return (
    <TouchableOpacity style={slotStyles.slot} onPress={onUpload} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : uri ? (
        <>
          <Image
            key={uri}
            source={{ uri }}
            style={slotStyles.preview}
            contentFit="cover"
            cachePolicy="none"
          />
          <View style={slotStyles.changeBadge}>
            <Feather name="refresh-cw" size={11} color={Colors.white} />
            <AppText variant="caption" color={Colors.white} style={{ marginLeft: 4 }}>Change</AppText>
          </View>
        </>
      ) : (
        <View style={slotStyles.placeholder}>
          <View style={slotStyles.uploadIcon}>
            <Feather name="upload" size={22} color={Colors.primary} />
          </View>
          <AppText variant="label" weight="semibold" style={{ marginTop: Spacing.sm }}>{label}</AppText>
          <AppText variant="caption" color={Colors.muted} center style={{ marginTop: 4 }}>{hint}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Selfie slot (upload + capture) ───────────────────────────────────────────

function SelfieSlot({
  uri, loading, onUpload, onCapture,
}: {
  uri: string | null;
  loading: boolean;
  onUpload: () => void;
  onCapture: () => void;
}) {
  if (loading) {
    return (
      <View style={selfieStyles.container}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (uri) {
    return (
      <View style={selfieStyles.container}>
        <Image
          key={uri}
          source={{ uri }}
          style={selfieStyles.preview}
          contentFit="cover"
          cachePolicy="none"
        />
        <View style={selfieStyles.actions}>
          <TouchableOpacity style={selfieStyles.actionBtn} onPress={onUpload} activeOpacity={0.8}>
            <Feather name="image" size={14} color={Colors.primary} />
            <AppText variant="caption" weight="semibold" color={Colors.primary} style={{ marginLeft: 4 }}>
              Upload New
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity style={selfieStyles.actionBtn} onPress={onCapture} activeOpacity={0.8}>
            <Feather name="camera" size={14} color={Colors.primary} />
            <AppText variant="caption" weight="semibold" color={Colors.primary} style={{ marginLeft: 4 }}>
              Retake
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={selfieStyles.container}>
      <View style={selfieStyles.placeholder}>
        <Feather name="user" size={32} color={Colors.subtle} />
        <AppText variant="label" weight="semibold" style={{ marginTop: Spacing.sm }}>
          Selfie Holding Your ID
        </AppText>
        <AppText variant="caption" color={Colors.muted} center style={{ marginTop: 4, marginBottom: Spacing.lg }}>
          Hold the ID next to your face so both are clearly visible
        </AppText>
      </View>

      <View style={selfieStyles.btnRow}>
        <TouchableOpacity style={selfieStyles.halfBtn} onPress={onUpload} activeOpacity={0.8}>
          <Feather name="image" size={18} color={Colors.primary} />
          <AppText variant="label" weight="semibold" color={Colors.primary} style={{ marginTop: 4 }}>
            Upload Photo
          </AppText>
          <AppText variant="caption" color={Colors.muted}>From gallery</AppText>
        </TouchableOpacity>

        <View style={selfieStyles.btnDivider} />

        <TouchableOpacity style={selfieStyles.halfBtn} onPress={onCapture} activeOpacity={0.8}>
          <Feather name="camera" size={18} color={Colors.teal} />
          <AppText variant="label" weight="semibold" color={Colors.teal} style={{ marginTop: 4 }}>
            Take a Photo
          </AppText>
          <AppText variant="caption" color={Colors.muted}>Open camera</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const slotStyles = StyleSheet.create({
  slot: {
    height: 170,
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
  placeholder: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { width: '100%', height: '100%' },
  changeBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
});

const selfieStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  placeholder: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  preview: { width: '100%', height: 200 },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  halfBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  btnDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
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
  bodyMuted: {
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
  pendingIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pendingSpinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingStep: { gap: 0 },
  rejectedCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  stepLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  dropdownBtnActive: {
    borderColor: Colors.primary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing['5xl'],
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  modalItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xl,
  },
});
