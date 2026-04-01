// lib/profileService.ts
// All profile-related Supabase queries in one place.
// Import these in screens instead of calling supabase directly.

import { supabase } from './supabase';
import type { ProfileUpdate } from '@/types/database';

// ─── Fetch ────────────────────────────────────────────────────────────────────

/** Get the full profile row for a user */
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// ─── Update ───────────────────────────────────────────────────────────────────

/** Update editable profile fields */
export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

/** Update the Expo push token (called after notification permission granted) */
export async function updatePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
  return { error };
}

/** Update avatar URL after upload */
export async function updateAvatar(userId: string, avatarUrl: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

/** Get a host's active listing count (live from DB, not denormalized value) */
export async function fetchHostListingCount(userId: string) {
  const { count, error } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', userId)
    .eq('status', 'active');
  return { count: count ?? 0, error };
}

/** Get a renter's completed booking count */
export async function fetchRenterBookingCount(userId: string) {
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('renter_id', userId)
    .eq('status', 'completed');
  return { count: count ?? 0, error };
}

/** Get total earnings for a host (sum of completed payouts) */
export async function fetchHostEarnings(userId: string) {
  const { data, error } = await supabase
    .from('payouts')
    .select('amount')
    .eq('host_id', userId)
    .eq('status', 'paid');

  const total = data?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;
  return { total, error };
}

// ─── Gov ID upload ────────────────────────────────────────────────────────────

/**
 * Upload a government ID image (front or selfie) to Supabase Storage
 * and update the profile row accordingly.
 */
export async function uploadGovId(userId: string, uri: string, type: 'front' | 'selfie') {
  const response = await fetch(uri);
  const blob     = await response.blob();
  const ext      = uri.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/${type}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('id-documents')
    .upload(filePath, blob, { upsert: true, contentType: `image/${ext}` });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from('id-documents').getPublicUrl(filePath);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const field = type === 'front'
    ? { gov_id_url: publicUrl }
    : { gov_id_selfie_url: publicUrl };

  const { error: updateError } = await updateProfile(userId, field);
  return { url: publicUrl, error: updateError };
}

/** Mark the user's verification as pending (after both ID images uploaded) */
export async function submitIdVerification(userId: string) {
  const { error } = await updateProfile(userId, { id_verification_status: 'pending' });
  return { error };
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

/**
 * Upload an avatar image to Supabase Storage and update the profile row.
 * @param userId - The authenticated user's ID
 * @param uri    - The local file URI from expo-image-picker
 */
export async function uploadAvatar(userId: string, uri: string) {
  // Use ArrayBuffer — more reliable than .blob() for local file:// URIs on Android
  const response   = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  // Always store as jpeg; expo-image-picker always outputs jpeg after editing
  const filePath   = `${userId}/avatar.jpg`;
  const mimeType   = 'image/jpeg';

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, arrayBuffer, { upsert: true, contentType: mimeType });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Cache-bust so expo-image/RN Image discards the old cached bytes
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await updateAvatar(userId, publicUrl);
  return { url: publicUrl, error: updateError };
}