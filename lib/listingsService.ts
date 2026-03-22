// lib/listingsService.ts
// All listing-related Supabase queries.

import { supabase } from './supabase';
import type { ListingCategory, ListingStatus } from '@/types/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingFilters {
  category?:  ListingCategory | 'all';
  search?:    string;
  radiusKm?:  number;
  userLat?:   number;
  userLng?:   number;
  sortBy?:    'created_at' | 'price' | 'avg_rating' | 'distance';
  sortDir?:   'asc' | 'desc';
  limit?:     number;
  offset?:    number;
}

// Shape returned from the listings query (flat — no joins yet)
export interface ListingRow {
  id:               string;
  host_id:          string;
  category:         ListingCategory;
  title:            string;
  description:      string | null;
  address:          string;
  city:             string;
  barangay:         string | null;
  lat:              number;
  lng:              number;
  price:            number;
  price_unit:       string;
  deposit:          number;
  instant_book:     boolean;
  amenities:        string[];
  cover_photo_url:  string | null;
  photos:           string[];
  review_count:     number;
  avg_rating:       number;
  total_bookings:   number;
  status:           ListingStatus;
  is_featured:      boolean;
  created_at:       string;
  // joined host fields
  host_name:        string;
  host_avatar_url:  string | null;
  host_is_verified: boolean;
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────
// Used client-side to filter/sort by distance since Supabase free tier
// doesn't expose PostGIS. Replace with RPC when you upgrade.

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch active listings with optional filters.
 * Distance filtering is done client-side after fetch.
 */
export async function fetchListings(filters: ListingFilters = {}) {
  const {
    category,
    search,
    radiusKm,
    userLat,
    userLng,
    sortBy  = 'created_at',
    sortDir = 'desc',
    limit   = 50,
    offset  = 0,
  } = filters;

  let query = supabase
    .from('listings')
    .select(`
      id,
      host_id,
      category,
      title,
      description,
      address,
      city,
      barangay,
      lat,
      lng,
      price,
      price_unit,
      deposit,
      instant_book,
      amenities,
      cover_photo_url,
      photos,
      review_count,
      avg_rating,
      total_bookings,
      status,
      is_featured,
      created_at,
      profiles!listings_host_id_fkey (
        full_name,
        avatar_url,
        is_verified
      )
    `)
    .eq('status', 'active');

  // Category filter
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // Text search (title + address)
  if (search && search.trim().length > 0) {
    query = query.or(
      `title.ilike.%${search.trim()}%,address.ilike.%${search.trim()}%`
    );
  }

  // Sort (distance sort handled client-side)
  if (sortBy !== 'distance') {
    query = query.order(sortBy, { ascending: sortDir === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Flatten joined host fields
  const rows: ListingRow[] = (data ?? []).map((l: any) => ({
    ...l,
    host_name:        l.profiles?.full_name  ?? 'Host',
    host_avatar_url:  l.profiles?.avatar_url ?? null,
    host_is_verified: l.profiles?.is_verified ?? false,
    profiles:         undefined,
  }));

  // Client-side distance filter + sort
  let results = rows;

  if (userLat != null && userLng != null) {
    results = results.map(r => ({
      ...r,
      _distKm: haversineKm(userLat, userLng, r.lat, r.lng),
    })) as any[];

    if (radiusKm != null) {
      results = results.filter((r: any) => r._distKm <= radiusKm);
    }

    if (sortBy === 'distance') {
      results = results.sort((a: any, b: any) => a._distKm - b._distKm);
    }
  }

  return { data: results, error: null };
}

// ─── Single listing ───────────────────────────────────────────────────────────

export async function fetchListingById(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles!listings_host_id_fkey (
        id,
        full_name,
        avatar_url,
        is_verified,
        host_rating,
        host_review_count
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error) return { data: null, error };

  const flat = {
    ...data,
    host_name:        data.profiles?.full_name        ?? 'Host',
    host_avatar_url:  data.profiles?.avatar_url       ?? null,
    host_is_verified: data.profiles?.is_verified      ?? false,
    host_rating:      data.profiles?.host_rating      ?? null,
    host_review_count: data.profiles?.host_review_count ?? 0,
    profiles:         undefined,
  };

  return { data: flat, error: null };
}

// ─── Featured listings (for Discover carousel) ────────────────────────────────

export async function fetchFeaturedListings(limit = 6) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, category, title, address, city,
      lat, lng, price, price_unit,
      cover_photo_url, photos,
      avg_rating, review_count,
      instant_book, is_featured,
      profiles!listings_host_id_fkey (
        full_name, is_verified
      )
    `)
    .eq('status', 'active')
    .or('is_featured.eq.true,avg_rating.gte.4.5')
    .order('avg_rating', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

// ─── New listings (recently added) ───────────────────────────────────────────

export async function fetchNewListings(limit = 6) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, category, title, address, city,
      lat, lng, price, price_unit,
      cover_photo_url, avg_rating,
      instant_book, created_at,
      profiles!listings_host_id_fkey (
        full_name, is_verified
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

// ─── Top hosts (most listings + best ratings) ─────────────────────────────────

export async function fetchTopHosts(limit = 6) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_verified, host_rating, host_review_count, total_listings')
    .gt('total_listings', 0)
    .order('host_rating', { ascending: false })
    .limit(limit);

  return { data: data ?? [], error };
}

// ─── Host's own listings ──────────────────────────────────────────────────────

export async function fetchHostListings(hostId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('id, category, title, price, price_unit, avg_rating, review_count, status, total_bookings, cover_photo_url, created_at')
    .eq('host_id', hostId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

// ─── Toggle listing status ────────────────────────────────────────────────────

export async function setListingStatus(
  listingId: string,
  status: 'active' | 'paused' | 'draft',
) {
  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listingId)
    .select('id, status')
    .single();

  return { data, error };
}