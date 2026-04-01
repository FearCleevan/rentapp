import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { fetchHostPayouts, fetchPayoutSummary } from '@/lib/payoutsService';
import type { Payout } from '@/types/database';

function fmt(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: 'Pending',    color: Colors.amber,   bg: Colors.amberLight,   icon: 'clock'      },
  processing: { label: 'Processing', color: Colors.primary, bg: Colors.primaryLight, icon: 'loader'     },
  paid:       { label: 'Paid',       color: Colors.teal,    bg: Colors.tealLight,    icon: 'check'      },
  failed:     { label: 'Failed',     color: Colors.error,   bg: Colors.errorLight,   icon: 'x-circle'   },
};

const METHOD_LABEL: Record<string, string> = {
  gcash:       'GCash',
  bank:        'Bank Transfer',
  paymaya:     'Maya',
  cash:        'Cash',
};

export default function PayoutsScreen() {
  const user = useAuthStore(s => s.user);

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
      <AppText variant="h2" weight="extrabold">Payout Settings</AppText>

      {/* ── Summary cards ── */}
      <View style={styles.summaryRow}>
        <SummaryCard
          label="Pending"
          amount={summary.pending}
          icon="clock"
          color={Colors.amber}
          bg={Colors.amberLight}
        />
        <SummaryCard
          label="Processing"
          amount={summary.processing}
          icon="loader"
          color={Colors.primary}
          bg={Colors.primaryLight}
        />
        <SummaryCard
          label="Paid Out"
          amount={summary.paid}
          icon="check-circle"
          color={Colors.teal}
          bg={Colors.tealLight}
        />
      </View>

      {/* ── Payout method banner ── */}
      <View style={styles.methodBanner}>
        <View style={styles.methodLeft}>
          <Feather name="credit-card" size={18} color={Colors.primary} />
          <View style={{ marginLeft: Spacing.md }}>
            <AppText variant="label" weight="semibold">Payout Method</AppText>
            <AppText variant="caption" color={Colors.muted}>
              Payouts are released within 3–5 business days after booking completion.
            </AppText>
          </View>
        </View>
      </View>

      {/* ── Transaction history ── */}
      <AppText variant="label" weight="bold" color={Colors.muted} style={styles.sectionLabel}>
        TRANSACTION HISTORY
      </AppText>

      {payouts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="inbox" size={32} color={Colors.subtle} />
          <AppText color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
            No payouts yet. Complete a booking to start receiving payouts.
          </AppText>
        </View>
      ) : (
        payouts.map((p, i) => {
          const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
          const method = METHOD_LABEL[p.payout_method] ?? p.payout_method.toUpperCase();
          return (
            <View key={p.id} style={[styles.txRow, i > 0 && styles.txBorder]}>
              <View style={[styles.txIcon, { backgroundColor: st.bg }]}>
                <Feather name={st.icon as any} size={16} color={st.color} />
              </View>

              <View style={styles.txBody}>
                <View style={styles.txTop}>
                  <AppText variant="label" weight="bold">{fmt(p.amount)}</AppText>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <AppText variant="caption" weight="semibold" color={st.color}>
                      {st.label}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={Colors.muted}>
                  {method}
                  {p.payout_reference ? ` · Ref: ${p.payout_reference}` : ''}
                </AppText>
                <AppText variant="caption" color={Colors.subtle}>
                  {p.paid_at ? `Paid ${fmtDate(p.paid_at)}` : `Created ${fmtDate(p.created_at)}`}
                </AppText>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function SummaryCard({
  label, amount, icon, color, bg,
}: { label: string; amount: number; icon: string; color: string; bg: string }) {
  return (
    <View style={[sumStyles.card, { backgroundColor: bg }]}>
      <Feather name={icon as any} size={16} color={color} />
      <AppText variant="caption" color={Colors.muted} style={{ marginTop: Spacing.xs }}>
        {label}
      </AppText>
      <AppText variant="label" weight="bold" color={color}>{fmt(amount)}</AppText>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { padding: Spacing.xl, paddingBottom: Spacing['5xl'] },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  methodBanner: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  txBorder: {},
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txBody: { flex: 1, gap: 2 },
  txTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
});
