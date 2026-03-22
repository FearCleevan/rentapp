// app/(tabs)/profile/index.tsx
import { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

import { AppText }    from '@/components/ui/AppText';
import { useToast }   from '@/components/ui/Toast';
import { signOut }    from '@/lib/supabase';
import {
  fetchHostEarnings,
  fetchHostListingCount,
  fetchRenterBookingCount,
} from '@/lib/profileService';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Settings sections ────────────────────────────────────────────────────────

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'user',           label: 'Edit profile',      chevron: true                },
      { icon: 'shield',         label: 'Verify my ID',      chevron: true, badge: 'Required' },
      { icon: 'bell',           label: 'Notifications',     chevron: false, isSwitch: true },
      { icon: 'lock',           label: 'Change password',   chevron: true                },
    ],
  },
  {
    title: 'Hosting',
    items: [
      { icon: 'home',           label: 'My listings',       chevron: true },
      { icon: 'dollar-sign',    label: 'Payout settings',  chevron: true },
      { icon: 'bar-chart-2',    label: 'Earnings history', chevron: true },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle',    label: 'Help & FAQ',        chevron: true },
      { icon: 'message-circle', label: 'Contact support',  chevron: true },
      { icon: 'file-text',      label: 'Terms of Service', chevron: true },
      { icon: 'eye-off',        label: 'Privacy Policy',   chevron: true },
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

function AvatarSection({
  initials,
  avatarUrl,
  onPress,
  uploading,
}: {
  initials:  string;
  avatarUrl: string | null;
  onPress:   () => void;
  uploading: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.avatar} activeOpacity={0.85}>
      {uploading ? (
        <ActivityIndicator color={Colors.white} />
      ) : avatarUrl ? (
        // When you add expo-image later, swap this for <Image source={{ uri: avatarUrl }} />
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 28 }}>
          {initials}
        </AppText>
      ) : (
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 28 }}>
          {initials}
        </AppText>
      )}
      <View style={styles.editAvatarBtn}>
        <Feather name="camera" size={12} color={Colors.white} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router    = useRouter();
  const toast     = useToast();
  const { reset } = useAuthStore();
  const { profile, isUpdating, refresh, changeAvatar } = useProfile();

  const [pushEnabled,    setPushEnabled]    = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [statsLoading,   setStatsLoading]   = useState(true);

  // Live stats fetched from DB (more accurate than denormalized values)
  const [stats, setStats] = useState({
    bookings:  0,
    listings:  0,
    earnings:  0,
    rating:    0,
  });

  // ── Load live stats ────────────────────────────────────────────────────────
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
      rating:   profile.host_rating ?? 0,
    });
    setStatsLoading(false);
  }

  // ── Pull to refresh ────────────────────────────────────────────────────────
  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refresh(), loadStats()]);
    setRefreshing(false);
  }

  // ── Avatar picker ──────────────────────────────────────────────────────────
  async function handleAvatarPress() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.show('Photo library permission is required.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect:        [1, 1],
      quality:       0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const { error } = await changeAvatar(result.assets[0].uri);
      if (error) {
        toast.show('Failed to update avatar. Please try again.', 'error');
      } else {
        toast.show('Profile photo updated!', 'success');
      }
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:  'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            reset();
            router.replace('/login');
          },
        },
      ]
    );
  }

  // ── Derived display values ─────────────────────────────────────────────────
  const fullName    = profile?.full_name  ?? 'Loading…';
  const email       = ''; // not stored in profiles — comes from auth.users
  const initials    = fullName
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isVerified  = profile?.is_verified ?? false;
  const verifyStatus = profile?.id_verification_status ?? 'none';

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    : '—';

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>
            Loading profile…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >

        {/* ── Profile header card ── */}
        <View style={styles.profileHeader}>
          <AvatarSection
            initials={initials}
            avatarUrl={profile.avatar_url}
            onPress={handleAvatarPress}
            uploading={isUpdating}
          />

          <AppText
            variant="h2"
            weight="extrabold"
            center
            style={{ marginTop: Spacing.md }}
          >
            {fullName}
          </AppText>

          {profile.bio ? (
            <AppText
              variant="caption"
              color={Colors.muted}
              center
              style={{ marginTop: 4, paddingHorizontal: Spacing.md }}
            >
              {profile.bio}
            </AppText>
          ) : null}

          <AppText
            variant="caption"
            color={Colors.subtle}
            center
            style={{ marginTop: 4 }}
          >
            Member since {memberSince}
          </AppText>

          {/* Verification banner */}
          {!isVerified ? (
            <TouchableOpacity style={styles.verifyBanner} activeOpacity={0.85}>
              <Feather name="alert-circle" size={14} color="#854F0B" />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <AppText variant="label" weight="bold" color="#854F0B">
                  {verifyStatus === 'pending'
                    ? 'ID verification is under review'
                    : 'Verify your ID to unlock full access'}
                </AppText>
                {verifyStatus === 'none' && (
                  <AppText variant="caption" color="#A16207">
                    Takes only 2 minutes — gets you 3× more bookings
                  </AppText>
                )}
              </View>
              {verifyStatus === 'none' && (
                <Feather name="chevron-right" size={14} color="#854F0B" />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.verifiedBanner}>
              <Feather name="check-circle" size={14} color={Colors.teal} />
              <AppText
                variant="label"
                weight="bold"
                color={Colors.teal}
                style={{ marginLeft: 6 }}
              >
                ID Verified
              </AppText>
            </View>
          )}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {statsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
          ) : (
            <>
              <StatCard value={stats.bookings}  label="Bookings"  />
              <View style={styles.statDivider} />
              <StatCard value={stats.listings}  label="Listings"  />
              <View style={styles.statDivider} />
              <StatCard
                value={stats.rating > 0 ? `★${stats.rating.toFixed(1)}` : '—'}
                label="Avg rating"
              />
            </>
          )}
        </View>

        {/* ── Earnings chip (only if host has earnings) ── */}
        {stats.earnings > 0 && (
          <View style={styles.earningsBanner}>
            <Feather name="trending-up" size={16} color={Colors.teal} />
            <AppText variant="label" weight="bold" color={Colors.teal} style={{ marginLeft: 6 }}>
              Total earned: ₱{stats.earnings.toLocaleString()}
            </AppText>
          </View>
        )}

        {/* ── Settings sections ── */}
        {SETTINGS_SECTIONS.map(section => (
          <View key={section.title}>
            <AppText
              variant="overline"
              weight="bold"
              color={Colors.subtle}
              style={styles.sectionTitle}
            >
              {section.title}
            </AppText>
            <View style={styles.settingsCard}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  {i > 0 && <View style={styles.itemDivider} />}
                  <TouchableOpacity
                    style={styles.settingsItem}
                    activeOpacity={'isSwitch' in item && item.isSwitch ? 1 : 0.7}
                  >
                    <View style={styles.settingsIcon}>
                      <Feather name={item.icon as any} size={16} color={Colors.muted} />
                    </View>
                    <AppText
                      variant="label"
                      weight="medium"
                      style={{ flex: 1, marginLeft: Spacing.md }}
                    >
                      {item.label}
                    </AppText>

                    {'badge' in item && item.badge && !isVerified && (
                      <View style={styles.requiredBadge}>
                        <AppText variant="caption" weight="bold" color={Colors.primary}>
                          {item.badge}
                        </AppText>
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
                      <Feather name="chevron-right" size={16} color={Colors.subtle} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color={Colors.error} />
          <AppText
            variant="label"
            weight="bold"
            color={Colors.error}
            style={{ marginLeft: Spacing.sm }}
          >
            Sign out
          </AppText>
        </TouchableOpacity>

        <AppText
          variant="caption"
          color={Colors.subtle}
          center
          style={{ marginTop: Spacing.sm }}
        >
          Rentapp v1.0.0
        </AppText>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    padding:       Spacing.xl,
    paddingBottom: Spacing['5xl'],
    gap:           Spacing.lg,
  },
  loadingState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  profileHeader: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.xl,
    alignItems:      'center',
    ...Shadow.sm,
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  editAvatarBtn: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: Colors.ink,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     Colors.white,
  },

  verifyBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#FFFBEB',
    borderRadius:      Radius.md,
    paddingVertical:   10,
    paddingHorizontal: 14,
    marginTop:         Spacing.md,
    borderWidth:       1,
    borderColor:       '#FDE68A',
    width:             '100%',
  },
  verifiedBanner: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.tealLight,
    borderRadius:      Radius.full,
    paddingVertical:   8,
    paddingHorizontal: 14,
    marginTop:         Spacing.md,
  },

  statsRow: {
    flexDirection:   'row',
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    alignItems:      'center',
    minHeight:       72,
    ...Shadow.sm,
  },
  statCard:    { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  earningsBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },

  sectionTitle: {
    marginBottom: Spacing.sm,
    paddingLeft:  Spacing.xs,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  settingsItem: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
  },
  settingsIcon: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  itemDivider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.lg,
  },
  requiredBadge: {
    backgroundColor:   Colors.primaryLight,
    borderRadius:      Radius.full,
    paddingVertical:   3,
    paddingHorizontal: 8,
    marginRight:       Spacing.sm,
  },

  signOutBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.lg,
    borderWidth:     1.5,
    borderColor:     Colors.error,
    ...Shadow.sm,
  },
});