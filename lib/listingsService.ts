// lib/listingsService.ts
import { supabase } from './supabase';
import type { ListingCategory, ListingStatus } from '@/types/database';

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
  host_name:        string;
  host_avatar_url:  string | null;
  host_is_verified: boolean;
  _distKm?:         number;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  = Math.sin(dL/2)**2 + Math.cos((lat1*Math.PI)/180)*Math.cos((lat2*Math.PI)/180)*Math.sin(dG/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function enrichWithHosts(listings: any[]): Promise<ListingRow[]> {
  if (!listings || listings.length === 0) return [];
  const hostIds = [...new Set(listings.map(l => l.host_id))].filter(Boolean);
  if (hostIds.length === 0) return listings.map(l => ({ ...l, host_name:'Host', host_avatar_url:null, host_is_verified:false }));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_verified')
    .in('id', hostIds);
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  return listings.map(l => {
    const host = profileMap[l.host_id];
    return { ...l, host_name: host?.full_name ?? 'Host', host_avatar_url: host?.avatar_url ?? null, host_is_verified: host?.is_verified ?? false };
  });
}

export async function fetchListings(filters: ListingFilters = {}): Promise<{ data: ListingRow[] | null; error: any }> {
  const { category, search, radiusKm, userLat, userLng, sortBy = 'created_at', sortDir = 'desc', limit = 60, offset = 0 } = filters;
  try {
    let query = supabase
      .from('listings')
      .select('id,host_id,category,title,description,address,city,barangay,lat,lng,price,price_unit,deposit,instant_book,amenities,cover_photo_url,photos,review_count,avg_rating,total_bookings,status,is_featured,created_at')
      .eq('status', 'active');
    if (category && category !== 'all') query = query.eq('category', category);
    if (search && search.trim().length > 0) query = query.or(`title.ilike.%${search.trim()}%,address.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`);
    if (sortBy !== 'distance') query = query.order(sortBy, { ascending: sortDir === 'asc' });
    else query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);
    const { data, error } = await query;
    if (error) return { data: null, error };
    let rows = await enrichWithHosts(data ?? []);
    if (userLat != null && userLng != null) {
      rows = rows.map(r => ({ ...r, _distKm: haversineKm(userLat, userLng, r.lat, r.lng) }));
      if (radiusKm != null) rows = rows.filter(r => (r._distKm ?? 0) <= radiusKm);
      if (sortBy === 'distance') rows = rows.sort((a, b) => (a._distKm ?? 0) - (b._distKm ?? 0));
    }
    return { data: rows, error: null };
  } catch (e: any) { return { data: null, error: { message: e?.message ?? 'Unknown error' } }; }
}

export async function fetchListingById(id: string) {
  try {
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).eq('status', 'active').single();
    if (error || !data) return { data: null, error };
    const enriched = await enrichWithHosts([data]);
    return { data: enriched[0] ?? null, error: null };
  } catch (e: any) { return { data: null, error: { message: e?.message } }; }
}

export async function fetchFeaturedListings(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id,host_id,category,title,address,city,lat,lng,price,price_unit,cover_photo_url,avg_rating,review_count,instant_book,is_featured,created_at')
      .eq('status', 'active')
      .or('is_featured.eq.true,avg_rating.gte.4.5')
      .order('avg_rating', { ascending: false })
      .limit(limit);
    if (error) return { data: [], error };
    const enriched = await enrichWithHosts(data ?? []);
    return { data: enriched, error: null };
  } catch (e: any) { return { data: [], error: { message: e?.message } }; }
}

export async function fetchNewListings(limit = 6) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id,host_id,category,title,address,city,lat,lng,price,price_unit,avg_rating,review_count,instant_book,created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { data: [], error };
    const enriched = await enrichWithHosts(data ?? []);
    return { data: enriched, error: null };
  } catch (e: any) { return { data: [], error: { message: e?.message } }; }
}

export async function fetchTopHosts(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,full_name,avatar_url,is_verified,host_rating,host_review_count,total_listings')
      .gt('total_listings', 0)
      .order('total_listings', { ascending: false })
      .limit(limit);
    return { data: data ?? [], error };
  } catch (e: any) { return { data: [], error: { message: e?.message } }; }
}

export async function fetchHostListings(hostId: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id,category,title,price,price_unit,avg_rating,review_count,status,total_bookings,cover_photo_url,created_at,amenities')
      .eq('host_id', hostId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });
    return { data: data ?? [], error };
  } catch (e: any) { return { data: [], error: { message: e?.message } }; }
}

export async function setListingStatus(listingId: string, status: 'active' | 'paused' | 'draft') {
  const { data, error } = await supabase.from('listings').update({ status }).eq('id', listingId).select('id,status').single();
  return { data, error };
}