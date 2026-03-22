//app/(tabs)/host/index.tsx
import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

const HOST_PROFILE = {
  name:      'Miguel',
  totalEarnings: 12450,
  monthEarnings: 3200,
  bookingsThisMonth: 6,
  activeListings: 3,
  responseRate: 98,
  isVerified: false,
};

const PENDING_REQUESTS = [
  {
    id:         'R001',
    renterName: 'Jessa Reyes',
    renterVerified: true,
    listing:    'Covered Parking · SM Lanang',
    dates:      'Mar 24 – Mar 24',
    time:       '8:00 AM – 5:00 PM',
    vehicle:    'Sedan · ABC 1234',
    amount:     880,
    hostEarns:  790,
    hoursLeft:  11,
    emoji:      '🅿️',
  },
  {
    id:         'R002',
    renterName: 'Paolo Cruz',
    renterVerified: false,
    listing:    'Toyota Vios 2022',
    dates:      'Mar 28 – Mar 29',
    time:       'Full day',
    vehicle:    null,
    amount:     3300,
    hostEarns:  2970,
    hoursLeft:  23,
    emoji:      '🚗',
  },
];

const MY_LISTINGS = [
  {
    id:       'L001',
    emoji:    '🅿️',
    title:    'Covered Parking · SM Lanang',
    price:    '₱80/hr',
    rating:   4.9,
    reviews:  38,
    status:   'active' as const,
    upcoming: 3,
  },
  {
    id:       'L002',
    emoji:    '🚗',
    title:    'Toyota Vios 2022 · Self-drive',
    price:    '₱1,500/day',
    rating:   4.7,
    reviews:  22,
    status:   'active' as const,
    upcoming: 1,
  },
  {
    id:       'L003',
    emoji:    '🏠',
    title:    'Private Room · Matina',
    price:    '₱800/night',
    rating:   0,
    reviews:  0,
    status:   'draft' as const,
    upcoming: 0,
  },
];

const QUICK_ACTIONS = [
  { icon: 'plus-circle', label: 'Add listing',    color: Colors.primaryLight, iconColor: Colors.primary },
  { icon: 'calendar',    label: 'Availability',   color: Colors.tealLight,    iconColor: Colors.teal    },
  { icon: 'bar-chart-2', label: 'Earnings',       color: '#EEEDFE',           iconColor: '#534AB7'      },
  { icon: 'message-circle', label: 'Messages',    color: '#FAEEDA',           iconColor: '#854F0B'      },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EarningsCard() {
  return (
    <View style={styles.earningsCard}>
      <View style={styles.earningsTop}>
        <View>
          <AppText variant="caption" weight="semibold" color="rgba(255,255,255,0.7)">
            THIS MONTH'S EARNINGS
          </AppText>
          <AppText
            variant="display"
            weight="extrabold"
            color={Colors.white}
            style={{ marginTop: 4 }}
          >
            ₱{HOST_PROFILE.monthEarnings.toLocaleString()}
          </AppText>
        </View>
        <View style={styles.earningsBadge}>
          <Feather name="trending-up" size={14} color={Colors.white} />
          <AppText
            variant="caption"
            weight="bold"
            color={Colors.white}
            style={{ marginLeft: 4 }}
          >
            +24%
          </AppText>
        </View>
      </View>

      <View style={styles.earningsStats}>
        {[
          { label: 'Bookings',     value: HOST_PROFILE.bookingsThisMonth },
          { label: 'Active lists', value: HOST_PROFILE.activeListings    },
          { label: 'Response %',  value: `${HOST_PROFILE.responseRate}%` },
        ].map(s => (
          <View key={s.label} style={styles.earningsStat}>
            <AppText
              variant="bodyLg"
              weight="extrabold"
              color={Colors.white}
            >
              {s.value}
            </AppText>
            <AppText
              variant="caption"
              color="rgba(255,255,255,0.65)"
              style={{ marginTop: 2 }}
            >
              {s.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function PendingCard({ item, onAccept, onDecline }: {
  item: typeof PENDING_REQUESTS[number];
  onAccept:  () => void;
  onDecline: () => void;
}) {
  return (
    <View style={[styles.requestCard]}>
      {/* Timer */}
      <View style={styles.requestHeader}>
        <View style={styles.renterRow}>
          <View style={styles.renterAvatar}>
            <AppText weight="bold" color={Colors.white} style={{ fontSize: 13 }}>
              {item.renterName.split(' ').map(n => n[0]).join('')}
            </AppText>
          </View>
          <View>
            <AppText variant="label" weight="bold">{item.renterName}</AppText>
            {item.renterVerified
              ? <AppText variant="caption" weight="bold" color={Colors.teal}>✓ ID Verified</AppText>
              : <AppText variant="caption" color={Colors.subtle}>Not yet verified</AppText>
            }
          </View>
        </View>
        <View style={styles.timerBadge}>
          <Feather name="clock" size={11} color="#854F0B" />
          <AppText
            variant="caption"
            weight="bold"
            color="#854F0B"
            style={{ marginLeft: 3 }}
          >
            {item.hoursLeft}h left
          </AppText>
        </View>
      </View>

      {/* Details */}
      <View style={styles.requestDetails}>
        <AppText style={{ fontSize: 20 }}>{item.emoji}</AppText>
        <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
          <AppText variant="label" weight="bold" numberOfLines={1}>
            {item.listing}
          </AppText>
          <AppText variant="caption" color={Colors.muted}>
            {item.dates} · {item.time}
          </AppText>
          {item.vehicle && (
            <AppText variant="caption" color={Colors.muted}>{item.vehicle}</AppText>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <AppText variant="label" color={Colors.muted}>
          Renter pays{' '}
          <AppText variant="label" weight="bold" color={Colors.ink}>
            ₱{item.amount.toLocaleString()}
          </AppText>
        </AppText>
        <AppText variant="label" weight="bold" color={Colors.teal}>
          You earn ₱{item.hostEarns.toLocaleString()}
        </AppText>
      </View>

      {/* Actions */}
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={onAccept}
          activeOpacity={0.85}
        >
          <Feather name="check" size={15} color={Colors.white} />
          <AppText
            variant="label"
            weight="bold"
            color={Colors.white}
            style={{ marginLeft: 5 }}
          >
            Accept
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={onDecline}
          activeOpacity={0.85}
        >
          <AppText variant="label" weight="bold" color={Colors.muted}>
            Decline
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ListingRow({ item, onToggle }: {
  item:     typeof MY_LISTINGS[number];
  onToggle: (active: boolean) => void;
}) {
  const [active, setActive] = useState(item.status === 'active');

  const statusCfg = {
    active: { label: 'Active', bg: Colors.tealLight,    text: Colors.teal    },
    paused: { label: 'Paused', bg: Colors.bg,           text: Colors.subtle  },
    draft:  { label: 'Draft',  bg: '#FAEEDA',           text: '#854F0B'      },
  };
  const cfg = statusCfg[active ? 'active' : item.status === 'draft' ? 'draft' : 'paused'];

  return (
    <TouchableOpacity style={styles.listingRow} activeOpacity={0.85}>
      <View style={styles.listingThumb}>
        <AppText style={{ fontSize: 26 }}>{item.emoji}</AppText>
      </View>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <AppText variant="label" weight="bold" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
          {item.price}
          {item.reviews > 0
            ? ` · ★${item.rating} (${item.reviews})`
            : ' · No reviews yet'}
        </AppText>
        <View style={styles.listingStatusRow}>
          <View style={[styles.listingStatusPill, { backgroundColor: cfg.bg }]}>
            <AppText variant="caption" weight="bold" color={cfg.text}>
              {cfg.label}
            </AppText>
          </View>
          {item.upcoming > 0 && (
            <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 8 }}>
              {item.upcoming} upcoming
            </AppText>
          )}
          {item.status === 'draft' && (
            <AppText variant="caption" color="#854F0B" style={{ marginLeft: 8 }}>
              Tap to publish
            </AppText>
          )}
        </View>
      </View>
      {item.status !== 'draft' && (
        <Switch
          value={active}
          onValueChange={(v) => { setActive(v); onToggle(v); }}
          trackColor={{ false: Colors.border, true: Colors.teal }}
          thumbColor={Colors.white}
          style={{ marginLeft: Spacing.sm }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HostScreen() {
  const [requests, setRequests] = useState(PENDING_REQUESTS);

  function handleAccept(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }
  function handleDecline(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <AppText variant="caption" color={Colors.muted}>Good morning,</AppText>
            <AppText variant="h2" weight="extrabold">
              {HOST_PROFILE.name} 👋
            </AppText>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={20} color={Colors.ink} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Verify banner */}
        {!HOST_PROFILE.isVerified && (
          <TouchableOpacity style={styles.verifyBanner} activeOpacity={0.85}>
            <Feather name="shield" size={18} color="#854F0B" />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <AppText variant="label" weight="bold" color="#92400E">
                Verify your ID to get more bookings
              </AppText>
              <AppText variant="caption" color="#A16207">
                Verified hosts get 3× more bookings — takes 2 mins
              </AppText>
            </View>
            <Feather name="chevron-right" size={18} color="#854F0B" />
          </TouchableOpacity>
        )}

        {/* Earnings card */}
        <EarningsCard />

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.qaBtn}
              activeOpacity={0.8}
            >
              <View style={[styles.qaIcon, { backgroundColor: a.color }]}>
                <Feather name={a.icon as any} size={18} color={a.iconColor} />
              </View>
              <AppText
                variant="caption"
                weight="semibold"
                color={Colors.muted}
                center
                style={{ marginTop: 5 }}
              >
                {a.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending requests */}
        {requests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <AppText variant="bodyLg" weight="bold">Pending requests</AppText>
              <View style={styles.countBadge}>
                <AppText variant="caption" weight="bold" color={Colors.white}>
                  {requests.length}
                </AppText>
              </View>
            </View>
            {requests.map(r => (
              <PendingCard
                key={r.id}
                item={r}
                onAccept={() => handleAccept(r.id)}
                onDecline={() => handleDecline(r.id)}
              />
            ))}
          </>
        )}

        {/* My listings */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodyLg" weight="bold">My listings</AppText>
          <TouchableOpacity>
            <AppText variant="label" weight="bold" color={Colors.primary}>
              Manage all
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.listingsCard}>
          {MY_LISTINGS.map((item, i) => (
            <View key={item.id}>
              {i > 0 && <View style={styles.listingDivider} />}
              <ListingRow item={item} onToggle={() => {}} />
            </View>
          ))}
        </View>

        {/* Add listing button */}
        <AppButton
          label="+ Add new listing"
          onPress={() => {}}
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.lg },

  greeting: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  notifBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
    ...Shadow.sm,
  },
  notifDot: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.primary,
    borderWidth:     2,
    borderColor:     Colors.white,
  },

  verifyBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFBEB',
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     '#FDE68A',
  },

  earningsCard: {
    backgroundColor: Colors.ink,
    borderRadius:    Radius.lg,
    padding:         Spacing.xl,
  },
  earningsTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.lg,
  },
  earningsBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.15)',
    borderRadius:      Radius.full,
    paddingVertical:   5,
    paddingHorizontal: 10,
  },
  earningsStats: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingTop:     Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  earningsStat: { alignItems: 'center' },

  quickActions: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  qaBtn: { alignItems: 'center', flex: 1 },
  qaIcon: {
    width:          52,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  countBadge: {
    backgroundColor:   Colors.primary,
    borderRadius:      Radius.full,
    width:             22,
    height:            22,
    alignItems:        'center',
    justifyContent:    'center',
    marginLeft:        Spacing.sm,
  },

  requestCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.amber,
    ...Shadow.sm,
  },
  requestHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.md,
  },
  renterRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  renterAvatar: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: '#534AB7',
    alignItems:      'center',
    justifyContent:  'center',
  },
  timerBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#FAEEDA',
    borderRadius:      Radius.full,
    paddingVertical:   4,
    paddingHorizontal: 10,
  },
  requestDetails: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.md,
  },
  amountRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   Spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  acceptBtn: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    backgroundColor:   Colors.teal,
    borderRadius:      Radius.md,
    paddingVertical:   12,
  },
  declineBtn: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    borderRadius:      Radius.md,
    paddingVertical:   12,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },

  listingsCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  listingRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
  },
  listingThumb: {
    width:           52,
    height:          52,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  listingStatusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     4,
  },
  listingStatusPill: {
    borderRadius:      Radius.full,
    paddingVertical:   2,
    paddingHorizontal: 8,
  },
  listingDivider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.lg,
  },
});