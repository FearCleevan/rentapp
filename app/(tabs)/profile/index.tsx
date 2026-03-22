//app/(tabs)/profile/index.tsx
import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { signOut } from '@/lib/supabase';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Mock profile data ────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  fullName:       'Juan dela Cruz',
  email:          'juan@example.com',
  phone:          '+63 912 345 6789',
  isVerified:     false,
  memberSince:    'March 2026',
  totalBookings:  4,
  totalListings:  2,
  avgRating:      4.8,
};

// ─── Settings menu items ──────────────────────────────────────────────────────

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'user',        label: 'Edit profile',         chevron: true  },
      { icon: 'shield',      label: 'Verify my ID',         chevron: true, badge: 'Required' },
      { icon: 'bell',        label: 'Notifications',        chevron: true  },
      { icon: 'lock',        label: 'Change password',      chevron: true  },
    ],
  },
  {
    title: 'Hosting',
    items: [
      { icon: 'home',        label: 'My listings',          chevron: true  },
      { icon: 'dollar-sign', label: 'Payout settings',     chevron: true  },
      { icon: 'bar-chart-2', label: 'Earnings history',    chevron: true  },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle', label: 'Help & FAQ',           chevron: true  },
      { icon: 'message-circle', label: 'Contact support',  chevron: true  },
      { icon: 'file-text',  label: 'Terms of Service',     chevron: true  },
      { icon: 'eye-off',    label: 'Privacy Policy',       chevron: true  },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <AppText variant="h2" weight="extrabold" center>{value}</AppText>
      <AppText variant="caption" color={Colors.muted} center style={{ marginTop: 2 }}>
        {label}
      </AppText>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  chevron,
  badge,
  right,
}: {
  icon:     string;
  label:    string;
  chevron?: boolean;
  badge?:   string;
  right?:   React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} activeOpacity={0.7}>
      <View style={styles.settingsIcon}>
        <Feather name={icon as any} size={16} color={Colors.muted} />
      </View>
      <AppText variant="label" weight="medium" style={{ flex: 1, marginLeft: Spacing.md }}>
        {label}
      </AppText>
      {badge && (
        <View style={styles.requiredBadge}>
          <AppText variant="caption" weight="bold" color={Colors.primary}>
            {badge}
          </AppText>
        </View>
      )}
      {right}
      {chevron && !right && (
        <Feather name="chevron-right" size={16} color={Colors.subtle} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router  = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);

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
            router.replace('/login');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Profile header ── */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <AppText
              weight="extrabold"
              color={Colors.white}
              style={{ fontSize: 28 }}
            >
              {MOCK_PROFILE.fullName.split(' ').map(n => n[0]).join('').slice(0,2)}
            </AppText>
            {/* Edit overlay */}
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Feather name="camera" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <AppText variant="h2" weight="extrabold" center style={{ marginTop: Spacing.md }}>
            {MOCK_PROFILE.fullName}
          </AppText>
          <AppText variant="body" color={Colors.muted} center>
            {MOCK_PROFILE.email}
          </AppText>
          <AppText variant="caption" color={Colors.subtle} center style={{ marginTop: 4 }}>
            Member since {MOCK_PROFILE.memberSince}
          </AppText>

          {/* Verification status */}
          {!MOCK_PROFILE.isVerified ? (
            <TouchableOpacity style={styles.verifyBanner} activeOpacity={0.85}>
              <Feather name="alert-circle" size={14} color="#854F0B" />
              <AppText
                variant="label"
                weight="bold"
                color="#854F0B"
                style={{ marginLeft: 6 }}
              >
                Verify your ID to unlock full access
              </AppText>
              <Feather
                name="chevron-right"
                size={14}
                color="#854F0B"
                style={{ marginLeft: 4 }}
              />
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

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatCard value={MOCK_PROFILE.totalBookings}  label="Bookings"  />
          <View style={styles.statDivider} />
          <StatCard value={MOCK_PROFILE.totalListings}  label="Listings"  />
          <View style={styles.statDivider} />
          <StatCard value={`★${MOCK_PROFILE.avgRating}`} label="Avg rating" />
        </View>

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
                  <SettingsItem
                    icon={item.icon}
                    label={item.label}
                    chevron={item.chevron}
                    badge={item.badge}
                    right={
                      item.label === 'Notifications' ? (
                        <Switch
                          value={pushEnabled}
                          onValueChange={setPushEnabled}
                          trackColor={{ false: Colors.border, true: Colors.teal }}
                          thumbColor={Colors.white}
                          style={{ marginLeft: Spacing.sm }}
                        />
                      ) : undefined
                    }
                  />
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
    borderRadius:      Radius.full,
    paddingVertical:   8,
    paddingHorizontal: 14,
    marginTop:         Spacing.md,
    borderWidth:       1,
    borderColor:       '#FDE68A',
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
    ...Shadow.sm,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statDivider: {
    width:           1,
    backgroundColor: Colors.border,
    marginVertical:  4,
  },

  sectionTitle: {
    marginBottom:    Spacing.sm,
    paddingLeft:     Spacing.xs,
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