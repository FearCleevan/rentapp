// hooks/useNotifications.ts
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notificationsService';
import type { Notification } from '@/types/database';

export function useNotifications() {
  const user = useAuthStore(s => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await fetchNotifications(user.id);
    setNotifications(data ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  async function markRead(id: string) {
    await markNotificationRead(id);
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );
  }

  async function markAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
    );
  }

  return { notifications, isLoading, unreadCount, markRead, markAllRead, refresh: load };
}
