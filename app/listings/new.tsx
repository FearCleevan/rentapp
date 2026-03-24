import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText }            from '@/components/ui/AppText';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { CATEGORY_CONFIG }    from '@/components/ui/CategoryIcon';
import { fetchNewListings, type ListingRow } from '@/lib/listingsService';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const USER_LAT = 7.0831;
const USER_LNG = 125.6026;

export default function NewListingsScreen() {
  const router = useRouter();
  const [saved,    setSaved]    = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ListingRow | null>(null);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await fetchNewListings(12);
      if (!mounted) return;
      setListings(data ?? []);
      setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const mappedSelected = useMemo(() => selected ? ({
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
  }) : null, [selected]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex:1, marginLeft:Spacing.sm }}>
          <AppText variant="h3" weight="extrabold">New in Davao</AppText>
          <AppText variant="caption" color={Colors.subtle}>Recently added listings</AppText>
        </View>
      </View>

      <View style={s.banner}>
        <View style={s.bannerIcon}>
          <Feather name="zap" size={16} color={Colors.primary} />
        </View>
        <View style={{ flex:1, marginLeft:Spacing.sm }}>
          <AppText variant="label" weight="bold">Fresh listings</AppText>
          <AppText variant="caption" color={Colors.muted}>
            These spaces were added in the last 30 days.
          </AppText>
        </View>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
        >
          <View style={s.gridInner}>
            {listings.map((item, idx) => {
              const mapped = {
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
                hostAvatar: item.host_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
                amenities: item.amenities ?? [],
                emoji: '📦',
                bgColor: CATEGORY_CONFIG[item.category]?.bg ?? '#F0EDE6',
                coverPhotoUrl: item.cover_photo_url,
                photos: item.photos ?? [],
                description: item.description ?? 'No description provided.',
              };
              return (
                <View key={item.id} style={s.cardWrap}>
                  {idx < 3 && (
                    <View style={s.newBadge}>
                      <AppText style={{ fontSize:9, fontWeight:'800', color:Colors.white, letterSpacing:0.5 }}>
                        NEW
                      </AppText>
                    </View>
                  )}
                  <ListingCard
                    item={mapped}
                    saved={saved.has(item.id)}
                    onSave={() => toggleSave(item.id)}
                    onPress={() => setSelected(item)}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <ListingDetailSheet
        listing={mappedSelected}
        saved={selected ? saved.has(selected.id) : false}
        onSave={() => selected && toggleSave(selected.id)}
        onClose={() => setSelected(null)}
        onBook={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

const SIDE_PAD = Spacing.xl;
const CARD_GAP = Spacing.sm;

const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:Colors.bg },
  header: {
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:SIDE_PAD, paddingVertical:Spacing.md,
    backgroundColor:Colors.white,
    borderBottomWidth:1, borderBottomColor:Colors.border,
  },
  backBtn: {
    width:36, height:36, borderRadius:18,
    backgroundColor:Colors.bg,
    alignItems:'center', justifyContent:'center',
  },
  banner: {
    flexDirection:'row', alignItems:'center',
    margin:SIDE_PAD, marginBottom:0,
    backgroundColor:Colors.primaryLight,
    borderRadius:Radius.md,
    padding:Spacing.md,
  },
  bannerIcon: {
    width:34, height:34, borderRadius:10,
    backgroundColor:Colors.white,
    alignItems:'center', justifyContent:'center',
    ...Shadow.sm,
  },
  grid:      { paddingHorizontal:SIDE_PAD, paddingTop:Spacing.lg, paddingBottom:Spacing['5xl'] },
  gridInner: { flexDirection:'row', flexWrap:'wrap', gap:CARD_GAP },
  cardWrap:  { width:'50%', position:'relative', paddingRight: CARD_GAP / 2 },
  newBadge: {
    position:'absolute', top:8, left:8, zIndex:10,
    backgroundColor:Colors.primary,
    paddingVertical:3, paddingHorizontal:7,
    borderRadius:Radius.full,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
