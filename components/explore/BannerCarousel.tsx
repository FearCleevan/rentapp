// components/explore/BannerCarousel.tsx
import {
  View, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import type { DiscoverData } from '@/hooks/useListings';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE_PAD    = Spacing.xl;
const CARD_GAP    = Spacing.sm;
const FEAT_CARD_W = SCREEN_W * 0.56;
const FEAT_CARD_H = 176;
const NEW_CARD_W  = SCREEN_W * 0.43;
const HOST_CARD_W = 110;

const BADGE_COLORS  = ['#FF6B35', '#0D9E75', '#534AB7', '#C0480A', '#1A1A2E'];
const BADGE_LABELS  = ['Hot this Month', 'Great Value', 'Top Rated', 'Popular', 'Staff Pick', 'New'];
const HOST_COLORS   = ['#FF6B35', '#534AB7', '#0D9E75', '#C0480A', '#1A1A2E'];

type FeatherName = React.ComponentProps<typeof Feather>['name'];

// (FeaturedCardImage and NewCardImage replaced by inline gradient overlays below)

// ─── Section header ───────────────────────────────────────────────────────────

function SectionRow({ title, linkLabel = 'See all', onLink, mt = 0 }: {
  title: string; linkLabel?: string; onLink?: () => void; mt?: number;
}) {
  return (
    <View style={[sr.row, { marginTop: mt }]}>
      <AppText variant="h2" weight="extrabold">{title}</AppText>
      <TouchableOpacity onPress={onLink} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
        <AppText variant="label" weight="bold" color={Colors.primary}>{linkLabel}</AppText>
      </TouchableOpacity>
    </View>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
});

// ─── Horizontal scroll wrapper ────────────────────────────────────────────────

function HScroll({ children, snap }: { children: React.ReactNode; snap?: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snap ? snap + CARD_GAP : undefined}
      snapToAlignment="start"
      contentContainerStyle={{ paddingRight: SIDE_PAD, gap: CARD_GAP }}
      style={{ overflow: 'visible' }}
    >
      {children}
    </ScrollView>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SectionSkeleton({ cardW, cardH, count = 3 }: { cardW: number; cardH: number; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: CARD_GAP }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width:           cardW,
            height:          cardH,
            borderRadius:    Radius.lg,
            backgroundColor: Colors.border,
            opacity:         1 - i * 0.2,
          }}
        />
      ))}
    </View>
  );
}

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ item, badgeLabel, badgeColor, onPress }: {
  item:       any;
  badgeLabel: string;
  badgeColor: string;
  onPress:    () => void;
}) {
  const imageUrl = item.cover_photo_url ?? item.photos?.[0] ?? null;
  const cfg      = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <TouchableOpacity style={[fc.card, { width: FEAT_CARD_W }]} onPress={onPress} activeOpacity={0.92}>
      <View style={fc.imgWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={fc.photo} contentFit="cover" />
        ) : (
          <View style={[fc.placeholder, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={36} color={cfg.color} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.68)']}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Badge */}
        <View style={[fc.badge, { backgroundColor: badgeColor }]}>
          <AppText style={{ fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>
            {badgeLabel}
          </AppText>
        </View>

        {/* Overlay content */}
        <View style={fc.content}>
          <AppText numberOfLines={1} style={fc.title}>{item.title}</AppText>
          <AppText style={fc.sub}>
            ₱{Number(item.price).toLocaleString()}
            <AppText style={fc.subUnit}>/{item.price_unit}</AppText>
          </AppText>
          <View style={fc.bottom}>
            <View style={fc.ratingRow}>
              <Feather name="star" size={10} color="#FFD700" />
              <AppText style={fc.ratingText}>
                {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
              </AppText>
              <Feather name="map-pin" size={9} color="rgba(255,255,255,0.6)" style={{ marginLeft: 6 }} />
              <AppText numberOfLines={1} style={fc.city}>{item.city}</AppText>
            </View>
            <View style={fc.arrowBtn}>
              <Feather name="arrow-right" size={12} color="#000" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:       { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000', ...Shadow.md },
  imgWrapper: { height: FEAT_CARD_H + 80, position: 'relative' },
  photo:      { width: '100%', height: '100%' },
  placeholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  badge:      { position: 'absolute', top: 10, left: 10, paddingVertical: 4, paddingHorizontal: 9, borderRadius: Radius.full },
  content:    { position: 'absolute', bottom: 10, left: 10, right: 10 },
  title:      { color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 3 },
  sub:        { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800', marginBottom: 6 },
  subUnit:    { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  bottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 11, marginLeft: 3 },
  city:       { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginLeft: 3, flex: 1 },
  arrowBtn:   { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});

// ─── Top Host card ────────────────────────────────────────────────────────────

function TopHostCard({ host, index, onPress }: { host: any; index: number; onPress: () => void }) {
  const color    = HOST_COLORS[index % HOST_COLORS.length];
  const initials = (host.full_name ?? 'H')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={[hc.card, { width: HOST_CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      <View style={hc.imgWrapper}>
        {host.avatar_url ? (
          <Image source={{ uri: host.avatar_url }} style={hc.photo} contentFit="cover" />
        ) : (
          <View style={[hc.placeholder, { backgroundColor: color }]}>
            <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 22 }}>{initials}</AppText>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          locations={[0.25, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={hc.content}>
          <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <Feather
                key={i}
                name="star"
                size={8}
                color={i <= Math.round(host.host_rating ?? 0) ? '#FFD700' : 'rgba(255,255,255,0.3)'}
              />
            ))}
          </View>
          <AppText variant="caption" weight="bold" color={Colors.white} numberOfLines={1} style={{ lineHeight: 15, marginBottom: 3 }}>
            {host.full_name}
          </AppText>
          <AppText style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
            {host.total_listings} listing{host.total_listings !== 1 ? 's' : ''}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card:       { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0, ...Shadow.sm },
  imgWrapper: { height: 150, position: 'relative' },
  photo:      { width: '100%', height: '100%' },
  placeholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  content:    { position: 'absolute', bottom: 10, left: 10, right: 10 },
});

// ─── New listing card ─────────────────────────────────────────────────────────

function NewListingCard({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUrl = item.cover_photo_url ?? item.photos?.[0] ?? null;
  const cfg      = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <TouchableOpacity style={[nc.card, { width: NEW_CARD_W }]} onPress={onPress} activeOpacity={0.9}>
      <View style={nc.imgWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={nc.photo} contentFit="cover" />
        ) : (
          <View style={[nc.placeholder, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={28} color={cfg.color} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.68)']}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={nc.content}>
          <AppText numberOfLines={2} style={nc.title}>{item.title}</AppText>
          <View style={nc.bottom}>
            <AppText style={nc.price}>
              ₱{Number(item.price).toLocaleString()}
              <AppText style={nc.priceUnit}>/{item.price_unit}</AppText>
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="star" size={9} color="#FFD700" />
              <AppText style={nc.ratingText}>
                {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const nc = StyleSheet.create({
  card:       { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000', flexShrink: 0, ...Shadow.sm },
  imgWrapper: { height: 175, position: 'relative' },
  photo:      { width: '100%', height: '100%' },
  placeholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  content:    { position: 'absolute', bottom: 10, left: 10, right: 10 },
  title:      { color: '#fff', fontWeight: 'bold', fontSize: 12, marginBottom: 5, lineHeight: 16 },
  bottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:      { color: '#fff', fontSize: 13, fontWeight: '800' },
  priceUnit:  { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 10, marginLeft: 3 },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySection({ icon, message }: { icon: FeatherName; message: string }) {
  return (
    <View style={empty.wrap}>
      <Feather name={icon} size={20} color={Colors.subtle} />
      <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 8 }}>{message}</AppText>
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md },
});

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  discoverData:    DiscoverData | null;
  discoverLoading: boolean;
  onListingPress:  (listingId: string) => void;
}

export function BannerCarousel({ discoverData, discoverLoading, onListingPress }: Props) {
  const router = useRouter();

  const featured = discoverData?.featured ?? [];
  const newItems = discoverData?.newItems ?? [];
  const topHosts = discoverData?.topHosts ?? [];

  return (
    <View>
      {/* ── Discover ── */}
      <SectionRow title="Discover" onLink={() => router.push('/listings/all')} />
      {discoverLoading ? (
        <SectionSkeleton cardW={FEAT_CARD_W} cardH={FEAT_CARD_H + 80} count={3} />
      ) : featured.length === 0 ? (
        <EmptySection icon="home" message="No listings yet — be the first to list!" />
      ) : (
        <HScroll snap={FEAT_CARD_W}>
          {featured.map((item, i) => (
            <FeaturedCard
              key={item.id}
              item={item}
              badgeLabel={BADGE_LABELS[i % BADGE_LABELS.length]}
              badgeColor={BADGE_COLORS[i % BADGE_COLORS.length]}
              onPress={() => onListingPress(item.id)}
            />
          ))}
        </HScroll>
      )}

      {/* ── Top Hosts ── */}
      <SectionRow title="Top Hosts" mt={Spacing['2xl']} onLink={() => router.push('/hosts/all')} />
      {discoverLoading ? (
        <SectionSkeleton cardW={HOST_CARD_W} cardH={150} count={4} />
      ) : topHosts.length === 0 ? (
        <EmptySection icon="users" message="No hosts yet." />
      ) : (
        <HScroll>
          {topHosts.map((host, i) => (
            <TopHostCard
              key={host.id}
              host={host}
              index={i}
              onPress={() => router.push(`/hosts/${host.id}`)}
            />
          ))}
        </HScroll>
      )}

      {/* ── New in Davao ── */}
      <SectionRow title="New in Davao" mt={Spacing['2xl']} onLink={() => router.push('/listings/new')} />
      {discoverLoading ? (
        <SectionSkeleton cardW={NEW_CARD_W} cardH={175} count={3} />
      ) : newItems.length === 0 ? (
        <EmptySection icon="plus-circle" message="No new listings yet." />
      ) : (
        <HScroll snap={NEW_CARD_W}>
          {newItems.map(item => (
            <NewListingCard
              key={item.id}
              item={item}
              onPress={() => onListingPress(item.id)}
            />
          ))}
        </HScroll>
      )}
    </View>
  );
}
