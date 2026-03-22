// hooks/useProfile.ts
// Provides the current user's profile with live refresh capability.
// Uses authStore as the single source of truth — no duplicate fetches.

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { fetchProfile, updateProfile, uploadAvatar } from '@/lib/profileService';
import type { ProfileUpdate } from '@/types/database';

export function useProfile() {
  const { profile, setProfile, user } = useAuthStore();
  const [isUpdating, setIsUpdating]   = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  /** Re-fetch the profile from Supabase and update the store */
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await fetchProfile(user.id);
    if (data) setProfile(data);
    return { error };
  }, [user?.id]);

  /** Update profile fields and optimistically update the store */
  const update = useCallback(async (updates: ProfileUpdate) => {
    if (!user?.id) return { error: new Error('Not authenticated') };
    setIsUpdating(true);
    setUpdateError(null);

    const { data, error } = await updateProfile(user.id, updates);

    if (data) {
      setProfile(data);
    }
    if (error) {
      setUpdateError(error.message);
    }

    setIsUpdating(false);
    return { data, error };
  }, [user?.id]);

  /** Upload a new avatar image and update the profile */
  const changeAvatar = useCallback(async (localUri: string) => {
    if (!user?.id) return { url: null, error: new Error('Not authenticated') };
    setIsUpdating(true);
    setUpdateError(null);

    const { url, error } = await uploadAvatar(user.id, localUri);

    if (url) {
      // Refresh the whole profile to get the updated avatar_url
      await refresh();
    }
    if (error) {
      setUpdateError(error.message);
    }

    setIsUpdating(false);
    return { url, error };
  }, [user?.id, refresh]);

  return {
    profile,
    isUpdating,
    updateError,
    refresh,
    update,
    changeAvatar,
  };
}