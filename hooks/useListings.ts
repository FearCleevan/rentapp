// hooks/useListings.ts

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
  const [listings,     setListings]     = useState<ListingRow[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Keep a ref to latest filters so load() never has a stale closure
  const filtersRef  = useRef(filters);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Stable load function — uses ref so never needs to be re-created
  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else         setIsLoading(true);
    setError(null);

    try {
      const { data, error: err } = await fetchListings(filtersRef.current);
      if (!mountedRef.current) return;

      if (err) {
        setError(err.message ?? 'Failed to load listings.');
        setListings([]);
      } else {
        setListings(data ?? []);
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message ?? 'Unexpected error.');
      setListings([]);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []); // stable — reads filters from ref

  // Re-run when filters change; debounce only for search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const hasSearch = (filters.search ?? '').length > 0;

    if (hasSearch) {
      debounceRef.current = setTimeout(() => load(), 400);
    } else {
      load();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    filters.category,
    filters.search,
    filters.radiusKm,
    filters.userLat,
    filters.userLng,
    filters.sortBy,
    filters.sortDir,
    load,
  ]);

  const refresh = useCallback(() => load(true), [load]);

  return { listings, isLoading, isRefreshing, error, refresh };
}

// ─── useDiscoverSections ──────────────────────────────────────────────────────

export interface DiscoverData {
  featured:  Awaited<ReturnType<typeof fetchFeaturedListings>>['data'];
  newItems:  Awaited<ReturnType<typeof fetchNewListings>>['data'];
  topHosts:  Awaited<ReturnType<typeof fetchTopHosts>>['data'];
}

export function useDiscoverSections() {
  const [data,      setData]      = useState<DiscoverData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const mountedRef  = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => { mountedRef.current = false; };
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);

    try {
      const [featuredRes, newRes, hostsRes] = await Promise.all([
        fetchFeaturedListings(6),
        fetchNewListings(6),
        fetchTopHosts(5),
      ]);

      if (!mountedRef.current) return;

      // Show whatever we have — don't block all if one fails
      setData({
        featured: featuredRes.data ?? [],
        newItems: newRes.data      ?? [],
        topHosts: hostsRes.data    ?? [],
      });

      // Only set error if ALL three failed
      if (featuredRes.error && newRes.error && hostsRes.error) {
        setError('Failed to load discover sections.');
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      setError(e?.message ?? 'Unexpected error loading sections.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }

  const refresh = useCallback(() => loadAll(), []);

  return { data, isLoading, error, refresh };
}