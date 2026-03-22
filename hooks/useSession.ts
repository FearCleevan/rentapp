//hooks/useSession.ts
import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase, getProfile } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useSession() {
  const { session, profile, isLoading, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        hydrate(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
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

  async function hydrate(userId: string) {
    setLoading(true);
    const { data } = await getProfile(userId);
    setProfile(data);
    setLoading(false);
  }

  return { session, profile, isLoading };
}
