import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';
import { fetchHostPayouts, fetchPayoutSummary } from '@/lib/payoutsService';
import type { Payout } from '@/types/database';

function fmt(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PAYOUT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: Colors.amber,   bg: Colors.amberLight   },
  processing: { label: 'Processing', color: Colors.primary, bg: Colors.primaryLight },
  paid:       { label: 'Paid',       color: Colors.teal,    bg: Colors.tealLight    },
  failed:     { label: 'Failed',     color: Colors.error,   bg: Colors.errorLight   },
};

export default function EarningsScreen() {
  const user    = useAuthStore(s => s.user);
  const { profile } = useProfile();

  const [payouts,   setPayouts]   = useState<Payout[]>([]);
  const [summary,   setSummary]   = useState({ pending: 0, processing: 0, paid: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      const [{ data }, { summary: s }] = await Promise.all([
        fetchHostPayouts(user.id),
        fetchPayoutSummary(user.id),
      ]);
      setPayouts(data ?? []);
      setSummary(s);
      setIsLoading(false);
    })();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="h2" weight="extrabold">Earnings</AppText>

      {/* ── Total earnings hero ── */}
      <View style={styles.hero}>
        <AppText variant="caption" color={Colors.muted} style={{ marginBottom: Spacing.xs }}>
          TOTAL EARNINGS
        </AppText>
        <AppText variant="display" weight="extrabold" color={Colors.teal}>
          {fmt(profile?.total_earnings ?? summary.paid)}
        </AppText>
        {profile?.host_rating ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={Colors.amber} />
            <AppText variant="label" weight="semibold" style={{ marginLeft: 4 }}>
              {profile.host_rating.toFixed(1)}
            </AppText>
            <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
              ({profile.host_review_count} reviews)
            </AppText>
          </View>
        ) : null}
      </View>

      {/* ── Summary cards ── */}
      <View style={styles.summaryRow}>
        <SummaryCard label="Pending"    amount={summary.pending}    color={Colors.amber} />
        <SummaryCard label="Processing" amount={summary.processing} color={Colors.primary} />
        <SummaryCard label="Paid Out"   amount={summary.paid}       color={Colors.teal} />
      </View>

      {/* ── Payout history ── */}
      <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionLabel}>
        PAYOUT HISTORY
      </AppText>

      {payouts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="inbox" size={32} color={Colors.subtle} />
          <AppText color={Colors.muted} style={{ marginTop: Spacing.sm }}>
            No payouts yet. Payouts are released after completed bookings.
          </AppText>
        </View>
      ) : (
        payouts.map(p => {
          const st = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending;
          return (
            <View key={p.id} style={styles.payoutRow}>
              <View style={styles.payoutLeft}>
                <AppText variant="label" weight="semibold">{fmt(p.amount)}</AppText>
                <AppText variant="caption" color={Colors.muted}>
                  {fmtDate(p.created_at)} · {p.payout_method.toUpperCase()}
                </AppText>
              </View>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <AppText variant="caption" weight="semibold" color={st.color}>
                  {st.label}
                </AppText>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function SummaryCard({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <View style={sumStyles.card}>
      <AppText variant="caption" color={Colors.muted}>{label}</AppText>
      <AppText variant="label" weight="bold" color={color}>{fmt(amount)}</AppText>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.sm,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  payoutLeft: { gap: 2 },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
});
