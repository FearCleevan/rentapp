// app/(tabs)/explore/index.tsx
import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppText }            from '@/components/ui/AppText';
import { ExploreHeader }      from '@/components/explore/ExploreHeader';
import { BannerCarousel }     from '@/components/explore/BannerCarousel';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { RadiusFilterSheet }  from '@/components/explore/RadiusFilterSheet';

import {
  LISTINGS, filterListings,
  type Category, type Listing,
} from '@/components/explore/exploreData';

import { Colors, Spacing, Radius } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD  = Spacing.xl;   // 20 — must match header & banner
const CARD_GAP  = Spacing.sm;   // 8
const CARD_W    = (SCREEN_W - SIDE_PAD * 2 - CARD_GAP) / 2;

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

export default function ExploreScreen() {
  const router = useRouter();

  const [search,          setSearch]        = useState('');
  const [category,        setCategory]      = useState<Category>('all');
  const [radiusKm,        setRadiusKm]      = useState(5);
  const [saved,           setSaved]         = useState<Set<string>>(new Set());
  const [selectedListing, setSelected]      = useState<Listing | null>(null);
  const [filterVisible,   setFilterVisible] = useState(false);
  const [pendingRadius,   setPendingRadius]   = useState(5);
  const [pendingCategory, setPendingCategory] = useState<Category>('all');

  const filtered = filterListings(LISTINGS, category, search, radiusKm, USER_LAT, USER_LNG);

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
    setRadiusKm(5); setCategory('all');
    setFilterVisible(false);
  }

  // ── List header ──────────────────────────────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View style={styles.headerWrap}>
      <BannerCarousel
        onListingPress={(id) => {
          const found = LISTINGS.find(l => l.id === id);
          if (found) setSelected(found);
        }}
      />

      {/* "All Listings" row — spaced exactly like a SectionRow in BannerCarousel */}
      <View style={styles.allListingsRow}>
        <View>
          <AppText variant="h2" weight="extrabold">All listings</AppText>
          <AppText variant="caption" color={Colors.subtle} style={{ marginTop:1 }}>
            {filtered.length} spaces · {radiusKm} km radius
          </AppText>
        </View>
        <View style={styles.allListingsActions}>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/listings/all')}
            activeOpacity={0.8}
          >
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              See all
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8}>
            <Feather name="map" size={12} color={Colors.muted} />
            <AppText variant="caption" weight="semibold" color={Colors.muted} style={{ marginLeft:4 }}>
              Map
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [filtered.length, radiusKm]);

  // ── 2-column grid item ───────────────────────────────────────────────────────
  function renderItem({ item }: { item: Listing }) {
    return (
      <View style={styles.cardWrap}>
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

      {/* ── Sticky header ── */}
      <ExploreHeader
        search={search}
        category={category}
        radiusKm={radiusKm}
        onSearch={setSearch}
        onCategory={setCategory}
        onFilter={openFilter}
        onNotif={() => {}}
      />

      {/* ── Content ── */}
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
            <AppText style={{ fontSize:40 }}>🔍</AppText>
            <AppText variant="h3" weight="bold" center style={{ marginTop:Spacing.md }}>
              No listings found
            </AppText>
            <AppText
              variant="body"
              color={Colors.muted}
              center
              style={{ marginTop:Spacing.sm, maxWidth:240 }}
            >
              Try widening your search radius or picking a different category.
            </AppText>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetFilter}
              activeOpacity={0.85}
            >
              <AppText variant="label" weight="bold" color={Colors.primary}>
                Reset filters
              </AppText>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },

  // headerWrap: same horizontal padding as listContent so sections align
  headerWrap: {
    paddingHorizontal: SIDE_PAD,
    paddingTop:        Spacing.lg,   // 16px top — breathing room after sticky header
  },

  // All Listings header row — visually identical to SectionRow inside BannerCarousel
  allListingsRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginTop:      Spacing['2xl'],  // same spacing as between banner sections
    marginBottom:   Spacing.md,     // 12px before first card row
  },
  allListingsActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,      // 8px gap between buttons
    marginTop:     3,               // nudge down to optical-align with title baseline
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

  // FlatList grid
  listContent: {
    paddingHorizontal: SIDE_PAD,    // 20 — matches headerWrap & banner
    paddingBottom:     Spacing['5xl'],
  },
  colWrapper: {
    gap:          CARD_GAP,         // 8px between columns
    marginBottom: CARD_GAP,         // 8px between rows
  },
  cardWrap: { flex:1 },

  empty: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
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