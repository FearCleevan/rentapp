//app/(tabs)/bookings/index.tsx
import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

const BOOKINGS = [
  {
    id:         'B001',
    status:     'confirmed',
    category:   'parking',
    title:      'Covered Parking · SM Lanang',
    location:   'JP Laurel Ave, Bajada',
    startDate:  'Mar 24, 2026',
    endDate:    'Mar 24, 2026',
    time:       '8:00 AM – 5:00 PM',
    total:      880,
    hostName:   'Miguel R.',
    emoji:      '🅿️',
    vehiclePlate: 'ABC 1234',
  },
  {
    id:         'B002',
    status:     'pending_payment',
    category:   'vehicle',
    title:      'Toyota Vios 2022 · Self-drive',
    location:   'Matina, Davao City',
    startDate:  'Mar 26, 2026',
    endDate:    'Mar 27, 2026',
    time:       'Full day',
    total:      3300,
    hostName:   'Ana S.',
    emoji:      '🚗',
    vehiclePlate: null,
  },
  {
    id:         'B003',
    status:     'completed',
    category:   'room',
    title:      'Private Room · Poblacion',
    location:   'Claveria St, Davao City',
    startDate:  'Mar 15, 2026',
    endDate:    'Mar 17, 2026',
    time:       '2 nights',
    total:      1760,
    hostName:   'Carlo M.',
    emoji:      '🏠',
    vehiclePlate: null,
  },
  {
    id:         'B004',
    status:     'cancelled',
    category:   'equipment',
    title:      'Sony A7III Camera Kit',
    location:   'Buhangin, Davao City',
    startDate:  'Mar 10, 2026',
    endDate:    'Mar 10, 2026',
    time:       '1 day',
    total:      1320,
    hostName:   'Nico P.',
    emoji:      '📷',
    vehiclePlate: null,
  },
];

type TabType = 'upcoming' | 'past';

const STATUS_CONFIG = {
  confirmed:       { label: 'Confirmed',       bg: Colors.tealLight,    text: Colors.teal,    icon: 'check-circle'  },
  pending_payment: { label: 'Pay Now',          bg: '#FAEEDA',           text: '#854F0B',      icon: 'clock'         },
  active:          { label: 'Active',           bg: Colors.primaryLight, text: Colors.primary, icon: 'zap'           },
  completed:       { label: 'Completed',        bg: '#F1EFE8',           text: '#5F5E5A',      icon: 'check'         },
  cancelled:       { label: 'Cancelled',        bg: '#FCEBEB',           text: '#A32D2D',      icon: 'x-circle'      },
  disputed:        { label: 'Disputed',         bg: '#FAECE7',           text: '#712B13',      icon: 'alert-triangle'},
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed;
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Feather name={cfg.icon as any} size={11} color={cfg.text} />
      <AppText
        variant="caption"
        weight="bold"
        color={cfg.text}
        style={{ marginLeft: 4 }}
      >
        {cfg.label}
      </AppText>
    </View>
  );
}

function BookingCard({ item }: { item: typeof BOOKINGS[number] }) {
  const isPast = item.status === 'completed' || item.status === 'cancelled';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.emojiBox, { opacity: isPast ? 0.6 : 1 }]}>
          <AppText style={{ fontSize: 28 }}>{item.emoji}</AppText>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <AppText
            variant="label"
            weight="bold"
            numberOfLines={1}
            style={{ marginBottom: 3 }}
          >
            {item.title}
          </AppText>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={11} color={Colors.subtle} />
            <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
              {item.location}
            </AppText>
          </View>
        </View>
        <StatusPill status={item.status as any} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Feather name="calendar" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {item.startDate}
            {item.endDate !== item.startDate ? ` – ${item.endDate}` : ''}
          </AppText>
        </View>
        <View style={styles.detailItem}>
          <Feather name="clock" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {item.time}
          </AppText>
        </View>
      </View>

      {item.vehiclePlate && (
        <View style={[styles.detailItem, { marginTop: Spacing.xs }]}>
          <Feather name="truck" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {item.vehiclePlate}
          </AppText>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View>
          <AppText variant="caption" color={Colors.subtle}>Total paid</AppText>
          <AppText variant="bodyLg" weight="extrabold">
            ₱{item.total.toLocaleString()}
          </AppText>
        </View>
        <View style={styles.actionRow}>
          {item.status === 'pending_payment' && (
            <TouchableOpacity style={styles.payBtn} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.white}>
                Pay now
              </AppText>
            </TouchableOpacity>
          )}
          {item.status === 'confirmed' && (
            <TouchableOpacity style={styles.msgBtn} activeOpacity={0.85}>
              <Feather name="message-circle" size={14} color={Colors.primary} />
              <AppText
                variant="label"
                weight="bold"
                color={Colors.primary}
                style={{ marginLeft: 4 }}
              >
                Message host
              </AppText>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && (
            <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85}>
              <Feather name="star" size={14} color={Colors.amber} />
              <AppText
                variant="label"
                weight="bold"
                color={Colors.amber}
                style={{ marginLeft: 4 }}
              >
                Leave review
              </AppText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.detailBtn} activeOpacity={0.85}>
            <AppText variant="label" weight="bold" color={Colors.muted}>
              Details
            </AppText>
            <Feather name="chevron-right" size={14} color={Colors.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BookingsScreen() {
  const [tab, setTab] = useState<TabType>('upcoming');

  const upcoming = BOOKINGS.filter(
    b => b.status === 'confirmed' || b.status === 'pending_payment' || b.status === 'active'
  );
  const past = BOOKINGS.filter(
    b => b.status === 'completed' || b.status === 'cancelled'
  );
  const data = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="extrabold">My Bookings</AppText>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {(['upcoming', 'past'] as TabType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <AppText
                variant="label"
                weight="bold"
                color={tab === t ? Colors.primary : Colors.muted}
              >
                {t === 'upcoming'
                  ? `Upcoming (${upcoming.length})`
                  : `Past (${past.length})`}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {data.length === 0 ? (
          <View style={styles.empty}>
            <AppText style={{ fontSize: 48 }}>
              {tab === 'upcoming' ? '📅' : '🕐'}
            </AppText>
            <AppText
              variant="h3"
              weight="bold"
              center
              style={{ marginTop: Spacing.md }}
            >
              {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            </AppText>
            <AppText
              variant="body"
              color={Colors.muted}
              center
              style={{ marginTop: Spacing.sm }}
            >
              {tab === 'upcoming'
                ? 'Explore listings and book your first rental!'
                : 'Your completed bookings will appear here.'}
            </AppText>
          </View>
        ) : (
          data.map(b => <BookingCard key={b.id} item={b} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.md,
    paddingBottom:     0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabRow: {
    flexDirection: 'row',
    marginTop:     Spacing.md,
    gap:           4,
  },
  tabBtn: {
    flex:            1,
    paddingVertical: Spacing.sm,
    alignItems:      'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },

  listContent: {
    padding:    Spacing.xl,
    gap:        Spacing.md,
    paddingBottom: Spacing['5xl'],
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    ...Shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  emojiBox: {
    width:           52,
    height:          52,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  divider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginVertical:   Spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    gap:           Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  cardFooter: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      Spacing.md,
    paddingTop:     Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  statusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.full,
    paddingVertical:   4,
    paddingHorizontal: 10,
    marginLeft:        Spacing.sm,
    flexShrink:        0,
  },
  payBtn: {
    backgroundColor:   Colors.primary,
    borderRadius:      Radius.md,
    paddingVertical:   8,
    paddingHorizontal: 14,
  },
  msgBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.md,
    paddingVertical:   8,
    paddingHorizontal: 12,
    borderWidth:       1.5,
    borderColor:       Colors.primary,
  },
  reviewBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      Radius.md,
    paddingVertical:   8,
    paddingHorizontal: 12,
    borderWidth:       1.5,
    borderColor:       Colors.amber,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           2,
  },
  empty: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing['5xl'],
  },
});