// app/(tabs)/saved/index.tsx
import { useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText }            from '@/components/ui/AppText';
import { CATEGORY_CONFIG }    from '@/components/ui/CategoryIcon';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { useSaved }           from '@/hooks/useBookings';
import { useToast }           from '@/components/ui/Toast';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import type { SavedListingRow } from '@/lib/bookingsService';
import type { Listing } from '@/components/explore/exploreData';

const SIDE_PAD  = Spacing.xl;
const CARD_GAP  = Spacing.sm;

// ─── Map SavedListingRow → Listing ────────────────────────────────────────────

function toListingShape(item: SavedListingRow): Listing {
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;
  return {
    id:           item.listing_id,
    category:     item.category as any,
    title:        item.title,
    location:     item.address,
    address:      item.address,
    city:         item.city,
    distance:     0,
    lat:          item.lat,
    lng:          item.lng,
    price:        item.price,
    priceUnit:    item.price_unit,
    rating:       item.avg_rating,
    reviewCount:  item.review_count,
    isVerified:   item.host_is_verified,
    instantBook:  item.instant_book,
    hostName:     item.host_name,
    hostAvatar:   (item.host_name ?? 'H').split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2).toUpperCase(),
    amenities:    item.amenities ?? [],
    emoji:        '📦',
    bgColor:      cfg.bg ?? '#F0EDE6',
    coverPhotoUrl: item.cover_photo_url,
    photos:       item.photos ?? [],
    description:  item.description ?? 'No description provided.',
  };
}

// ─── Saved card ───────────────────────────────────────────────────────────────

function SavedCard({
  item, onPress, onRemove,
}: {
  item:     SavedListingRow;
  onPress:  () => void;
  onRemove: () => void;
}) {
  const cfg      = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;
  const imageUrl = item.cover_photo_url ?? item.photos?.[0] ?? null;

  return (
    <TouchableOpacity style={c.card} onPress={onPress} activeOpacity={0.9}>
      <View style={c.imgWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={c.photo} contentFit="cover" />
        ) : (
          <View style={[c.placeholder, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={30} color={cfg.color} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          locations={[0.38, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Heart / remove */}
        <TouchableOpacity style={c.heartBtn} onPress={onRemove} hitSlop={{ top:6, bottom:6, left:6, right:6 }}>
          <Feather name="heart" size={14} color="#FF4D4F" />
        </TouchableOpacity>

        {item.instant_book && (
          <View style={c.instantBadge}>
            <Feather name="zap" size={9} color={Colors.white} />
            <AppText style={{ fontSize:9, fontWeight:'800', color:Colors.white, marginLeft:3 }}>Instant</AppText>
          </View>
        )}

        <View style={c.content}>
          <AppText numberOfLines={1} style={c.title}>{item.title}</AppText>
          <AppText style={c.sub}>
            ₱{item.price.toLocaleString()}
            <AppText style={c.subUnit}>/{item.price_unit}</AppText>
          </AppText>
          <View style={c.bottom}>
            <View style={c.ratingRow}>
              <Feather name="star" size={10} color="#FFD700" />
              <AppText style={c.ratingText}>
                {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
              </AppText>
              {item.review_count > 0 && (
                <AppText style={c.reviewCount}>· {item.review_count}</AppText>
              )}
            </View>
            <View style={c.arrowBtn}>
              <Feather name="arrow-right" size={12} color="#000" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const c = StyleSheet.create({
  card:        { borderRadius: Radius.lg, overflow:'hidden', flex:1, backgroundColor:'#000', ...Shadow.md },
  imgWrapper:  { height: 220, position:'relative' },
  photo:       { width:'100%', height:'100%' },
  placeholder: { width:'100%', height:'100%', alignItems:'center', justifyContent:'center' },
  heartBtn:    { position:'absolute', top:10, right:10, width:30, height:30, borderRadius:15, backgroundColor:'rgba(255,255,255,0.18)', alignItems:'center', justifyContent:'center' },
  instantBadge:{ position:'absolute', top:10, left:10, flexDirection:'row', alignItems:'center', backgroundColor:Colors.teal, borderRadius:Radius.full, paddingVertical:3, paddingHorizontal:7 },
  content:     { position:'absolute', bottom:10, left:10, right:10 },
  title:       { color:'#fff', fontWeight:'bold', fontSize:13, marginBottom:2 },
  sub:         { color:'rgba(255,255,255,0.9)', fontSize:13, fontWeight:'800', marginBottom:5 },
  subUnit:     { fontSize:10, fontWeight:'500', color:'rgba(255,255,255,0.6)' },
  bottom:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  ratingRow:   { flexDirection:'row', alignItems:'center', flex:1 },
  ratingText:  { color:'#fff', fontWeight:'bold', fontSize:11, marginLeft:3 },
  reviewCount: { color:'rgba(255,255,255,0.65)', fontSize:10, marginLeft:3 },
  arrowBtn:    { width:24, height:24, borderRadius:12, backgroundColor:'#fff', alignItems:'center', justifyContent:'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { saved, isLoading, isRefreshing, error, refresh, toggleSave } = useSaved();
  const { show } = useToast();

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  function handleRemove(listingId: string) {
    toggleSave(listingId);
    show('Removed from saved', 'unsaved');
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <AppText variant="h2" weight="extrabold">Saved</AppText>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>
            Loading saved listings…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h2" weight="extrabold">Saved</AppText>
        <AppText variant="label" color={Colors.muted} style={{ marginTop: 2 }}>
          {saved.length} listing{saved.length !== 1 ? 's' : ''} saved
        </AppText>
      </View>

      {error ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={28} color={Colors.muted} />
          </View>
          <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>Something went wrong</AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <AppText variant="label" weight="bold" color={Colors.primary}>Try again</AppText>
          </TouchableOpacity>
        </View>
      ) : saved.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="heart" size={32} color={Colors.muted} />
          </View>
          <AppText variant="h2" weight="extrabold" center style={{ marginTop: Spacing.lg }}>
            Nothing saved yet
          </AppText>
          <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm, maxWidth: 260 }}>
            Tap the heart icon on any listing to save it here for later.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: CARD_GAP, marginBottom: CARD_GAP }}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.infoBanner}>
              <Feather name="info" size={14} color={Colors.teal} />
              <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 8, flex: 1 }}>
                Tap the heart to remove a listing from your saved collection.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <SavedCard
                item={item}
                onPress={() => setSelectedListing(toListingShape(item))}
                onRemove={() => handleRemove(item.listing_id)}
              />
            </View>
          )}
        />
      )}

      <ListingDetailSheet
        listing={selectedListing}
        saved={selectedListing ? true : false}
        onSave={() => {
          if (!selectedListing) return;
          toggleSave(selectedListing.id);
          show('Removed from saved', 'unsaved');
          setSelectedListing(null);
        }}
        onClose={() => setSelectedListing(null)}
        onBook={() => setSelectedListing(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  centerState:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  retryBtn:     { marginTop: Spacing.lg, paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  infoBanner:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.tealLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  grid:         { paddingHorizontal: SIDE_PAD, paddingTop: Spacing.md, paddingBottom: Spacing['5xl'] },
});
