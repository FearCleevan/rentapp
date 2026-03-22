// hooks/useListings.ts
// Manages listings state for the Explore screen.
// Handles loading, error, refresh, and filter changes.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchListings,
  fetchFeaturedListings,
  fetchNewListings,
  fetchTopHosts,
  type ListingFilters,
  type ListingRow,
} from '@/lib/listingsService';

// ─── useListings ──────────────────────────────────────────────────────────────

export function useListings(filters: ListingFilters) {
  const [listings,    setListings]    = useState<ListingRow[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Debounce ref — avoids firing a query on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else         setIsLoading(true);
    setError(null);

    const { data, error: err } = await fetchListings(filters);

    if (err) {
      setError(err.message);
    } else {
      setListings(data ?? []);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [
    filters.category,
    filters.search,
    filters.radiusKm,
    filters.userLat,
    filters.userLng,
    filters.sortBy,
    filters.sortDir,
  ]);

  // Debounce search, immediate for everything else
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (filters.search != null && filters.search.length > 0) {
      debounceRef.current = setTimeout(() => load(), 400);
    } else {
      load();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { listings, isLoading, isRefreshing, error, refresh };
}

// ─── useDiscoverSections ──────────────────────────────────────────────────────
// Fetches featured, new, and top hosts for the BannerCarousel.
// Only runs once on mount — not reactive to filter changes.

export interface DiscoverData {
  featured:  Awaited<ReturnType<typeof fetchFeaturedListings>>['data'];
  newItems:  Awaited<ReturnType<typeof fetchNewListings>>['data'];
  topHosts:  Awaited<ReturnType<typeof fetchTopHosts>>['data'];
}

export function useDiscoverSections() {
  const [data,      setData]      = useState<DiscoverData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);

    const [featuredRes, newRes, hostsRes] = await Promise.all([
      fetchFeaturedListings(6),
      fetchNewListings(6),
      fetchTopHosts(5),
    ]);

    if (featuredRes.error || newRes.error || hostsRes.error) {
      setError('Failed to load discover sections.');
    } else {
      setData({
        featured:  featuredRes.data,
        newItems:  newRes.data,
        topHosts:  hostsRes.data,
      });
    }

    setIsLoading(false);
  }

  return { data, isLoading, error, refresh: loadAll };
}