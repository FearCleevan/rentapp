import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthState {
  session:    Session | null;
  user:       User    | null;
  profile:    Profile | null;
  isLoading:  boolean;
  isOnboarded: boolean;

  setSession:    (session: Session | null) => void;
  setProfile:    (profile: Profile | null) => void;
  setLoading:    (v: boolean) => void;
  setOnboarded:  (v: boolean) => void;
  reset:         () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session:     null,
  user:        null,
  profile:     null,
  isLoading:   true,
  isOnboarded: false,

  setSession:   (session) => set({ session, user: session?.user ?? null }),
  setProfile:   (profile) => set({ profile }),
  setLoading:   (isLoading) => set({ isLoading }),
  setOnboarded: (isOnboarded) => set({ isOnboarded }),
  reset:        () => set({ session: null, user: null, profile: null }),
}));