// app/(tabs)/profile/index.tsx
import { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useToast } from '@/components/ui/Toast';
import { signOut } from '@/lib/supabase';
import {
  fetchHostEarnings,
  fetchHostListingCount,
  fetchRenterBookingCount,
} from '@/lib/profileService';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Settings sections ────────────────────────────────────────────────────────

const GUEST_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'user', label: 'Edit profile', chevron: true },
      { icon: 'shield', label: 'Verify my ID', chevron: true, badge: true },
      { icon: 'bell', label: 'Notifications', isSwitch: true },
      { icon: 'lock', label: 'Change password', chevron: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help & FAQ', chevron: true },
      { icon: 'message-circle', label: 'Contact support', chevron: true },
      { icon: 'file-text', label: 'Terms of Service', chevron: true },
      { icon: 'eye-off', label: 'Privacy Policy', chevron: true },
    ],
  },
] as const;

const HOST_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'user', label: 'Edit profile', chevron: true },
      { icon: 'shield', label: 'Verify my ID', chevron: true, badge: true },
      { icon: 'bell', label: 'Notifications', isSwitch: true },
      { icon: 'lock', label: 'Change password', chevron: true },
    ],
  },
  {
    title: 'Hosting',
    items: [
      { icon: 'home', label: 'My listings', chevron: true },
      { icon: 'dollar-sign', label: 'Payout settings', chevron: true },
      { icon: 'bar-chart-2', label: 'Earnings history', chevron: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help & FAQ', chevron: true },
      { icon: 'message-circle', label: 'Contact support', chevron: true },
      { icon: 'file-text', label: 'Terms of Service', chevron: true },
      { icon: 'eye-off', label: 'Privacy Policy', chevron: true },
    ],
  },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <AppText variant="h2" weight="extrabold" center>{value}</AppText>
      <AppText variant="caption" color={Colors.muted} center style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </View>
  );
}

function handleNavigation(label: string) {
  switch (label) {
    case 'Edit profile':
      router.push('/profile/edit-profile');
      break;
    case 'Verify my ID':
      router.push('/profile/verify-id');
      break;
    case 'Notifications':
      router.push('/profile/notifications');
      break;
    case 'Change password':
      router.push('/profile/change-password');
      break;
    case 'Help & FAQ':
      router.push('/profile/help');
      break;
    case 'Contact support':
      router.push('/profile/support');
      break;
    case 'Terms of Service':
      router.push('/profile/terms');
      break;
    case 'Privacy Policy':
      router.push('/profile/privacy');
      break;

    case 'My listings':
      router.push('/profile/host/listings');
      break;
    case 'Payout settings':
      router.push('/profile/host/payouts');
      break;
    case 'Earnings history':
      router.push('/profile/host/earnings');
      break;
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const { reset, isLoading } = useAuthStore();
  const { profile, isUpdating, refresh, changeAvatar } = useProfile();

  const [pushEnabled,  setPushEnabled]  = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats,        setStats]        = useState({ bookings: 0, listings: 0, earnings: 0, rating: 0 });
  const [previewUri,   setPreviewUri]   = useState<string | null>(null);

  const isHost = (profile as any)?.is_host === true;
  const SECTIONS = isHost ? HOST_SECTIONS : GUEST_SECTIONS;

  useEffect(() => {
    if (profile?.id) loadStats();
  }, [profile?.id]);

  async function loadStats() {
    if (!profile?.id) return;
    setStatsLoading(true);
    const [bookingsRes, listingsRes, earningsRes] = await Promise.all([
      fetchRenterBookingCount(profile.id),
      fetchHostListingCount(profile.id),
      fetchHostEarnings(profile.id),
    ]);
    setStats({
      bookings: bookingsRes.count,
      listings: listingsRes.count,
      earnings: earningsRes.total,
      rating: profile.host_rating ?? 0,
    });
    setStatsLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refresh(), loadStats()]);
    setRefreshing(false);
  }

  async function handleAvatarPress() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Photo library permission is required.', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const localUri = result.assets[0].uri;
      setPreviewUri(localUri);           // show immediately — no waiting for upload
      const { error } = await changeAvatar(localUri);
      if (error) {
        setPreviewUri(null);             // revert on failure
        toast.show('Failed to update avatar. Please try again.', 'error');
      } else {
        setPreviewUri(null);             // store url now lives in profile; clear local preview
        toast.show('Profile photo updated!', 'success');
      }
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
          router.replace('/login');
        },
      },
    ]);
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isLoading || (!profile && isLoading)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centerState}>
          <AppText style={{ fontSize: 40 }}>👤</AppText>
          <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>
            Profile not found
          </AppText>
          <TouchableOpacity style={{ marginTop: Spacing.lg }} onPress={handleSignOut}>
            <AppText variant="label" weight="bold" color={Colors.error}>Sign out</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const fullName = profile.full_name ?? '';
  const initials = fullName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase();
  const isVerified = profile.is_verified ?? false;
  const verifyStatus = (profile as any).id_verification_status ?? 'none';
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatar} activeOpacity={0.85}>
            {isUpdating && !previewUri ? (
              <ActivityIndicator color={Colors.white} />
            ) : (previewUri ?? profile.avatar_url) ? (
              <Image
                key={previewUri ?? profile.avatar_url}
                source={{ uri: previewUri ?? profile.avatar_url! }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 28 }}>
                {initials}
              </AppText>
            )}
            <View style={styles.editAvatarBtn}>
              <Feather name="camera" size={12} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <AppText variant="h2" weight="extrabold" center style={{ marginTop: Spacing.md }}>
            {fullName}
          </AppText>

          {profile.bio ? (
            <AppText variant="caption" color={Colors.muted} center style={{ marginTop: 4, paddingHorizontal: Spacing.md }}>
              {profile.bio}
            </AppText>
          ) : null}

          <AppText variant="caption" color={Colors.subtle} center style={{ marginTop: 4 }}>
            Member since {memberSince}
          </AppText>

          {/* Host badge */}
          {isHost && (
            <View style={styles.hostBadge}>
              <Feather name="home" size={12} color={Colors.primary} />
              <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 5 }}>
                Host
              </AppText>
            </View>
          )}

          {/* Verification */}
          {!isVerified ? (
            <TouchableOpacity style={styles.verifyBanner} activeOpacity={0.85}>
              <Feather name="alert-circle" size={14} color="#854F0B" />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <AppText variant="label" weight="bold" color="#854F0B">
                  {verifyStatus === 'pending'
                    ? 'ID verification is under review'
                    : 'Verify your ID to unlock full access'}
                </AppText>
              </View>
              {verifyStatus === 'none' && <Feather name="chevron-right" size={14} color="#854F0B" />}
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedBanner}>
              <Feather name="check-circle" size={14} color={Colors.teal} />
              <AppText variant="label" weight="bold" color={Colors.teal} style={{ marginLeft: 6 }}>
                ID Verified
              </AppText>
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {statsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
          ) : isHost ? (
            <>
              <StatCard value={stats.bookings} label="Bookings" />
              <View style={styles.statDivider} />
              <StatCard value={stats.listings} label="Listings" />
              <View style={styles.statDivider} />
              <StatCard value={stats.rating > 0 ? `★${stats.rating.toFixed(1)}` : '—'} label="Rating" />
            </>
          ) : (
            <>
              <StatCard value={stats.bookings} label="Bookings" />
              <View style={styles.statDivider} />
              <StatCard value="Guest" label="Account" />
              <View style={styles.statDivider} />
              <StatCard value={isVerified ? '✓' : '—'} label="Verified" />
            </>
          )}
        </View>

        {/* ── Earnings (host only) ── */}
        {isHost && stats.earnings > 0 && (
          <View style={styles.earningsBanner}>
            <Feather name="trending-up" size={16} color={Colors.teal} />
            <AppText variant="label" weight="bold" color={Colors.teal} style={{ marginLeft: 6 }}>
              Total earned: ₱{stats.earnings.toLocaleString()}
            </AppText>
          </View>
        )}

        {/* ── Become a Host card (guest only) ── */}
        {!isHost && (
          <TouchableOpacity
            style={styles.becomeHostCard}
            onPress={() => router.push('/become-host')}
            activeOpacity={0.88}
          >
            <View style={styles.becomeHostLeft}>
              <AppText style={{ fontSize: 36 }}>🏠</AppText>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <AppText variant="label" weight="extrabold">Become a Host</AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                Earn extra income from your parking, room, vehicle, or equipment.
              </AppText>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* ── Settings sections ── */}
        {SECTIONS.map(section => (
          <View key={section.title}>
            <AppText variant="overline" weight="bold" color={Colors.subtle} style={styles.sectionTitle}>
              {section.title}
            </AppText>
            <View style={styles.settingsCard}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <View style={styles.itemDivider} />}
                  <TouchableOpacity
                    style={styles.settingsItem}
                    activeOpacity={'isSwitch' in item && item.isSwitch ? 1 : 0.7}
                    onPress={() => {
                      if (!('isSwitch' in item && item.isSwitch)) {
                        handleNavigation(item.label);
                      }
                    }}
                  >
                    <View style={styles.settingsIcon}>
                      <Feather name={item.icon as any} size={16} color={Colors.muted} />
                    </View>
                    <AppText variant="label" weight="medium" style={{ flex: 1, marginLeft: Spacing.md }}>
                      {item.label}
                    </AppText>

                    {'badge' in item && item.badge && !isVerified && (
                      <View style={styles.requiredBadge}>
                        <AppText variant="caption" weight="bold" color={Colors.primary}>Required</AppText>
                      </View>
                    )}

                    {'isSwitch' in item && item.isSwitch ? (
                      <Switch
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                        trackColor={{ false: Colors.border, true: Colors.teal }}
                        thumbColor={Colors.white}
                        style={{ marginLeft: Spacing.sm }}
                      />
                    ) : (
                      !('badge' in item && item.badge && !isVerified) &&
                      <Feather name="chevron-right" size={16} color={Colors.subtle} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={Colors.error} />
          <AppText variant="label" weight="bold" color={Colors.error} style={{ marginLeft: Spacing.sm }}>
            Sign out
          </AppText>
        </TouchableOpacity>

        <AppText variant="caption" color={Colors.subtle} center style={{ marginTop: Spacing.sm }}>
          Rentapp v1.0.0
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.lg },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  profileHeader: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: Spacing.md,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: 72,
    ...Shadow.sm,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  earningsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tealLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },

  becomeHostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    ...Shadow.sm,
  },
  becomeHostLeft: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },

  sectionTitle: { marginBottom: Spacing.sm, paddingLeft: Spacing.xs },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  requiredBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: Spacing.sm,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    ...Shadow.sm,
  },
});