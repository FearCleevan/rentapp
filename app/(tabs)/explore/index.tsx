// app/(tabs)/explore/index.tsx
import { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { BannerCarousel }     from '@/components/explore/BannerCarousel';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';
import { CategoryPills }      from '@/components/explore/CategoryPills';

import {
  LISTINGS,
  filterListings,
  type Category,
  type Listing,
} from '@/components/explore/exploreData';

import { Colors, Spacing, Radius } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;
const CARD_W   = (SCREEN_W - Spacing.xl * 2 - CARD_GAP) / 2;

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

export default function ExploreScreen() {
  const [search,          setSearch]         = useState('');
  const [category,        setCategory]       = useState<Category>('all');
  const [radiusKm,        setRadiusKm]       = useState(5);
  const [saved,           setSaved]          = useState<Set<string>>(new Set());
  const [selectedListing, setSelected]       = useState<Listing | null>(null);
  const [filterVisible,   setFilterVisible]  = useState(false);
  const [searchFocused,   setSearchFocused]  = useState(false);

  // Pending filter (only applied on "Apply")
  const [pendingRadius,   setPendingRadius]   = useState(5);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  const filtered = filterListings(
    LISTINGS, category, search, radiusKm, USER_LAT, USER_LNG
  );

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
    setPendingRadius(5);
    setPendingCategory('all');
    setRadiusKm(5);
    setCategory('all');
    setFilterVisible(false);
  }

  // ── Sticky top bar (minimal — Discover title is inside BannerCarousel) ──────
  const StickyBar = useCallback(() => (
    <View style={styles.stickyBar}>
      {/* Search input */}
      <View style={[
        styles.searchBar,
        searchFocused && styles.searchBarFocused,
      ]}>
        <Feather name="search" size={16} color={Colors.subtle} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parking, rooms, cars…"
          placeholderTextColor={Colors.subtle}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top:6, bottom:6, left:6, right:6 }}>
            <Feather name="x" size={15} color={Colors.subtle} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterBtn} onPress={openFilter} activeOpacity={0.85}>
          <Feather name="sliders" size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <CategoryPills active={category} onChange={setCategory} />
    </View>
  ), [search, category, searchFocused]);

  // ── List header: BannerCarousel sections ────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View style={styles.listHeaderWrap}>
      <BannerCarousel onListingPress={(id) => {
        const found = LISTINGS.find(l => l.id === id);
        if (found) setSelected(found);
      }} />

      {/* Results strip */}
      <View style={styles.resultsRow}>
        <AppText variant="label" color={Colors.muted}>
          <AppText variant="label" weight="bold" color={Colors.ink}>
            {filtered.length}
          </AppText>
          {' '}spaces within {radiusKm} km
        </AppText>
        <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8}>
          <Feather name="map" size={13} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            Map
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  ), [filtered.length, radiusKm]);

  // ── 2-column renderer ───────────────────────────────────────────────────────
  function renderItem({ item, index }: { item: Listing; index: number }) {
    return (
      <View style={[styles.cardWrap, index % 2 === 0 ? styles.cardLeft : styles.cardRight]}>
        <ListingCard
          item={item}
          saved={saved.has(item.id)}
          onSave={() => toggleSave(item.id)}
          onPress={() => setSelected(item)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Sticky search + category bar */}
      <StickyBar />

      {/* Main scrollable content */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.colWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={{ fontSize: 44 }}>🔍</AppText>
            <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>
              No listings found
            </AppText>
            <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm, maxWidth: 260 }}>
              Try increasing your search radius or changing the category.
            </AppText>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilter} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.primary}>Reset filters</AppText>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter sheet */}
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

      {/* Detail sheet */}
      <ListingDetailSheet
        listing={selectedListing}
        saved={selectedListing ? saved.has(selectedListing.id) : false}
        onSave={() => selectedListing && toggleSave(selectedListing.id)}
        onClose={() => setSelected(null)}
        onBook={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Sticky search bar at top
  stickyBar: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg,
    borderRadius:      Radius.md,
    paddingHorizontal: 14,
    paddingVertical:   2,
    marginBottom:      Spacing.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },
  searchBarFocused: {
    borderColor:     Colors.primary,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex:            1,
    fontSize:        14,
    color:           Colors.ink,
    marginLeft:      8,
    paddingVertical: 10,
    fontFamily:      'PlusJakartaSans_400Regular',
  },
  filterBtn: {
    width:           34,
    height:          34,
    borderRadius:    8,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      8,
  },

  // List header area
  listHeaderWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.xl,
  },
  resultsRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
  },
  mapBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.primary,
  },

  // Grid
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing['5xl'],
  },
  colWrapper: {
    gap:          CARD_GAP,
    marginBottom: CARD_GAP,
  },
  cardWrap:  { flex: 1 },
  cardLeft:  {},
  cardRight: {},

  empty: {
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