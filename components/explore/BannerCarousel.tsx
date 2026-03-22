// components/explore/BannerCarousel.tsx
import {
  View, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import type { DiscoverData } from '@/hooks/useListings';

const { width: SCREEN_W } = Dimensions.get('window');

const SIDE_PAD    = Spacing.xl;
const CARD_GAP    = Spacing.sm;
const FEAT_CARD_W = SCREEN_W * 0.56;
const FEAT_CARD_H = 176;
const NEW_CARD_W  = SCREEN_W * 0.43;
const HOST_CARD_W = 110;

// ─── Category → emoji + bg color mapping ─────────────────────────────────────

const CATEGORY_STYLE: Record<string, { emoji: string; bg: string; pattern: string }> = {
  parking:     { emoji: '🅿️', bg: '#EDE8E0', pattern: 'parking'  },
  room:        { emoji: '🏠', bg: '#E4EDE0', pattern: 'room'     },
  vehicle:     { emoji: '🚗', bg: '#E8E6F5', pattern: 'vehicle'  },
  equipment:   { emoji: '📷', bg: '#E8E4F0', pattern: 'equipment'},
  venue:       { emoji: '🎪', bg: '#F0E4DC', pattern: 'venue'    },
  meeting_room:{ emoji: '🏢', bg: '#DDE8EC', pattern: 'meeting'  },
  storage:     { emoji: '📦', bg: '#EDE8E0', pattern: 'storage'  },
};

const BADGE_COLORS = ['#FF6B35', '#0D9E75', '#534AB7', '#C0480A', '#1A1A2E'];

// ─── Card pattern backgrounds ─────────────────────────────────────────────────

function CardPattern({ pattern, bg }: { pattern: string; bg: string }) {
  const map: Record<string, React.ReactNode> = {
    parking: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000009', width:140, height:140, borderRadius:70, top:-35, right:-35 }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:90,  height:90,  borderRadius:45, bottom:-22, left:18  }]} />
        <AppText style={p.emoji}>🅿️</AppText>
      </View>
    ),
    room: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000009', width:110, height:110, borderRadius:14, top:8, right:18, transform:[{rotate:'18deg'}] }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:75,  height:75,  borderRadius:10, bottom:8, right:55, transform:[{rotate:'8deg'}] }]} />
        <AppText style={p.emoji}>🏠</AppText>
      </View>
    ),
    vehicle: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000010', width:220, height:85, borderRadius:42, top:18, left:-45 }]} />
        <AppText style={p.emoji}>🚗</AppText>
      </View>
    ),
    venue: (
      <View style={[p.base, { backgroundColor: bg }]}>
        {[0,1,2,3,4,5].map(i => (
          <View key={i} style={[p.s, { backgroundColor:'#00000008', width:5, height:FEAT_CARD_H, left:16 + i*24, top:0 }]} />
        ))}
        <AppText style={p.emoji}>🎪</AppText>
      </View>
    ),
    equipment: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000009', width:100, height:100, borderRadius:50, top:-20, right:20 }]} />
        <AppText style={p.emoji}>📷</AppText>
      </View>
    ),
    meeting: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000008', width:180, height:60, borderRadius:8, top:30, left:-20 }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:150, height:60, borderRadius:8, bottom:30, right:-20 }]} />
        <AppText style={p.emoji}>🏢</AppText>
      </View>
    ),
  };
  return <>{map[pattern] ?? map.parking}</>;
}

const p = StyleSheet.create({
  base:  { flex:1, overflow:'hidden', alignItems:'center', justifyContent:'center', position:'relative' },
  s:     { position:'absolute' },
  emoji: { fontSize:50, zIndex:1 },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionRow({ title, linkLabel = 'See all', onLink, mt = 0 }: {
  title: string; linkLabel?: string; onLink?: () => void; mt?: number;
}) {
  return (
    <View style={[sr.row, { marginTop: mt }]}>
      <AppText variant="h2" weight="extrabold">{title}</AppText>
      <TouchableOpacity onPress={onLink} hitSlop={{ top:10, bottom:10, left:10, right:10 }} activeOpacity={0.7}>
        <AppText variant="label" weight="bold" color={Colors.primary}>{linkLabel}</AppText>
      </TouchableOpacity>
    </View>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:Spacing.md },
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

// ─── Section skeleton (while loading) ────────────────────────────────────────

function SectionSkeleton({ cardW, cardH, count = 3 }: { cardW: number; cardH: number; count?: number }) {
  return (
    <View style={{ flexDirection:'row', gap: CARD_GAP }}>
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

function FeaturedCard({
  item,
  badgeLabel,
  badgeColor,
  onPress,
}: {
  item:        any;
  badgeLabel:  string;
  badgeColor:  string;
  onPress:     () => void;
}) {
  const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.parking;

  return (
    <TouchableOpacity style={[fc.card, { width: FEAT_CARD_W }]} onPress={onPress} activeOpacity={0.92}>
      <View style={[fc.img, { height: FEAT_CARD_H }]}>
        {item.cover_photo_url ? (
          // When you add expo-image, replace this placeholder with <Image>
          <View style={[p.base, { backgroundColor: catStyle.bg }]}>
            <AppText style={p.emoji}>{catStyle.emoji}</AppText>
          </View>
        ) : (
          <CardPattern pattern={catStyle.pattern} bg={catStyle.bg} />
        )}
        <View style={[fc.badge, { backgroundColor: badgeColor }]}>
          <AppText style={{ fontSize:9, fontWeight:'800', color:'#fff', letterSpacing:0.4 }}>
            {badgeLabel}
          </AppText>
        </View>
      </View>
      <View style={fc.body}>
        <View style={fc.bodyTop}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ flex:1 }}>{item.title}</AppText>
          <View style={fc.star}>
            <Feather name="star" size={10} color="#FFB800" />
            <AppText style={{ fontSize:11, fontWeight:'700', marginLeft:2, color: Colors.ink }}>
              {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
            </AppText>
          </View>
        </View>
        <View style={fc.bodyBottom}>
          <AppText style={{ fontSize:13, fontWeight:'800', color: Colors.ink }}>
            ₱{Number(item.price).toLocaleString()}
            <AppText style={{ fontSize:11, fontWeight:'500', color: Colors.subtle }}>/{item.price_unit}</AppText>
          </AppText>
        </View>
        <View style={fc.location}>
          <Feather name="map-pin" size={10} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.subtle} numberOfLines={1} style={{ marginLeft:3, flex:1 }}>
            {item.city}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:       { backgroundColor:Colors.white, borderRadius:Radius.lg, overflow:'hidden', ...Shadow.md },
  img:        { overflow:'hidden', position:'relative' },
  badge:      { position:'absolute', top:10, left:10, paddingVertical:4, paddingHorizontal:9, borderRadius:Radius.full },
  body:       { padding:12 },
  bodyTop:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:4, gap:6 },
  star:       { flexDirection:'row', alignItems:'center', flexShrink:0 },
  bodyBottom: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 },
  location:   { flexDirection:'row', alignItems:'center' },
});

// ─── Top Host card ────────────────────────────────────────────────────────────

const HOST_COLORS = ['#FF6B35', '#534AB7', '#0D9E75', '#C0480A', '#1A1A2E'];

function TopHostCard({ host, index, onPress }: { host: any; index: number; onPress: () => void }) {
  const color   = HOST_COLORS[index % HOST_COLORS.length];
  const initials = (host.full_name ?? 'H')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={[hc.card, { backgroundColor: color, width: HOST_CARD_W }]} onPress={onPress} activeOpacity={0.88}>
      <View style={[hc.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize:16 }}>{initials}</AppText>
      </View>
      <View style={{ flexDirection:'row', gap:2, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => (
          <Feather key={i} name="star" size={8}
            color={i <= Math.round(host.host_rating ?? 0) ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)'}
          />
        ))}
      </View>
      <AppText variant="caption" weight="bold" color={Colors.white} numberOfLines={1} style={{ marginBottom:8, lineHeight:16 }}>
        {host.full_name}
      </AppText>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <AppText style={{ fontSize:10, color:'rgba(255,255,255,0.75)' }}>
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
  card:   { borderRadius:Radius.lg, padding:12, flexShrink:0, ...Shadow.sm },
  avatar: { width:52, height:52, borderRadius:26, alignItems:'center', justifyContent:'center', marginBottom:8, borderWidth:2, borderColor:'rgba(255,255,255,0.28)' },
  arrow:  { width:20, height:20, borderRadius:10, backgroundColor:Colors.white, alignItems:'center', justifyContent:'center' },
});

// ─── New listing card ─────────────────────────────────────────────────────────

function NewListingCard({ item, onPress }: { item: any; onPress: () => void }) {
  const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.parking;

  return (
    <TouchableOpacity style={[nc.card, { width: NEW_CARD_W }]} onPress={onPress} activeOpacity={0.9}>
      <View style={[nc.img, { backgroundColor: catStyle.bg }]}>
        <AppText style={{ fontSize:34 }}>{catStyle.emoji}</AppText>
      </View>
      <View style={nc.body}>
        <AppText variant="caption" weight="bold" numberOfLines={2} style={{ lineHeight:17, marginBottom:6 }}>
          {item.title}
        </AppText>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <AppText style={{ fontSize:13, fontWeight:'800', color: Colors.ink }}>
            ₱{Number(item.price).toLocaleString()}
            <AppText style={{ fontSize:10, fontWeight:'500', color: Colors.subtle }}>/{item.price_unit}</AppText>
          </AppText>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <Feather name="star" size={9} color="#FFB800" />
            <AppText style={{ fontSize:10, fontWeight:'700', marginLeft:2, color: Colors.ink }}>
              {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const nc = StyleSheet.create({
  card: { backgroundColor:Colors.white, borderRadius:Radius.lg, overflow:'hidden', flexShrink:0, ...Shadow.sm },
  img:  { height:100, alignItems:'center', justifyContent:'center' },
  body: { padding:10 },
});

// ─── Main exported component ──────────────────────────────────────────────────

interface Props {
  discoverData:      DiscoverData | null;
  discoverLoading:   boolean;
  onListingPress:    (listingId: string) => void;
}

const BADGE_LABELS = ['Hot this Month', 'Great Value', 'Top Rated', 'Popular', 'Staff Pick', 'New'];

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
        <View style={empty.wrap}>
          <AppText variant="caption" color={Colors.subtle}>No listings yet — be the first to list!</AppText>
        </View>
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
        <View style={empty.wrap}>
          <AppText variant="caption" color={Colors.subtle}>No hosts yet.</AppText>
        </View>
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
        <View style={empty.wrap}>
          <AppText variant="caption" color={Colors.subtle}>No new listings yet.</AppText>
        </View>
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

const empty = StyleSheet.create({
  wrap: {
    height:         80,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    borderRadius:   Radius.md,
  },
});