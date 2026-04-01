import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/types/database';

const TYPE_ICON: Record<string, { name: string; color: string; bg: string }> = {
  booking:    { name: 'calendar',      color: Colors.primary,  bg: Colors.primaryLight },
  payment:    { name: 'credit-card',   color: Colors.teal,     bg: Colors.tealLight    },
  review:     { name: 'star',          color: Colors.amber,    bg: Colors.amberLight   },
  message:    { name: 'message-circle',color: Colors.primary,  bg: Colors.primaryLight },
  system:     { name: 'bell',          color: Colors.muted,    bg: Colors.bg           },
};

function getTypeConfig(type: string) {
  return TYPE_ICON[type] ?? TYPE_ICON.system;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function NotifItem({ item, onPress }: { item: Notification; onPress: () => void }) {
  const cfg = getTypeConfig(item.type);
  return (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.itemUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.name as any} size={18} color={cfg.color} />
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <AppText variant="label" weight="semibold" style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="caption" color={Colors.subtle}>
            {timeAgo(item.created_at)}
          </AppText>
        </View>
        <AppText variant="caption" color={Colors.muted} numberOfLines={2}>
          {item.body}
        </AppText>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead, refresh } =
    useNotifications();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <AppText variant="caption" color={Colors.muted}>
            {unreadCount} unread
          </AppText>
          <AppButton
            label="Mark all read"
            variant="ghost"
            size="sm"
            onPress={markAllRead}
          />
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={({ item }) => (
          <NotifItem item={item} onPress={() => { if (!item.is_read) markRead(item.id); }} />
        )}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.list
        }
        onRefresh={refresh}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={Colors.subtle} />
            <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.md }}>
              No notifications yet
            </AppText>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  list: {
    paddingVertical: Spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    gap: Spacing.md,
  },
  itemUnread: {
    backgroundColor: '#F0F8FF',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.teal,
    marginTop: Spacing.xs,
    flexShrink: 0,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.xl + 40 + Spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
});
