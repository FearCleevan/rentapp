import { useMemo, useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText }            from '@/components/ui/AppText';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';
import { CategoryPills }      from '@/components/explore/CategoryPills';
import { CATEGORY_CONFIG }    from '@/components/ui/CategoryIcon';

import { useListings } from '@/hooks/useListings';
import { useSaved } from '@/hooks/useBookings';
import { useToast } from '@/components/ui/Toast';
import type { ListingRow } from '@/lib/listingsService';
import type { Category } from '@/components/explore/exploreData';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD = Spacing.xl;
const CARD_GAP = Spacing.sm;

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

const SORT_OPTIONS = ['Nearest', 'Lowest price', 'Top rated', 'Most reviews'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function mapUiCategoryToDb(category: Category) {
  if (category === 'venue') return 'event_venue';
  if (category === 'meeting') return 'meeting_room';
  return category === 'all' ? undefined : category;
}

function sortListings(listings: ListingRow[], sort: SortOption): ListingRow[] {
  return [...listings].sort((a, b) => {
    if (sort === 'Nearest') return ((a._distKm ?? Number.MAX_VALUE) - (b._distKm ?? Number.MAX_VALUE));
    if (sort === 'Lowest price') return Number(a.price) - Number(b.price);
    if (sort === 'Top rated') return b.avg_rating - a.avg_rating;
    if (sort === 'Most reviews') return b.review_count - a.review_count;
    return 0;
  });
}

export default function AllListingsScreen() {
  const router = useRouter();
  const { host: hostId, hostName: hostNameParam } = useLocalSearchParams<{ host?: string; hostName?: string }>();

  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState<Category>('all');
  const [radiusKm,      setRadiusKm]      = useState(10);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  const { savedIds, toggleSave } = useSaved();
  const { show: showToast } = useToast();

  function handleSave(id: string) {
    const wasSaved = savedIds.has(id);
    toggleSave(id);
    showToast(wasSaved ? 'Removed from saved' : 'Saved!', wasSaved ? 'unsaved' : 'saved');
  }
  const [filterVisible, setFilterVisible] = useState(false);
  const [sort,          setSort]          = useState<SortOption>('Nearest');
  const [pendingRadius,   setPendingRadius]   = useState(10);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  const filters = useMemo(() => ({
    category: mapUiCategoryToDb(category) as any,
    search,
    radiusKm:  hostId ? undefined : radiusKm,
    userLat:   hostId ? undefined : USER_LAT,
    userLng:   hostId ? undefined : USER_LNG,
    sortBy:   (hostId ? 'avg_rating' : 'distance') as any,
    hostId,
  }), [category, search, radiusKm, hostId]);

  const { listings, isLoading, error } = useListings(filters);
  const filtered = useMemo(() => sortListings(listings, sort), [listings, sort]);
  const selected = selectedId ? filtered.find((l) => l.id === selectedId) ?? null : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="h3" weight="extrabold">
            {hostId ? `${hostNameParam ?? 'Host'}'s listings` : 'All listings'}
          </AppText>
          {hostId && (
            <AppText variant="caption" color={Colors.muted}>Active listings only</AppText>
          )}
        </View>
        {!hostId && (
          <TouchableOpacity style={s.filterIconBtn} onPress={() => {
            setPendingRadius(radiusKm); setPendingCategory(category);
            setFilterVisible(true);
          }}>
            <Feather name="sliders" size={17} color={Colors.ink} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Feather name="search" size={15} color={Colors.subtle} />
          <TextInput
            style={s.searchInput}
            placeholder="Search listings..."
            placeholderTextColor={Colors.subtle}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
              <Feather name="x" size={14} color={Colors.subtle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.pillsWrap}>
        <CategoryPills active={category} onChange={setCategory} />
      </View>

      {!hostId && (
        <View style={s.sortWrap}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[s.sortChip, sort === opt && s.sortChipActive]}
              onPress={() => setSort(opt)}
              activeOpacity={0.8}
            >
              <AppText
                variant="caption"
                weight="bold"
                color={sort === opt ? Colors.white : Colors.muted}
              >
                {opt}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={s.countRow}>
        <AppText variant="caption" color={Colors.muted}>
          <AppText variant="caption" weight="bold" color={Colors.ink}>{filtered.length}</AppText>
          {hostId ? ' active listings' : ` spaces within ${radiusKm} km`}
        </AppText>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap:CARD_GAP, marginBottom:CARD_GAP }}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const hostAvatar = item.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
            return (
              <View style={{ flex:1 }}>
                <ListingCard
                  item={{
                    id: item.id,
                    category: item.category as any,
                    title: item.title,
                    location: item.address,
                    address: item.address,
                    city: item.city,
                    distance: item._distKm ?? 0,
                    lat: item.lat,
                    lng: item.lng,
                    price: Number(item.price),
                    priceUnit: item.price_unit,
                    rating: item.avg_rating,
                    reviewCount: item.review_count,
                    isVerified: item.host_is_verified,
                    instantBook: item.instant_book,
                    hostName: item.host_name,
                    hostAvatar,
                    amenities: item.amenities ?? [],
                    emoji: '📦',
                    bgColor: CATEGORY_CONFIG[item.category]?.bg ?? '#F0EDE6',
                    coverPhotoUrl: item.cover_photo_url,
                    photos: item.photos ?? [],
                    description: item.description ?? 'No description provided.',
                  }}
                  saved={savedIds.has(item.id)}
                  onSave={() => handleSave(item.id)}
                  onPress={() => setSelectedId(item.id)}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <AppText style={{ fontSize:40 }}>🔍</AppText>
              <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
                {error ? 'Something went wrong' : 'No results'}
              </AppText>
              <AppText variant="body" color={Colors.muted} center style={{ marginTop:Spacing.sm }}>
                {error || 'Try a wider radius or different category.'}
              </AppText>
            </View>
          }
        />
      )}

      <RadiusFilterSheet
        visible={filterVisible}
        radiusKm={pendingRadius}
        category={pendingCategory}
        onClose={() => setFilterVisible(false)}
        onRadiusChange={setPendingRadius}
        onCategoryChange={setPendingCategory}
        onReset={() => { setPendingRadius(10); setPendingCategory('all'); setRadiusKm(10); setCategory('all'); setFilterVisible(false); }}
        onApply={() => { setRadiusKm(pendingRadius); setCategory(pendingCategory); setFilterVisible(false); }}
      />

      <ListingDetailSheet
        listing={selected ? {
          id:          selected.id,
          category:    selected.category as any,
          title:       selected.title,
          location:    selected.address,
          address:     selected.address,
          city:        selected.city,
          distance:    selected._distKm ?? 0,
          lat:         selected.lat,
          lng:         selected.lng,
          userLat:     USER_LAT,
          userLng:     USER_LNG,
          price:       Number(selected.price),
          priceUnit:   selected.price_unit,
          rating:      selected.avg_rating,
          reviewCount: selected.review_count,
          isVerified:  selected.host_is_verified,
          instantBook: selected.instant_book,
          hostName:    selected.host_name,
          hostAvatar:  selected.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
          amenities:   selected.amenities ?? [],
          emoji:       '📦',
          bgColor:     CATEGORY_CONFIG[selected.category]?.bg ?? '#F0EDE6',
          coverPhotoUrl: selected.cover_photo_url,
          photos:      selected.photos ?? [],
          description: selected.description ?? 'No description provided.',
        } : null}
        saved={selected ? savedIds.has(selected.id) : false}
        onSave={() => selected && handleSave(selected.id)}
        onClose={() => setSelectedId(null)}
        onBook={() => setSelectedId(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:Colors.bg },
  header:        { flexDirection:'row', alignItems:'center', paddingHorizontal:SIDE_PAD, paddingVertical:Spacing.md, backgroundColor:Colors.white, borderBottomWidth:1, borderBottomColor:Colors.border },
  backBtn:       { width:36, height:36, borderRadius:18, backgroundColor:Colors.bg, alignItems:'center', justifyContent:'center' },
  filterIconBtn: { width:36, height:36, borderRadius:18, backgroundColor:Colors.bg, alignItems:'center', justifyContent:'center' },
  searchWrap:    { paddingHorizontal:SIDE_PAD, paddingTop:Spacing.md, paddingBottom:0, backgroundColor:Colors.white },
  searchBar:     { flexDirection:'row', alignItems:'center', backgroundColor:Colors.bg, borderRadius:Radius.md, paddingHorizontal:14, paddingVertical:2, borderWidth:1.5, borderColor:Colors.border },
  searchInput:   { flex:1, fontSize:14, color:Colors.ink, marginLeft:8, paddingVertical:10, fontFamily:'PlusJakartaSans_400Regular' },
  pillsWrap:     { paddingHorizontal:SIDE_PAD, backgroundColor:Colors.white, paddingTop:Spacing.sm },
  sortWrap:      { flexDirection:'row', paddingHorizontal:SIDE_PAD, paddingVertical:Spacing.sm, gap:Spacing.xs, backgroundColor:Colors.white, borderBottomWidth:1, borderBottomColor:Colors.border },
  sortChip:      { paddingVertical:6, paddingHorizontal:12, borderRadius:Radius.full, borderWidth:1.5, borderColor:Colors.border, backgroundColor:Colors.white },
  sortChipActive: { backgroundColor:Colors.ink, borderColor:Colors.ink },
  countRow:      { paddingHorizontal:SIDE_PAD, paddingVertical:Spacing.sm },
  grid:          { paddingHorizontal:SIDE_PAD, paddingBottom:Spacing['5xl'] },
  empty:         { alignItems:'center', paddingVertical:Spacing['5xl'] },
  loadingWrap: { paddingVertical: Spacing['5xl'], alignItems: 'center', justifyContent: 'center' },
});
