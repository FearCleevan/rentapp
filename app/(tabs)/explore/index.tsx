// app/(tabs)/explore/index.tsx
import { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { AppText }            from '@/components/ui/AppText';
import { ExploreHeader }      from '@/components/explore/ExploreHeader';
import { BannerCarousel }     from '@/components/explore/BannerCarousel';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';

import {
  LISTINGS,
  filterListings,
  type Category,
  type Listing,
} from '@/components/explore/exploreData';

import { Colors, Spacing, Radius } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = Spacing.sm;

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

export default function ExploreScreen() {
  const [search,          setSearch]        = useState('');
  const [category,        setCategory]      = useState<Category>('all');
  const [radiusKm,        setRadiusKm]      = useState(5);
  const [saved,           setSaved]         = useState<Set<string>>(new Set());
  const [selectedListing, setSelected]      = useState<Listing | null>(null);
  const [filterVisible,   setFilterVisible] = useState(false);

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

  // ── List header ──────────────────────────────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View style={styles.listHeaderWrap}>
      <BannerCarousel
        onListingPress={(id) => {
          const found = LISTINGS.find(l => l.id === id);
          if (found) setSelected(found);
        }}
      />

      {/* "All Listings" section header with See all + Map view */}
      <View style={styles.allListingsHeader}>
        <View style={styles.allListingsLeft}>
          <AppText variant="h2" weight="extrabold">All listings</AppText>
          <AppText variant="caption" color={Colors.subtle} style={{ marginTop:2 }}>
            {filtered.length} spaces within {radiusKm} km
          </AppText>
        </View>
        <View style={styles.allListingsRight}>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.8}>
            <AppText variant="label" weight="bold" color={Colors.primary}>See all</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8}>
            <Feather name="map" size={13} color={Colors.primary} />
            <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft:4 }}>
              Map
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [filtered.length, radiusKm]);

  // ── 2-column renderer ────────────────────────────────────────────────────────
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

      {/* Sticky header — location, greeting, search, category pills */}
      <ExploreHeader
        search={search}
        category={category}
        radiusKm={radiusKm}
        onSearch={setSearch}
        onCategory={setCategory}
        onFilter={openFilter}
        onNotif={() => {}}
      />

      {/* Scrollable body */}
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
            <AppText style={{ fontSize:44 }}>🔍</AppText>
            <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
              No listings found
            </AppText>
            <AppText variant="body" color={Colors.muted} center style={{ marginTop:Spacing.sm, maxWidth:260 }}>
              Try increasing your search radius or changing the category.
            </AppText>
            <TouchableOpacity style={styles.resetBtn} onPress={resetFilter} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.primary}>Reset filters</AppText>
            </TouchableOpacity>
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
        onReset={resetFilter}
        onApply={applyFilter}
      />

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
  safe: { flex:1, backgroundColor:Colors.bg },

  listHeaderWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
  },

  // "All listings" row — title + subtitle on left, See all + Map on right
  allListingsHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
    marginTop:      Spacing['2xl'],
  },
  allListingsLeft: {
    flex: 1,
  },
  allListingsRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginTop:     2,
  },
  seeAllBtn: {
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.primary,
  },
  mapBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing['5xl'],
  },
  colWrapper: {
    gap:          CARD_GAP,
    marginBottom: CARD_GAP,
  },
  cardWrap:  { flex:1 },
  cardLeft:  {},
  cardRight: {},

  empty: {
    alignItems:      'center',
    justifyContent:  'center',
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