// app/(tabs)/explore/index.tsx
import { useState, useCallback, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui/AppText';
import { CategoryIcon, CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { BannerCarousel } from '@/components/explore/BannerCarousel';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet } from '@/components/explore/RadiusFilterSheet';

import { useListings, useDiscoverSections } from '@/hooks/useListings';
import { type ListingRow } from '@/lib/listingsService';
import { type Category } from '@/components/explore/exploreData';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── Listing card ─────────────────────────────────────────────────────────────

function RealListingCard({
  item, saved, onSave, onPress,
}: {
  item: ListingRow;
  saved: boolean;
  onSave: () => void;
  onPress: () => void;
}) {
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;
  const imageUrl = item.cover_photo_url ?? item.photos?.[0] ?? null;

  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={lc.imgArea}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={lc.photo} contentFit="cover" />
        ) : (
          <View style={lc.placeholder} />
        )}

        {/* Heart */}
        <TouchableOpacity style={lc.heartBtn} onPress={onSave}>
          <Feather
            name="heart"
            size={14}
            color={saved ? '#FF4D4F' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={lc.body}>
        {/* Title */}
        <AppText variant="label" weight="bold" numberOfLines={1} style={lc.title}>
          {item.title}
        </AppText>

        {/* Subtext (date + price) */}
        <AppText variant="caption" color={Colors.subtle} style={lc.subText}>
          8 days • from ₱{Number(item.price).toLocaleString()}/person
        </AppText>

        {/* Rating */}
        <View style={lc.ratingRow}>
          <Feather name="star" size={12} color="#FFB800" />
          <AppText variant="caption" weight="bold" style={{ marginLeft: 4 }}>
            {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
          </AppText>
          {item.review_count > 0 && (
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 4 }}>
              {item.review_count} reviews
            </AppText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const lc = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  imgArea: {
    height: 140,
    position: 'relative',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    flex: 1,
    backgroundColor: '#eee',
  },

  // 👇 NEW STYLE (white floating heart)
  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  body: {
    padding: 10,
  },

  title: {
    fontSize: 13,
    marginBottom: 2,
  },

  subText: {
    fontSize: 11,
    marginBottom: 6,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD = Spacing.xl;
const CARD_GAP = Spacing.sm;
const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

function mapUiCategoryToDb(category: Category) {
  if (category === 'venue') return 'event_venue';
  if (category === 'meeting') return 'meeting_room';
  return category === 'all' ? undefined : category;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [radiusKm, setRadiusKm] = useState(5);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [pendingRadius, setPendingRadius] = useState(5);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  const filters = useMemo(() => ({
    category: mapUiCategoryToDb(category) as any,
    search, radiusKm,
    userLat: USER_LAT,
    userLng: USER_LNG,
    sortBy: 'distance' as const,
  }), [category, search, radiusKm]);

  const { listings, isLoading, isRefreshing, error, refresh } = useListings(filters);
  const { data: discoverData, isLoading: discoverLoading, refresh: refreshDiscover } = useDiscoverSections();

  const selectedListing = selectedId ? listings.find(l => l.id === selectedId) ?? null : null;

  function toggleSave(id: string) {
    setSaved(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function applyFilter() { setRadiusKm(pendingRadius); setCategory(pendingCategory); setFilterVisible(false); }
  function resetFilter() { setPendingRadius(5); setPendingCategory('all'); setRadiusKm(5); setCategory('all'); setFilterVisible(false); }

  const ListHeader = useCallback(() => (
    <View style={styles.headerWrap}>
      <BannerCarousel
        discoverData={discoverData}
        discoverLoading={discoverLoading}
        onListingPress={(id) => setSelectedId(id)}
      />
      <View style={styles.allListingsRow}>
        <View>
          <AppText variant="h2" weight="extrabold">All listings</AppText>
          <AppText variant="caption" color={Colors.subtle} style={{ marginTop: 1 }}>
            {isLoading ? 'Loading…' : `${listings.length} spaces · ${radiusKm} km radius`}
          </AppText>
        </View>
        <View style={styles.allListingsActions}>
          <TouchableOpacity style={styles.seeAllBtn} onPress={() => router.push('/listings/all')} activeOpacity={0.8}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>See all</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8}>
            <Feather name="map" size={12} color={Colors.muted} />
            <AppText variant="caption" weight="semibold" color={Colors.muted} style={{ marginLeft: 4 }}>Map</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [discoverData, discoverLoading, listings.length, radiusKm, isLoading]);

  function ListEmpty() {
    if (isLoading) return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>Finding spaces near you…</AppText>
      </View>
    );

    if (error) return (
      <View style={styles.centerState}>
        <View style={styles.emptyIconWrap}>
          <Feather name="wifi-off" size={32} color={Colors.muted} />
        </View>
        <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>Something went wrong</AppText>
        <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm }}>{error}</AppText>
        <TouchableOpacity style={styles.resetBtn} onPress={refresh} activeOpacity={0.85}>
          <AppText variant="label" weight="bold" color={Colors.primary}>Try again</AppText>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.centerState}>
        <View style={styles.emptyIconWrap}>
          <Feather name="search" size={32} color={Colors.muted} />
        </View>
        <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>No listings found</AppText>
        <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm, maxWidth: 240 }}>
          Try widening your search radius or a different category.
        </AppText>
        <TouchableOpacity style={styles.resetBtn} onPress={resetFilter} activeOpacity={0.85}>
          <AppText variant="label" weight="bold" color={Colors.primary}>Reset filters</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ExploreHeader
        search={search} category={category} radiusKm={radiusKm}
        onSearch={setSearch} onCategory={setCategory}
        onFilter={() => { setPendingRadius(radiusKm); setPendingCategory(category); setFilterVisible(true); }}
        onNotif={() => { }}
      />

      <FlatList
        data={isLoading ? [] : listings}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.colWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <RealListingCard
              item={item}
              saved={saved.has(item.id)}
              onSave={() => toggleSave(item.id)}
              onPress={() => setSelectedId(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={<ListEmpty />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => Promise.all([refresh(), refreshDiscover()])}
            tintColor={Colors.primary}
          />
        }
      />

      <RadiusFilterSheet
        visible={filterVisible}
        radiusKm={pendingRadius}
        category={pendingCategory}
        onClose={() => setFilterVisible(false)}
        onRadiusChange={setPendingRadius}
        onCategoryChange={setPendingCategory}
        onReset={resetFilter}
        onApply={applyFilter}
      />

      {selectedListing && (
        <ListingDetailSheet
          listing={{
            id: selectedListing.id,
            category: selectedListing.category as any,
            title: selectedListing.title,
            location: selectedListing.address,
            distance: (selectedListing as any)._distKm ?? 0,
            lat: selectedListing.lat,
            lng: selectedListing.lng,
            price: Number(selectedListing.price),
            priceUnit: selectedListing.price_unit,
            rating: selectedListing.avg_rating,
            reviewCount: selectedListing.review_count,
            isVerified: selectedListing.host_is_verified,
            instantBook: selectedListing.instant_book,
            hostName: selectedListing.host_name,
            hostAvatar: selectedListing.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
            amenities: selectedListing.amenities ?? [],
            emoji: '📦',
            bgColor: CATEGORY_CONFIG[selectedListing.category]?.bg ?? '#F0EDE6',
            address: selectedListing.address,
            city: selectedListing.city,
            coverPhotoUrl: selectedListing.cover_photo_url,
            photos: selectedListing.photos ?? [],
            userLat: USER_LAT,
            userLng: USER_LNG,
            description: selectedListing.description ?? 'No description provided.',
          }}
          saved={saved.has(selectedListing.id)}
          onSave={() => toggleSave(selectedListing.id)}
          onClose={() => setSelectedId(null)}
          onBook={() => setSelectedId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: SIDE_PAD, paddingTop: Spacing.lg },
  allListingsRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: Spacing['2xl'], marginBottom: Spacing.md },
  allListingsActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3 },
  seeAllBtn: { paddingVertical: 6, paddingHorizontal: 13, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  mapBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 13, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  listContent: { paddingHorizontal: SIDE_PAD, paddingBottom: Spacing['5xl'] },
  colWrapper: { gap: CARD_GAP, marginBottom: CARD_GAP },
  cardWrap: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['5xl'], paddingTop: Spacing['3xl'] },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  resetBtn: { marginTop: Spacing.lg, paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
});
