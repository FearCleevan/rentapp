// app/(tabs)/explore/index.tsx
import { useState, useCallback, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppText }            from '@/components/ui/AppText';
import { ExploreHeader }      from '@/components/explore/ExploreHeader';
import { BannerCarousel }     from '@/components/explore/BannerCarousel';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';

import { useListings, useDiscoverSections } from '@/hooks/useListings';
import { type ListingRow }    from '@/lib/listingsService';
import { type Category }      from '@/components/explore/exploreData';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── ListingCard (inline — uses real ListingRow shape) ───────────────────────
// Keeping it inline avoids changing the existing ListingCard component shape.

import { TouchableOpacity as TO, View as V, StyleSheet as SS } from 'react-native';

function RealListingCard({
  item,
  saved,
  onSave,
  onPress,
}: {
  item:    ListingRow;
  saved:   boolean;
  onSave:  () => void;
  onPress: () => void;
}) {
  const CATEGORY_EMOJI: Record<string, string> = {
    parking:      '🅿️',
    room:         '🏠',
    vehicle:      '🚗',
    equipment:    '📷',
    venue:        '🎪',
    meeting_room: '🏢',
    storage:      '📦',
  };
  const CATEGORY_BG: Record<string, string> = {
    parking:      '#F0EDE6',
    room:         '#EAF0E8',
    vehicle:      '#E8E4DC',
    equipment:    '#EDE8F0',
    venue:        '#F0E8E8',
    meeting_room: '#E8EEF0',
    storage:      '#F0EDE6',
  };

  const emoji = CATEGORY_EMOJI[item.category] ?? '📦';
  const bg    = CATEGORY_BG[item.category]    ?? '#F0EDE6';

  return (
    <TO style={lc.card} onPress={onPress} activeOpacity={0.9}>
      <V style={[lc.imgArea, { backgroundColor: bg }]}>
        <AppText style={{ fontSize: 40 }}>{emoji}</AppText>

        {item.instant_book && (
          <V style={lc.instantBadge}>
            <Feather name="zap" size={9} color={Colors.white} />
            <AppText variant="caption" weight="bold" color={Colors.white} style={{ fontSize:9, marginLeft:2 }}>
              Instant
            </AppText>
          </V>
        )}

        <TO style={lc.heartBtn} onPress={onSave} hitSlop={{ top:6, bottom:6, left:6, right:6 }}>
          <Feather name="heart" size={14} color={saved ? '#FF4444' : 'rgba(255,255,255,0.9)'} />
        </TO>
      </V>

      <V style={lc.body}>
        <AppText variant="caption" weight="bold" color={Colors.primary} style={lc.catLabel}>
          {item.category.replace('_', ' ').toUpperCase()}
        </AppText>

        <AppText variant="label" weight="bold" numberOfLines={2} style={lc.title}>
          {item.title}
        </AppText>

        <V style={lc.locationRow}>
          <Feather name="map-pin" size={9} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.subtle} numberOfLines={1} style={{ marginLeft:3, flex:1 }}>
            {item.city}
            {(item as any)._distKm != null
              ? ` · ${((item as any)._distKm as number).toFixed(1)} km`
              : ''}
          </AppText>
        </V>

        <V style={lc.ratingRow}>
          <Feather name="star" size={10} color="#FFB800" />
          <AppText variant="caption" weight="bold" style={{ marginLeft:3 }}>
            {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
          </AppText>
          {item.review_count > 0 && (
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft:2 }}>
              ({item.review_count})
            </AppText>
          )}
          {item.host_is_verified && (
            <V style={lc.verifiedDot}>
              <Feather name="check" size={8} color={Colors.teal} />
            </V>
          )}
        </V>

        <V style={lc.priceRow}>
          <AppText variant="label" weight="extrabold" color={Colors.ink}>
            ₱{Number(item.price).toLocaleString()}
          </AppText>
          <AppText variant="caption" color={Colors.subtle}>/{item.price_unit}</AppText>
        </V>
      </V>
    </TO>
  );
}

const lc = SS.create({
  card:      { backgroundColor:Colors.white, borderRadius:Radius.lg, overflow:'hidden', flex:1,
               shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2 },
  imgArea:   { height:130, alignItems:'center', justifyContent:'center', position:'relative' },
  instantBadge: { position:'absolute', top:8, left:8, flexDirection:'row', alignItems:'center',
                  backgroundColor:Colors.teal, borderRadius:Radius.full, paddingVertical:3, paddingHorizontal:6 },
  heartBtn:  { position:'absolute', top:8, right:8, width:28, height:28, borderRadius:14,
               backgroundColor:'rgba(0,0,0,0.3)', alignItems:'center', justifyContent:'center' },
  body:      { padding: Spacing.sm },
  catLabel:  { fontSize:9, letterSpacing:0.5, marginBottom:2 },
  title:     { lineHeight:18, marginBottom:4 },
  locationRow: { flexDirection:'row', alignItems:'center', marginBottom:3 },
  ratingRow: { flexDirection:'row', alignItems:'center', marginBottom:5 },
  verifiedDot: { marginLeft:4, width:14, height:14, borderRadius:7, backgroundColor:Colors.tealLight, alignItems:'center', justifyContent:'center' },
  priceRow:  { flexDirection:'row', alignItems:'baseline', gap:2 },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD  = Spacing.xl;
const CARD_GAP  = Spacing.sm;

// Mock user location — replace with expo-location later
const USER_LAT  = 7.0831;
const USER_LNG  = 125.6026;

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search,          setSearch]          = useState('');
  const [category,        setCategory]        = useState<Category>('all');
  const [radiusKm,        setRadiusKm]        = useState(5);
  const [saved,           setSaved]           = useState<Set<string>>(new Set());
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [filterVisible,   setFilterVisible]   = useState(false);
  const [pendingRadius,   setPendingRadius]   = useState(5);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  // ── Real data hooks ─────────────────────────────────────────────────────────
  const filters = useMemo(() => ({
    category:  category === 'all' ? undefined : category as any,
    search,
    radiusKm,
    userLat:   USER_LAT,
    userLng:   USER_LNG,
    sortBy:    'distance' as const,
  }), [category, search, radiusKm]);

  const {
    listings,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } = useListings(filters);

  const {
    data:      discoverData,
    isLoading: discoverLoading,
    refresh:   refreshDiscover,
  } = useDiscoverSections();

  // The selected listing object (looked up from the listings array)
  const selectedListing = selectedId
    ? listings.find(l => l.id === selectedId) ?? null
    : null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openFilter() {
    setPendingRadius(radiusKm);
    setPendingCategory(category);
    setFilterVisible(true);
  }

  function applyFilter() {
    setRadiusKm(pendingRadius);
    setCategory(pendingCategory);
    setFilterVisible(false);
  }

  function resetFilter() {
    setPendingRadius(5); setPendingCategory('all');
    setRadiusKm(5);      setCategory('all');
    setFilterVisible(false);
  }

  async function handleRefresh() {
    await Promise.all([refresh(), refreshDiscover()]);
  }

  // ── List header ──────────────────────────────────────────────────────────────
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
          <AppText variant="caption" color={Colors.subtle} style={{ marginTop:1 }}>
            {isLoading ? 'Loading…' : `${listings.length} spaces · ${radiusKm} km radius`}
          </AppText>
        </View>
        <View style={styles.allListingsActions}>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/listings/all')}
            activeOpacity={0.8}
          >
            <AppText variant="caption" weight="bold" color={Colors.primary}>See all</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8}>
            <Feather name="map" size={12} color={Colors.muted} />
            <AppText variant="caption" weight="semibold" color={Colors.muted} style={{ marginLeft:4 }}>Map</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [discoverData, discoverLoading, listings.length, radiusKm, isLoading]);

  // ── Grid renderer ────────────────────────────────────────────────────────────
  function renderItem({ item }: { item: ListingRow }) {
    return (
      <View style={styles.cardWrap}>
        <RealListingCard
          item={item}
          saved={saved.has(item.id)}
          onSave={() => toggleSave(item.id)}
          onPress={() => setSelectedId(item.id)}
        />
      </View>
    );
  }

  // ── Empty / error states ─────────────────────────────────────────────────────
  function ListEmpty() {
    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>
            Finding spaces near you…
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <AppText style={{ fontSize:40 }}>⚠️</AppText>
          <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
            Something went wrong
          </AppText>
          <AppText variant="body" color={Colors.muted} center style={{ marginTop:Spacing.sm }}>
            {error}
          </AppText>
          <TouchableOpacity style={styles.resetBtn} onPress={refresh} activeOpacity={0.85}>
            <AppText variant="label" weight="bold" color={Colors.primary}>Try again</AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <AppText style={{ fontSize:40 }}>🔍</AppText>
        <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
          No listings found
        </AppText>
        <AppText variant="body" color={Colors.muted} center style={{ marginTop:Spacing.sm, maxWidth:240 }}>
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
        search={search}
        category={category}
        radiusKm={radiusKm}
        onSearch={setSearch}
        onCategory={setCategory}
        onFilter={openFilter}
        onNotif={() => {}}
      />

      <FlatList
        data={isLoading ? [] : listings}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.colWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={<ListEmpty />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
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

      {/* Detail sheet — pass a converted object so existing sheet still works */}
      {selectedListing && (
        <ListingDetailSheet
          listing={{
            id:          selectedListing.id,
            category:    selectedListing.category as any,
            title:       selectedListing.title,
            location:    selectedListing.address,
            distance:    (selectedListing as any)._distKm ?? 0,
            lat:         selectedListing.lat,
            lng:         selectedListing.lng,
            price:       Number(selectedListing.price),
            priceUnit:   selectedListing.price_unit,
            rating:      selectedListing.avg_rating,
            reviewCount: selectedListing.review_count,
            isVerified:  selectedListing.host_is_verified,
            instantBook: selectedListing.instant_book,
            hostName:    selectedListing.host_name,
            hostAvatar:  selectedListing.host_name
              .split(' ').map((n: string) => n[0]).join('').slice(0, 2),
            amenities:   selectedListing.amenities ?? [],
            emoji:       ['🅿️','🏠','🚗','📷','🎪','🏢','📦'][
              ['parking','room','vehicle','equipment','venue','meeting_room','storage']
                .indexOf(selectedListing.category)
            ] ?? '📦',
            bgColor:     '#F0EDE6',
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },

  headerWrap: {
    paddingHorizontal: SIDE_PAD,
    paddingTop:        Spacing.lg,
  },
  allListingsRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginTop:      Spacing['2xl'],
    marginBottom:   Spacing.md,
  },
  allListingsActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginTop:     3,
  },
  seeAllBtn: {
    paddingVertical:   6,
    paddingHorizontal: 13,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.primary,
  },
  mapBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   6,
    paddingHorizontal: 13,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },

  listContent: {
    paddingHorizontal: SIDE_PAD,
    paddingBottom:     Spacing['5xl'],
  },
  colWrapper: {
    gap:          CARD_GAP,
    marginBottom: CARD_GAP,
  },
  cardWrap: { flex:1 },

  centerState: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingTop:      Spacing['3xl'],
  },
  resetBtn: {
    marginTop:         Spacing.lg,
    paddingVertical:   10,
    paddingHorizontal: 24,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.primary,
  },
});