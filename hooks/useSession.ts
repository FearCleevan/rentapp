// hooks/useSession.ts
import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useSession() {
  const { session, profile, isLoading, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          await hydrate(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function initializeSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      setSession(data.session);
      if (data.session?.user) {
        await hydrate(data.session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      const isInvalidRefreshToken =
        error instanceof Error &&
        error.message.toLowerCase().includes('invalid refresh token');

      if (isInvalidRefreshToken) {
        // Stale token in local storage: clear it without network dependency.
        await supabase.auth.signOut({ scope: 'local' });
      }

      console.error('Session restore failed:', error);
      setSession(null);
      setProfile(null);
      setLoading(false);
    }
  }

  async function hydrate(userId: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        // Profile row might not exist yet — don't block the app
      }

      setProfile(data ?? null);
    } catch (e) {
      console.error('Hydrate failed:', e);
    } finally {
      // ALWAYS stop loading — even if fetch failed
      setLoading(false);
    }
  }

  return { session, profile, isLoading };
}
