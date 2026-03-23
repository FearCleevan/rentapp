// lib/bookingsService.ts
// All booking and saved-listing Supabase queries.

import { supabase } from './supabase';
import type { BookingStatus } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingRow {
  id:                  string;
  listing_id:          string;
  renter_id:           string;
  host_id:             string;
  start_time:          string;
  end_time:            string;
  total_charge:        number | null;
  total_amount:        number | null;
  service_fee:         number | null;
  host_payout:         number | null;
  status:              BookingStatus;
  vehicle_plate:       string | null;
  vehicle_type:        string | null;
  special_notes:       string | null;
  paymongo_link_url:   string | null;
  paid_at:             string | null;
  created_at:          string;
  // enriched
  listing_title:       string;
  listing_category:    string;
  listing_address:     string;
  listing_city:        string;
  listing_cover_url:   string | null;
  host_name:           string;
  renter_name:         string;
}

export interface SavedListingRow {
  id:              string;
  user_id:         string;
  listing_id:      string;
  created_at:      string;
  // enriched
  title:           string;
  category:        string;
  address:         string;
  city:            string;
  price:           number;
  price_unit:      string;
  avg_rating:      number;
  review_count:    number;
  instant_book:    boolean;
  cover_photo_url: string | null;
  host_name:       string;
  host_is_verified: boolean;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchUserBookings(userId: string): Promise<{ data: BookingRow[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, listing_id, renter_id, host_id,
        start_time, end_time,
        total_charge, total_amount, service_fee, host_payout,
        status, vehicle_plate, vehicle_type,
        special_notes, paymongo_link_url, paid_at, created_at
      `)
      .or(`renter_id.eq.${userId},host_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const bookings = data ?? [];
    if (bookings.length === 0) return { data: [], error: null };

    // Fetch listing info
    const listingIds = [...new Set(bookings.map(b => b.listing_id))];
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, category, address, city, cover_photo_url')
      .in('id', listingIds);

    // Fetch host + renter names
    const profileIds = [...new Set([
      ...bookings.map(b => b.host_id),
      ...bookings.map(b => b.renter_id),
    ])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', profileIds);

    const listingMap  = Object.fromEntries((listings  ?? []).map(l => [l.id, l]));
    const profileMap  = Object.fromEntries((profiles  ?? []).map(p => [p.id, p]));

    const enriched: BookingRow[] = bookings.map(b => {
      const listing = listingMap[b.listing_id];
      const host    = profileMap[b.host_id];
      const renter  = profileMap[b.renter_id];
      return {
        ...b,
        listing_title:     listing?.title       ?? 'Listing',
        listing_category:  listing?.category    ?? 'parking',
        listing_address:   listing?.address     ?? '',
        listing_city:      listing?.city        ?? '',
        listing_cover_url: listing?.cover_photo_url ?? null,
        host_name:         host?.full_name      ?? 'Host',
        renter_name:       renter?.full_name    ?? 'Renter',
      };
    });

    return { data: enriched, error: null };
  } catch (e: any) {
    return { data: [], error: { message: e?.message ?? 'Unknown error' } };
  }
}

export async function fetchBookingById(bookingId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();
    return { data, error };
  } catch (e: any) {
    return { data: null, error: { message: e?.message } };
  }
}

export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancelled_by:        userId,
      cancellation_reason: reason ?? 'Cancelled by user',
    })
    .eq('id', bookingId)
    .select('id, status')
    .single();
  return { data, error };
}

// ─── Saved Listings ───────────────────────────────────────────────────────────

export async function fetchSavedListings(userId: string): Promise<{ data: SavedListingRow[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('id, user_id, listing_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };

    const saved = data ?? [];
    if (saved.length === 0) return { data: [], error: null };

    // Fetch listing details
    const listingIds = saved.map(s => s.listing_id);
    const { data: listings } = await supabase
      .from('listings')
      .select('id, host_id, title, category, address, city, price, price_unit, avg_rating, review_count, instant_book, cover_photo_url')
      .in('id', listingIds)
      .eq('status', 'active');

    if (!listings || listings.length === 0) return { data: [], error: null };

    // Fetch host info
    const hostIds = [...new Set(listings.map(l => l.host_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, is_verified')
      .in('id', hostIds);

    const listingMap = Object.fromEntries(listings.map(l => [l.id, l]));
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    const enriched: SavedListingRow[] = saved
      .filter(s => listingMap[s.listing_id]) // skip deleted listings
      .map(s => {
        const l    = listingMap[s.listing_id];
        const host = profileMap[l.host_id];
        return {
          ...s,
          title:            l.title,
          category:         l.category,
          address:          l.address,
          city:             l.city,
          price:            Number(l.price),
          price_unit:       l.price_unit,
          avg_rating:       l.avg_rating,
          review_count:     l.review_count,
          instant_book:     l.instant_book,
          cover_photo_url:  l.cover_photo_url ?? null,
          host_name:        host?.full_name   ?? 'Host',
          host_is_verified: host?.is_verified ?? false,
        };
      });

    return { data: enriched, error: null };
  } catch (e: any) {
    return { data: [], error: { message: e?.message ?? 'Unknown error' } };
  }
}

export async function saveListing(userId: string, listingId: string) {
  const { data, error } = await supabase
    .from('saved_listings')
    .insert({ user_id: userId, listing_id: listingId })
    .select('id')
    .single();
  return { data, error };
}

export async function unsaveListing(userId: string, listingId: string) {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
  return { error };
}

export async function isListingSaved(userId: string, listingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single();
  return !!data;
}

// Fetch just the listing IDs the user has saved (for quick heart state)
export async function fetchSavedListingIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId);
  return (data ?? []).map(s => s.listing_id);
}