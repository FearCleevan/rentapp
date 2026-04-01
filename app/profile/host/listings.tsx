import { useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { fetchHostListings } from '@/lib/listingsService';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { ListingCategory, ListingStatus } from '@/types/database';

type HostListing = {
  id: string;
  category: ListingCategory;
  title: string;
  price: number;
  price_unit: string;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  status: ListingStatus;
  cover_photo_url: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<ListingStatus, { label: string; color: string; bg: string }> = {
  active:  { label: 'Active',  color: Colors.teal,    bg: Colors.tealLight    },
  paused:  { label: 'Paused',  color: Colors.amber,   bg: Colors.amberLight   },
  draft:   { label: 'Draft',   color: Colors.muted,   bg: Colors.bg           },
  deleted: { label: 'Deleted', color: Colors.error,   bg: Colors.errorLight   },
};

function fmt(price: number, unit: string) {
  return `₱${price.toLocaleString('en-PH')} / ${unit}`;
}

function ListingCard({ item }: { item: HostListing }) {
  const st = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;

  return (
    <View style={styles.card}>
      {/* Cover photo */}
      <View style={styles.photoWrap}>
        {item.cover_photo_url ? (
          <Image source={{ uri: item.cover_photo_url }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <CategoryIcon category={item.category} size={28} showTile={false} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <AppText variant="caption" weight="semibold" color={st.color}>{st.label}</AppText>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
            {item.title}
          </AppText>
          <AppText variant="label" weight="semibold" color={Colors.teal}>
            {fmt(item.price, item.price_unit)}
          </AppText>
        </View>

        <View style={styles.cardMeta}>
          <MetaPill icon="star" value={item.avg_rating > 0 ? item.avg_rating.toFixed(1) : '—'} />
          <MetaPill icon="users" value={`${item.review_count} reviews`} />
          <MetaPill icon="calendar" value={`${item.total_bookings} bookings`} />
        </View>
      </View>
    </View>
  );
}

function MetaPill({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Feather name={icon as any} size={11} color={Colors.subtle} />
      <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 3 }}>{value}</AppText>
    </View>
  );
}

export default function ListingsScreen() {
  const user    = useAuthStore(s => s.user);
  const router  = useRouter();

  const [listings,  setListings]  = useState<HostListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      const { data } = await fetchHostListings(user.id);
      setListings((data as HostListing[]) ?? []);
      setIsLoading(false);
    })();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listings}
        keyExtractor={l => l.id}
        renderItem={({ item }) => <ListingCard item={item} />}
        contentContainerStyle={
          listings.length === 0 ? styles.emptyContainer : styles.list
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <AppText variant="h2" weight="extrabold">My Listings</AppText>
            <AppText variant="caption" color={Colors.muted}>
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="home" size={40} color={Colors.subtle} />
            <AppText variant="label" weight="semibold" style={{ marginTop: Spacing.md }}>
              No listings yet
            </AppText>
            <AppText variant="caption" color={Colors.muted} center style={{ marginTop: Spacing.xs }}>
              Start earning by creating your first listing.
            </AppText>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/listings/create')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: Spacing.xl, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, padding: Spacing.xl },
  listHeader: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  photoWrap: {
    height: 140,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  cardBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
