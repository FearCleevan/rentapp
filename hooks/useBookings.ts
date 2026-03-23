// hooks/useBookings.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchUserBookings,
  fetchSavedListings,
  fetchSavedListingIds,
  saveListing,
  unsaveListing,
  type BookingRow,
  type SavedListingRow,
} from '@/lib/bookingsService';
import { useAuthStore } from '@/store/authStore';

// ─── useBookings ──────────────────────────────────────────────────────────────

export function useBookings() {
  const { user } = useAuthStore();
  const [bookings,     setBookings]     = useState<BookingRow[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!user?.id) { setIsLoading(false); return; }
    if (refresh) setIsRefreshing(true);
    else         setIsLoading(true);
    setError(null);

    const { data, error: err } = await fetchUserBookings(user.id);

    if (!mountedRef.current) return;

    if (err) setError(err.message ?? 'Failed to load bookings.');
    else     setBookings(data);

    setIsLoading(false);
    setIsRefreshing(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  // Split into upcoming and past
  const upcoming = bookings.filter(b =>
    ['pending_payment', 'payment_processing', 'confirmed', 'active'].includes(b.status)
  );
  const past = bookings.filter(b =>
    ['completed', 'cancelled', 'disputed'].includes(b.status)
  );

  return { bookings, upcoming, past, isLoading, isRefreshing, error, refresh };
}

// ─── useSaved ─────────────────────────────────────────────────────────────────

export function useSaved() {
  const { user } = useAuthStore();
  const [saved,        setSaved]        = useState<SavedListingRow[]>([]);
  const [savedIds,     setSavedIds]     = useState<Set<string>>(new Set());
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!user?.id) { setIsLoading(false); return; }
    if (refresh) setIsRefreshing(true);
    else         setIsLoading(true);
    setError(null);

    const { data, error: err } = await fetchSavedListings(user.id);

    if (!mountedRef.current) return;

    if (err) {
      setError(err.message ?? 'Failed to load saved listings.');
    } else {
      setSaved(data);
      setSavedIds(new Set(data.map(s => s.listing_id)));
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  // Toggle save/unsave with optimistic update
  const toggleSave = useCallback(async (listingId: string) => {
    if (!user?.id) return;

    const isSaved = savedIds.has(listingId);

    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });

    if (isSaved) {
      setSaved(prev => prev.filter(s => s.listing_id !== listingId));
      await unsaveListing(user.id, listingId);
    } else {
      await saveListing(user.id, listingId);
      // Refresh to get full listing details
      load();
    }
  }, [user?.id, savedIds, load]);

  return { saved, savedIds, isLoading, isRefreshing, error, refresh, toggleSave };
}