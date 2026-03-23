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
): Promise<{ url: string | null; error: any }> {
  try {
    const response = await fetch(localUri);
    const blob     = await response.blob();
    const ext      = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `${hostId}/${Date.now()}_${index}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('listing-photos')
      .upload(filePath, blob, {
        upsert:      true,
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
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
      lat:                 draft.lat,
      lng:                 draft.lng,
      price,
      price_unit:          draft.price_unit,
      deposit,
      instant_book:        draft.instant_book,
      amenities:           draft.amenities,
      house_rules:         draft.house_rules.trim() || null,
      cancellation_policy: draft.cancellation_policy,
      cover_photo_url:     draft.cover_photo_url,
      photos:              [], // populated after upload
      status,
    })
    .select('id')
    .single();

  return { data, error };
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