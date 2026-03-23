// components/explore/BannerCarousel.tsx
import {
  View, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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

// ─── Featured card image area ─────────────────────────────────────────────────
// Uses a large icon + subtle geometric shapes as background pattern

function FeaturedCardImage({
  category,
  height,
}: {
  category: string;
  height:   number;
}) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.storage;

  return (
    <View style={[fi.wrap, { backgroundColor: cfg.bg, height }]}>
      {/* Decorative circles */}
      <View style={[fi.circle, fi.circleLg, { borderColor: cfg.color + '18' }]} />
      <View style={[fi.circle, fi.circleSm, { borderColor: cfg.color + '25' }]} />
      {/* Center icon */}
      <View style={[fi.iconWrap, { backgroundColor: cfg.color + '15', borderColor: cfg.color + '25' }]}>
        <Feather name={cfg.icon} size={40} color={cfg.color} />
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  circle:   { position: 'absolute', borderWidth: 1.5, borderRadius: 999 },
  circleLg: { width: 140, height: 140, top: -30, right: -30 },
  circleSm: { width: 80,  height: 80,  bottom: -20, left: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});

// ─── New listing card image area ──────────────────────────────────────────────

function NewCardImage({ category }: { category: string }) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.storage;
  return (
    <View style={[ni.wrap, { backgroundColor: cfg.bg }]}>
      <View style={[ni.circle, { borderColor: cfg.color + '20' }]} />
      <Feather name={cfg.icon} size={32} color={cfg.color} />
    </View>
  );
}

const ni = StyleSheet.create({
  wrap:   { height: 100, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  circle: { position: 'absolute', width: 70, height: 70, borderRadius: 35, borderWidth: 1.5, top: -10, right: -10 },
});

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
  return (
    <TouchableOpacity style={[fc.card, { width: FEAT_CARD_W }]} onPress={onPress} activeOpacity={0.92}>
      {/* Icon image area */}
      <FeaturedCardImage category={item.category} height={FEAT_CARD_H} />

      {/* Badge */}
      <View style={[fc.badge, { backgroundColor: badgeColor }]}>
        <AppText style={{ fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 }}>
          {badgeLabel}
        </AppText>
      </View>

      {/* Body */}
      <View style={fc.body}>
        <View style={fc.bodyTop}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ flex: 1 }}>
            {item.title}
          </AppText>
          <View style={fc.star}>
            <Feather name="star" size={10} color="#FFB800" />
            <AppText style={{ fontSize: 11, fontWeight: '700', marginLeft: 2, color: Colors.ink }}>
              {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
            </AppText>
          </View>
        </View>
        <AppText style={{ fontSize: 13, fontWeight: '800', color: Colors.ink, marginBottom: 5 }}>
          ₱{Number(item.price).toLocaleString()}
          <AppText style={{ fontSize: 11, fontWeight: '500', color: Colors.subtle }}>/{item.price_unit}</AppText>
        </AppText>
        <View style={fc.location}>
          <Feather name="map-pin" size={10} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.subtle} numberOfLines={1} style={{ marginLeft: 3, flex: 1 }}>
            {item.city}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:     { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  badge:    { position: 'absolute', top: 10, left: 10, paddingVertical: 4, paddingHorizontal: 9, borderRadius: Radius.full },
  body:     { padding: 12 },
  bodyTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 6 },
  star:     { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  location: { flexDirection: 'row', alignItems: 'center' },
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
    <TouchableOpacity style={[hc.card, { backgroundColor: color, width: HOST_CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      {/* Avatar */}
      <View style={hc.avatar}>
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 16 }}>{initials}</AppText>
      </View>

      {/* Star rating */}
      <View style={{ flexDirection: 'row', gap: 2, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Feather
            key={i}
            name="star"
            size={8}
            color={i <= Math.round(host.host_rating ?? 0)
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(255,255,255,0.3)'}
          />
        ))}
      </View>

      <AppText variant="caption" weight="bold" color={Colors.white} numberOfLines={1} style={{ marginBottom: 8, lineHeight: 16 }}>
        {host.full_name}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>
          {host.total_listings} listing{host.total_listings !== 1 ? 's' : ''}
        </AppText>
        <View style={hc.arrow}>
          <Feather name="arrow-right" size={10} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card:   { borderRadius: Radius.lg, padding: 12, flexShrink: 0, ...Shadow.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.2)' },
  arrow:  { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});

// ─── New listing card ─────────────────────────────────────────────────────────

function NewListingCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={[nc.card, { width: NEW_CARD_W }]} onPress={onPress} activeOpacity={0.9}>
      <NewCardImage category={item.category} />
      <View style={nc.body}>
        <AppText variant="caption" weight="bold" numberOfLines={2} style={{ lineHeight: 17, marginBottom: 6 }}>
          {item.title}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText style={{ fontSize: 13, fontWeight: '800', color: Colors.ink }}>
            ₱{Number(item.price).toLocaleString()}
            <AppText style={{ fontSize: 10, fontWeight: '500', color: Colors.subtle }}>/{item.price_unit}</AppText>
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="star" size={9} color="#FFB800" />
            <AppText style={{ fontSize: 10, fontWeight: '700', marginLeft: 2, color: Colors.ink }}>
              {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const nc = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', flexShrink: 0, ...Shadow.sm },
  body: { padding: 10 },
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
        <SectionSkeleton cardW={HOST_CARD_W} cardH={140} count={4} />
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
        <SectionSkeleton cardW={NEW_CARD_W} cardH={150} count={3} />
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