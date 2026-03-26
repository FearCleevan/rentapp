// lib/listingCreateService.ts
// All operations for creating and managing listings including photo upload.

import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingCategory =
  | 'parking'
  | 'room'
  | 'vehicle'
  | 'equipment'
  | 'event_venue'
  | 'meeting_room'
  | 'storage';

export type PriceUnit = 'hour' | 'day' | 'week' | 'month';

export interface ListingDraft {
  // Step 1 — Category
  category:         ListingCategory | null;

  // Step 2 — Basic info
  title:            string;
  description:      string;

  // Step 3 — Location
  address:          string;
  city:             string;
  barangay:         string;
  lat:              number;
  lng:              number;

  // Step 4 — Pricing
  price:            string;
  price_unit:       PriceUnit;
  deposit:          string;
  instant_book:     boolean;

  // Step 5 — Amenities
  amenities:        string[];

  // Step 6 — Photos
  photos:           string[];       // local URIs (before upload)
  cover_photo_url:  string | null;  // first uploaded URL

  // Step 7 — Rules
  house_rules:      string;
  cancellation_policy: 'flexible' | 'moderate' | 'strict';
}

export interface EditableListingRow {
  id: string;
  host_id: string;
  category: ListingCategory;
  title: string;
  description: string | null;
  address: string;
  city: string;
  barangay: string | null;
  lat: number;
  lng: number;
  price: number;
  price_unit: PriceUnit;
  deposit: number;
  instant_book: boolean;
  amenities: string[] | null;
  photos: string[] | null;
  cover_photo_url: string | null;
  house_rules: string | null;
  cancellation_policy: 'flexible' | 'moderate' | 'strict' | string;
  status: 'draft' | 'active' | 'paused' | 'deleted';
}

export const DRAFT_DEFAULTS: ListingDraft = {
  category:            null,
  title:               '',
  description:         '',
  address:             '',
  city:                'Davao City',
  barangay:            '',
  lat:                 7.0731,
  lng:                 125.6126,
  price:               '',
  price_unit:          'day',
  deposit:             '0',
  instant_book:        false,
  amenities:           [],
  photos:              [],
  cover_photo_url:     null,
  house_rules:         '',
  cancellation_policy: 'flexible',
};

// ─── Amenity presets per category ─────────────────────────────────────────────

export const AMENITY_PRESETS: Record<ListingCategory, string[]> = {
  parking:      ['CCTV', '24/7 Access', 'Covered', 'Key Card', 'EV Charging', 'Guarded', 'Open Air', 'Underground'],
  room:         ['WiFi', 'Aircon', 'Kitchen', 'Hot Shower', 'Netflix', 'Washer', 'Parking', 'Gym', 'Pool Access'],
  vehicle:      ['Self-drive', 'GPS', 'Dash Cam', 'Unlimited KM', 'With Driver', 'Fuel Included', 'Insurance', 'Child Seat'],
  equipment:    ['Carry Bag', 'Extra Battery', 'SD Cards', 'Tripod', 'Lenses Included', 'Manual Included', 'Cleaning Kit'],
  event_venue:  ['Tables & Chairs', 'AV System', 'Projector', 'Parking', 'Aircon', 'Catering', 'Stage', 'Sound System'],
  meeting_room: ['WiFi', 'Projector', 'Whiteboard', 'Coffee', 'Printer', 'TV Screen', 'Video Conferencing'],
  storage:      ['24/7 Access', 'CCTV', 'Climate Controlled', 'Drive-up Access', 'Shelving', 'Padlock Provided'],
};

// ─── Photo upload ─────────────────────────────────────────────────────────────

export async function uploadListingPhoto(
  hostId:   string,
  localUri: string,
  index:    number,
  listingId?: string,
): Promise<{ url: string | null; error: any }> {
  try {
    const sourceUri = localUri;

    const cleanUri = sourceUri.split('?')[0];
    const rawExt = cleanUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(rawExt) ? rawExt : 'jpg';
    const response = await fetch(sourceUri);
    if (!response.ok) {
      return {
        url: null,
        error: { message: `Unable to read selected photo (${response.status})` },
      };
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || (ext === 'jpg'
      ? 'image/jpeg'
      : ext === 'heic'
        ? 'image/heic'
        : ext === 'heif'
          ? 'image/heif'
          : `image/${ext}`);
    const scope = listingId ? `${hostId}/${listingId}` : hostId;
    const filePath = `${scope}/${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-photos')
      .upload(filePath, fileBuffer, {
        upsert:      false,
        contentType,
      });

    if (uploadError) return { url: null, error: uploadError };

    const { data } = supabase.storage
      .from('listing-photos')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: { message: e?.message } };
  }
}

// ─── Create listing ───────────────────────────────────────────────────────────

export async function createListing(
  hostId: string,
  draft:  ListingDraft,
  status: 'draft' | 'active' = 'active',
) {
  if (!draft.category) return { data: null, error: { message: 'Category is required' } };

  const price   = parseFloat(draft.price)   || 0;
  const deposit = parseFloat(draft.deposit) || 0;

  const { data, error } = await supabase
    .from('listings')
    .insert({
      host_id:             hostId,
      category:            draft.category,
      title:               draft.title.trim(),
      description:         draft.description.trim() || null,
      address:             draft.address.trim(),
      city:                draft.city.trim() || 'Davao City',
      barangay:            draft.barangay.trim() || null,
      tags:                [],
      lat:                 draft.lat,
      lng:                 draft.lng,
      price,
      price_unit:          draft.price_unit,
      deposit,
      instant_book:        draft.instant_book,
      min_booking_hours:   1,
      max_booking_days:    30,
      advance_notice_hours: 0,
      buffer_hours:        0,
      amenities:           draft.amenities,
      house_rules:         draft.house_rules.trim() || null,
      cancellation_policy: draft.cancellation_policy,
      cover_photo_url:     draft.cover_photo_url,
      photos:              [], // populated after upload
      is_featured:         false,
      status,
    })
    .select('id')
    .single();

  return { data, error };
}

export async function updateListing(
  listingId: string,
  hostId: string,
  draft: ListingDraft,
  status?: 'draft' | 'active' | 'paused',
) {
  if (!draft.category) return { data: null, error: { message: 'Category is required' } };

  const price   = parseFloat(draft.price)   || 0;
  const deposit = parseFloat(draft.deposit) || 0;

  const payload: Record<string, any> = {
    category:            draft.category,
    title:               draft.title.trim(),
    description:         draft.description.trim() || null,
    address:             draft.address.trim(),
    city:                draft.city.trim() || 'Davao City',
    barangay:            draft.barangay.trim() || null,
    lat:                 draft.lat,
    lng:                 draft.lng,
    price,
    price_unit:          draft.price_unit,
    deposit,
    instant_book:        draft.instant_book,
    amenities:           draft.amenities,
    house_rules:         draft.house_rules.trim() || null,
    cancellation_policy: draft.cancellation_policy,
  };

  if (status) payload.status = status;

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', listingId)
    .eq('host_id', hostId)
    .select('id')
    .single();

  return { data, error };
}

export function listingRowToDraft(row: EditableListingRow): ListingDraft {
  return {
    category: row.category,
    title: row.title ?? '',
    description: row.description ?? '',
    address: row.address ?? '',
    city: row.city ?? 'Davao City',
    barangay: row.barangay ?? '',
    lat: row.lat ?? DRAFT_DEFAULTS.lat,
    lng: row.lng ?? DRAFT_DEFAULTS.lng,
    price: String(row.price ?? 0),
    price_unit: row.price_unit ?? 'day',
    deposit: String(row.deposit ?? 0),
    instant_book: !!row.instant_book,
    amenities: row.amenities ?? [],
    photos: row.photos ?? [],
    cover_photo_url: row.cover_photo_url ?? null,
    house_rules: row.house_rules ?? '',
    cancellation_policy:
      row.cancellation_policy === 'moderate' || row.cancellation_policy === 'strict'
        ? row.cancellation_policy
        : 'flexible',
  };
}

export async function fetchEditableListing(hostId: string, listingId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select('id,host_id,category,title,description,address,city,barangay,lat,lng,price,price_unit,deposit,instant_book,amenities,photos,cover_photo_url,house_rules,cancellation_policy,status')
    .eq('id', listingId)
    .eq('host_id', hostId)
    .neq('status', 'deleted')
    .single();

  return { data: data as EditableListingRow | null, error };
}

// ─── Update listing photos after upload ──────────────────────────────────────

export async function updateListingPhotos(
  listingId: string,
  photoUrls: string[],
) {
  const { error } = await supabase
    .from('listings')
    .update({
      photos:          photoUrls,
      cover_photo_url: photoUrls[0] ?? null,
    })
    .eq('id', listingId);

  return { error };
}
