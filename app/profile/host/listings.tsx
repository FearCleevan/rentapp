import { useEffect, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { fetchHostListings } from '@/lib/listingsService';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
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
  const st  = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <View style={styles.card}>
      <View style={styles.imgWrapper}>
        {item.cover_photo_url ? (
          <Image source={{ uri: item.cover_photo_url }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={32} color={cfg.color} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.68)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <AppText variant="caption" weight="semibold" color={st.color}>{st.label}</AppText>
        </View>

        {/* Overlay content */}
        <View style={styles.content}>
          <AppText numberOfLines={1} style={styles.title}>{item.title}</AppText>
          <AppText style={styles.subText}>{fmt(item.price, item.price_unit)}</AppText>
          <View style={styles.bottomRow}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color="#FFD700" />
              <AppText style={styles.ratingText}>
                {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
              </AppText>
              <AppText style={styles.metaText}>
                {'  ·  '}{item.review_count} reviews{'  ·  '}{item.total_bookings} bookings
              </AppText>
            </View>
            <View style={styles.arrowBtn}>
              <Feather name="arrow-right" size={13} color="#000" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ListingsScreen() {
  const user    = useAuthStore(s => s.user);
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

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
        style={[styles.fab, { bottom: Spacing.xl + insets.bottom }]}
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
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    backgroundColor: '#000',
    ...Shadow.md,
  },
  imgWrapper: {
    height: 220,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
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
  content: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 3,
  },
  subText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginLeft: 2,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
