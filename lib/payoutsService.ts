// lib/payoutsService.ts
import { supabase } from './supabase';
import type { Payout } from '@/types/database';

export async function fetchHostPayouts(hostId: string): Promise<{ data: Payout[] | null; error: any }> {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export interface PayoutSummary {
  pending:    number;
  processing: number;
  paid:       number;
}

export async function fetchPayoutSummary(hostId: string): Promise<{ summary: PayoutSummary; error: any }> {
  const { data, error } = await supabase
    .from('payouts')
    .select('amount, status')
    .eq('host_id', hostId);

  if (error) return { summary: { pending: 0, processing: 0, paid: 0 }, error };

  const summary = (data ?? []).reduce<PayoutSummary>(
    (acc, p) => {
      if (p.status === 'pending')    acc.pending    += p.amount;
      if (p.status === 'processing') acc.processing += p.amount;
      if (p.status === 'paid')       acc.paid       += p.amount;
      return acc;
    },
    { pending: 0, processing: 0, paid: 0 },
  );

  return { summary, error: null };
}
