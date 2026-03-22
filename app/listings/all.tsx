// app/listings/all.tsx
import { useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText }            from '@/components/ui/AppText';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';
import { CategoryPills }      from '@/components/explore/CategoryPills';

import {
  LISTINGS, filterListings,
  type Category, type Listing,
} from '@/components/explore/exploreData';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD = Spacing.xl;
const CARD_GAP = Spacing.sm;

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

const SORT_OPTIONS = ['Nearest', 'Lowest price', 'Top rated', 'Most reviews'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  return [...listings].sort((a, b) => {
    if (sort === 'Nearest')      return a.distance - b.distance;
    if (sort === 'Lowest price') return a.price - b.price;
    if (sort === 'Top rated')    return b.rating - a.rating;
    if (sort === 'Most reviews') return b.reviewCount - a.reviewCount;
    return 0;
  });
}

export default function AllListingsScreen() {
  const router = useRouter();

  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState<Category>('all');
  const [radiusKm,      setRadiusKm]      = useState(10);
  const [saved,         setSaved]         = useState<Set<string>>(new Set());
  const [selected,      setSelected]      = useState<Listing | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sort,          setSort]          = useState<SortOption>('Nearest');
  const [pendingRadius,   setPendingRadius]   = useState(10);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  const base     = filterListings(LISTINGS, category, search, radiusKm, USER_LAT, USER_LNG);
  const filtered = sortListings(base, sort);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <AppText variant="h3" weight="extrabold" style={{ flex:1, marginLeft:Spacing.sm }}>
          All listings
        </AppText>
        <TouchableOpacity style={s.filterIconBtn} onPress={() => {
          setPendingRadius(radiusKm); setPendingCategory(category);
          setFilterVisible(true);
        }}>
          <Feather name="sliders" size={17} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Feather name="search" size={15} color={Colors.subtle} />
          <TextInput
            style={s.searchInput}
            placeholder="Search listings…"
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

      {/* Category pills */}
      <View style={s.pillsWrap}>
        <CategoryPills active={category} onChange={setCategory} />
      </View>

      {/* Sort strip */}
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

      {/* Result count */}
      <View style={s.countRow}>
        <AppText variant="caption" color={Colors.muted}>
          <AppText variant="caption" weight="bold" color={Colors.ink}>{filtered.length}</AppText>
          {' '}spaces within {radiusKm} km
        </AppText>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap:CARD_GAP, marginBottom:CARD_GAP }}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ flex:1 }}>
            <ListingCard
              item={item}
              saved={saved.has(item.id)}
              onSave={() => toggleSave(item.id)}
              onPress={() => setSelected(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <AppText style={{ fontSize:40 }}>🔍</AppText>
            <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
              No results
            </AppText>
            <AppText variant="body" color={Colors.muted} center style={{ marginTop:Spacing.sm }}>
              Try a wider radius or different category.
            </AppText>
          </View>
        }
      />

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
        listing={selected}
        saved={selected ? saved.has(selected.id) : false}
        onSave={() => selected && toggleSave(selected.id)}
        onClose={() => setSelected(null)}
        onBook={() => setSelected(null)}
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
});