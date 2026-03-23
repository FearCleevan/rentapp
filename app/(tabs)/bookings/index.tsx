// app/(tabs)/bookings/index.tsx
import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText }    from '@/components/ui/AppText';
import { useToast }   from '@/components/ui/Toast';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { useBookings }  from '@/hooks/useBookings';
import { cancelBooking } from '@/lib/bookingsService';
import { useAuthStore }  from '@/store/authStore';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import type { BookingRow }    from '@/lib/bookingsService';
import type { BookingStatus } from '@/types/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (s.toDateString() === e.toDateString()) return s.toLocaleDateString('en-PH', opts);
  return `${s.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-PH', opts)}`;
}

function formatTime(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const diffHrs  = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHrs / 24;
  if (diffDays >= 1) return `${Math.round(diffDays)} day${Math.round(diffDays) !== 1 ? 's' : ''}`;
  const fmt = (d: Date) => d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${fmt(s)} – ${fmt(e)}`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; icon: string }> = {
  confirmed:          { label: 'Confirmed',  bg: Colors.tealLight,    text: Colors.teal,    icon: 'check-circle'   },
  pending_payment:    { label: 'Pay Now',     bg: '#FAEEDA',           text: '#854F0B',      icon: 'clock'          },
  payment_processing: { label: 'Processing', bg: '#FAEEDA',           text: '#854F0B',      icon: 'loader'         },
  active:             { label: 'Active',      bg: Colors.primaryLight, text: Colors.primary, icon: 'zap'            },
  completed:          { label: 'Completed',  bg: '#F1EFE8',           text: '#5F5E5A',      icon: 'check'          },
  cancelled:          { label: 'Cancelled',  bg: '#FCEBEB',           text: '#A32D2D',      icon: 'x-circle'       },
  disputed:           { label: 'Disputed',   bg: '#FAECE7',           text: '#712B13',      icon: 'alert-triangle' },
};

function StatusPill({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed;
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Feather name={cfg.icon as any} size={11} color={cfg.text} />
      <AppText variant="caption" weight="bold" color={cfg.text} style={{ marginLeft: 4 }}>
        {cfg.label}
      </AppText>
    </View>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ item, onCancel }: { item: BookingRow; onCancel: () => void }) {
  const isPast   = ['completed', 'cancelled', 'disputed'].includes(item.status);
  const totalAmt = item.total_charge ?? item.total_amount ?? 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88}>
      <View style={styles.cardHeader}>
        <View style={{ opacity: isPast ? 0.6 : 1 }}>
          <CategoryIcon category={item.listing_category} tileSize={52} radius={Radius.md} />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ marginBottom: 3 }}>
            {item.listing_title}
          </AppText>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={11} color={Colors.subtle} />
            <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
              {item.listing_city}
            </AppText>
          </View>
        </View>
        <StatusPill status={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.infoRow}>
          <Feather name="calendar" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {formatDateRange(item.start_time, item.end_time)}
          </AppText>
        </View>
        <View style={styles.infoRow}>
          <Feather name="clock" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {formatTime(item.start_time, item.end_time)}
          </AppText>
        </View>
      </View>

      {item.vehicle_plate && (
        <View style={[styles.infoRow, { marginTop: Spacing.xs }]}>
          <Feather name="truck" size={13} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 5 }}>
            {item.vehicle_plate}
          </AppText>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View>
          <AppText variant="caption" color={Colors.subtle}>Total</AppText>
          <AppText variant="bodyLg" weight="extrabold">₱{Number(totalAmt).toLocaleString()}</AppText>
        </View>
        <View style={styles.actionRow}>
          {item.status === 'pending_payment' && item.paymongo_link_url && (
            <TouchableOpacity style={styles.payBtn} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.white}>Pay now</AppText>
            </TouchableOpacity>
          )}
          {item.status === 'confirmed' && (
            <TouchableOpacity style={styles.msgBtn} activeOpacity={0.85}>
              <Feather name="message-circle" size={14} color={Colors.primary} />
              <AppText variant="label" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>Message</AppText>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && (
            <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85}>
              <Feather name="star" size={14} color={Colors.amber} />
              <AppText variant="label" weight="bold" color={Colors.amber} style={{ marginLeft: 4 }}>Review</AppText>
            </TouchableOpacity>
          )}
          {['pending_payment', 'confirmed'].includes(item.status) && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.muted}>Cancel</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type TabType = 'upcoming' | 'past';

export default function BookingsScreen() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { upcoming, past, isLoading, isRefreshing, error, refresh } = useBookings();
  const [tab, setTab] = useState<TabType>('upcoming');
  const data = tab === 'upcoming' ? upcoming : past;

  async function handleCancel(booking: BookingRow) {
    Alert.alert(
      'Cancel booking',
      'Are you sure? Cancellation fees may apply.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Yes, cancel', style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            const { error } = await cancelBooking(booking.id, user.id);
            if (error) toast.show('Failed to cancel. Please try again.', 'error');
            else { toast.show('Booking cancelled.', 'success'); refresh(); }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <AppText variant="h2" weight="extrabold">My Bookings</AppText>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>
            Loading your bookings…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h2" weight="extrabold">My Bookings</AppText>
        <View style={styles.tabRow}>
          {(['upcoming', 'past'] as TabType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <AppText variant="label" weight="bold" color={tab === t ? Colors.primary : Colors.muted}>
                {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={28} color={Colors.muted} />
          </View>
          <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>Something went wrong</AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <AppText variant="label" weight="bold" color={Colors.primary}>Try again</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        >
          {data.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Feather
                  name={tab === 'upcoming' ? 'calendar' : 'clock'}
                  size={28}
                  color={Colors.muted}
                />
              </View>
              <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>
                {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
              </AppText>
              <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
                {tab === 'upcoming'
                  ? 'Explore listings and book your first rental!'
                  : 'Your completed bookings will appear here.'}
              </AppText>
            </View>
          ) : (
            data.map(b => <BookingCard key={b.id} item={b} onCancel={() => handleCancel(b)} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabRow: { flexDirection: 'row', marginTop: Spacing.md, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Colors.primary },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  retryBtn: { marginTop: Spacing.lg, paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  listContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['5xl'] },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  detailsRow: { flexDirection: 'row', gap: Spacing.lg },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 10, marginLeft: Spacing.sm, flexShrink: 0 },
  payBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 14 },
  msgBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: Colors.primary },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: Colors.amber },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['5xl'] },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
});