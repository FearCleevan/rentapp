// components/explore/BannerCarousel.tsx
import {
  View, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Spacing constants — derived from parent's paddingHorizontal (20) ──────────
const SIDE_PAD    = Spacing.xl;          // 20 — matches listHeaderWrap & listContent
const CARD_GAP    = Spacing.sm;          // 8  — consistent gap everywhere
const FEAT_CARD_W = SCREEN_W * 0.56;    // 56% — shows peek of next card
const FEAT_CARD_H = 176;
const NEW_CARD_W  = SCREEN_W * 0.43;    // 43% — slightly narrower for text legibility
const HOST_CARD_W = 110;                 // fixed — 4 fit nicely with peek

// ─── Data ─────────────────────────────────────────────────────────────────────

export const FEATURED = [
  { id:'f1', title:'SM Lanang Parking', subtitle:'Bajada, Davao City', price:80,   unit:'hr',    rating:5.0, guests:null, badge:'Hot this Month', badgeColor:'#FF6B35', bg:'#EDE8E0', emoji:'🅿️', pattern:'parking',  listingId:'1' },
  { id:'f2', title:'Studio Unit',       subtitle:'Lanang, Davao City', price:1200, unit:'night', rating:4.9, guests:2,    badge:'Great Value',    badgeColor:'#0D9E75', bg:'#E4EDE0', emoji:'🏠', pattern:'room',     listingId:'8' },
  { id:'f3', title:'Toyota Vios 2022',  subtitle:'Matina, Davao City', price:1500, unit:'day',   rating:4.7, guests:5,    badge:'Top Rated',      badgeColor:'#534AB7', bg:'#E8E6F5', emoji:'🚗', pattern:'vehicle',  listingId:'2' },
  { id:'f4', title:'Rooftop Venue',     subtitle:'Damosa, Davao City', price:8000, unit:'day',   rating:4.6, guests:200,  badge:'Popular',        badgeColor:'#C0480A', bg:'#F0E4DC', emoji:'🎪', pattern:'venue',    listingId:'5' },
];

export const TOP_HOSTS = [
  { id:'h1', name:'Miguel R.', initials:'MR', offers:38,  color:'#FF6B35', accent:'#FFD0B5', rating:4.9 },
  { id:'h2', name:'Ana S.',    initials:'AS', offers:22,  color:'#534AB7', accent:'#AFA9EC', rating:4.7 },
  { id:'h3', name:'Carlo M.', initials:'CM', offers:54,  color:'#0D9E75', accent:'#9FE1CB', rating:4.8 },
  { id:'h4', name:'Gina T.',  initials:'GT', offers:17,  color:'#C0480A', accent:'#F5C4B3', rating:4.6 },
  { id:'h5', name:'Lara V.',  initials:'LV', offers:29,  color:'#1A1A2E', accent:'#9F9ADE', rating:4.8 },
];

export const NEW_LISTINGS = [
  { id:'n1', title:'Private Room · Poblacion', price:800,  unit:'night', bg:'#E4EDE0', emoji:'🏠',  rating:4.8, listingId:'3' },
  { id:'n2', title:'Meeting Room · Abreeza',   price:500,  unit:'hr',    bg:'#DDE8EC', emoji:'🏢',  rating:4.8, listingId:'6' },
  { id:'n3', title:'Camera Kit · Buhangin',    price:1200, unit:'day',   bg:'#E8E4F0', emoji:'📷', rating:5.0, listingId:'4' },
  { id:'n4', title:'Open Parking · Agdao',     price:50,   unit:'hr',    bg:'#EDE8E0', emoji:'🅿️', rating:4.3, listingId:'7' },
];

// ─── Card pattern backgrounds ─────────────────────────────────────────────────

function CardPattern({ pattern, bg }: { pattern: string; bg: string }) {
  const map: Record<string, React.ReactNode> = {
    parking: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000009', width:140, height:140, borderRadius:70, top:-35, right:-35 }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:90,  height:90,  borderRadius:45, bottom:-22, left:18  }]} />
        <View style={[p.s, { backgroundColor:'#00000005', width:170, height:170, borderRadius:85, top:18,  left:-65 }]} />
        <AppText style={p.emoji}>🅿️</AppText>
      </View>
    ),
    room: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000009', width:110, height:110, borderRadius:14, top:8,    right:18, transform:[{rotate:'18deg'}] }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:75,  height:75,  borderRadius:10, bottom:8, right:55, transform:[{rotate:'8deg'}]  }]} />
        <View style={[p.s, { backgroundColor:'#00000005', width:55,  height:55,  borderRadius:8,  top:55,   left:28,  transform:[{rotate:'32deg'}] }]} />
        <AppText style={p.emoji}>🏠</AppText>
      </View>
    ),
    vehicle: (
      <View style={[p.base, { backgroundColor: bg }]}>
        <View style={[p.s, { backgroundColor:'#00000010', width:220, height:85, borderRadius:42, top:18,    left:-45 }]} />
        <View style={[p.s, { backgroundColor:'#00000006', width:130, height:52, borderRadius:26, bottom:28, right:-22 }]} />
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
  };
  return <>{map[pattern] ?? map.parking}</>;
}
const p = StyleSheet.create({
  base:  { flex:1, overflow:'hidden', alignItems:'center', justifyContent:'center', position:'relative' },
  s:     { position:'absolute' },
  emoji: { fontSize:50, zIndex:1 },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionRow({
  title, linkLabel = 'See all', onLink, mt = 0,
}: {
  title: string; linkLabel?: string; onLink?: () => void; mt?: number;
}) {
  return (
    <View style={[sr.row, { marginTop: mt }]}>
      <AppText variant="h2" weight="extrabold">{title}</AppText>
      <TouchableOpacity
        onPress={onLink}
        hitSlop={{ top:10, bottom:10, left:10, right:10 }}
        activeOpacity={0.7}
      >
        <AppText variant="label" weight="bold" color={Colors.primary}>{linkLabel}</AppText>
      </TouchableOpacity>
    </View>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: Spacing.md },
});

// ─── Horizontal scroll wrapper ────────────────────────────────────────────────
// Uses negative marginHorizontal to break out of parent padding,
// then restores alignment via paddingLeft on contentContainerStyle.

function HScroll({ children, snap }: { children: React.ReactNode; snap?: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snap ? snap + CARD_GAP : undefined}
      snapToAlignment="start"
      contentContainerStyle={{
        paddingLeft:  SIDE_PAD,
        paddingRight: SIDE_PAD,
        gap:          CARD_GAP,
      }}
      style={{ marginHorizontal: -SIDE_PAD, overflow:'visible' }}
    >
      {children}
    </ScrollView>
  );
}

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ item, onPress }: { item: typeof FEATURED[number]; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[fc.card, { width: FEAT_CARD_W }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={[fc.img, { height: FEAT_CARD_H }]}>
        <CardPattern pattern={item.pattern} bg={item.bg} />
        <View style={[fc.badge, { backgroundColor: item.badgeColor }]}>
          <AppText style={{ fontSize:9, fontWeight:'800', color:'#fff', letterSpacing:0.4 }}>
            {item.badge}
          </AppText>
        </View>
      </View>
      <View style={fc.body}>
        <View style={fc.bodyTop}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ flex:1 }}>
            {item.title}
          </AppText>
          <View style={fc.star}>
            <Feather name="star" size={10} color="#FFB800" />
            <AppText style={{ fontSize:11, fontWeight:'700', marginLeft:2, color: Colors.ink }}>
              {item.rating}
            </AppText>
          </View>
        </View>
        <View style={fc.bodyBottom}>
          <AppText style={{ fontSize:13, fontWeight:'800', color: Colors.ink }}>
            ₱{item.price.toLocaleString()}
            <AppText style={{ fontSize:11, fontWeight:'500', color: Colors.subtle }}>/{item.unit}</AppText>
          </AppText>
          {item.guests !== null && (
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <Feather name="users" size={10} color={Colors.subtle} />
              <AppText variant="caption" color={Colors.subtle} style={{ marginLeft:3 }}>{item.guests}</AppText>
            </View>
          )}
        </View>
        <View style={fc.location}>
          <Feather name="map-pin" size={10} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.subtle} numberOfLines={1} style={{ marginLeft:3, flex:1 }}>
            {item.subtitle}
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

function TopHostCard({ host, onPress }: { host: typeof TOP_HOSTS[number]; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[hc.card, { backgroundColor: host.color, width: HOST_CARD_W }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={[hc.avatar, { backgroundColor: host.accent + '55' }]}>
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize:16 }}>
          {host.initials}
        </AppText>
      </View>
      <View style={{ flexDirection:'row', gap:2, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => (
          <Feather key={i} name="star" size={8} color="rgba(255,255,255,0.85)" />
        ))}
      </View>
      <AppText
        variant="caption"
        weight="bold"
        color={Colors.white}
        numberOfLines={1}
        style={{ marginBottom:8, lineHeight:16 }}
      >
        {host.name}
      </AppText>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <AppText style={{ fontSize:10, color:'rgba(255,255,255,0.75)' }}>
          {host.offers} listings
        </AppText>
        <View style={hc.arrow}>
          <Feather name="arrow-right" size={10} color={host.color} />
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

// ─── New listing card (horizontal) ───────────────────────────────────────────

function NewListingCard({ item, onPress }: { item: typeof NEW_LISTINGS[number]; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[nc.card, { width: NEW_CARD_W }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[nc.img, { backgroundColor: item.bg }]}>
        <AppText style={{ fontSize:34 }}>{item.emoji}</AppText>
      </View>
      <View style={nc.body}>
        <AppText
          variant="caption"
          weight="bold"
          numberOfLines={2}
          style={{ lineHeight:17, marginBottom:6 }}
        >
          {item.title}
        </AppText>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <AppText style={{ fontSize:13, fontWeight:'800', color: Colors.ink }}>
            ₱{item.price.toLocaleString()}
            <AppText style={{ fontSize:10, fontWeight:'500', color: Colors.subtle }}>/{item.unit}</AppText>
          </AppText>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <Feather name="star" size={9} color="#FFB800" />
            <AppText style={{ fontSize:10, fontWeight:'700', marginLeft:2, color: Colors.ink }}>
              {item.rating}
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
  onListingPress?: (listingId: string) => void;
}

export function BannerCarousel({ onListingPress }: Props) {
  const router = useRouter();

  return (
    <View>
      {/* ── Discover ── */}
      <SectionRow
        title="Discover"
        onLink={() => router.push('/listings/all')}
      />
      <HScroll snap={FEAT_CARD_W}>
        {FEATURED.map(item => (
          <FeaturedCard
            key={item.id}
            item={item}
            onPress={() => onListingPress?.(item.listingId)}
          />
        ))}
      </HScroll>

      {/* ── Top Hosts ── */}
      <SectionRow
        title="Top Hosts"
        mt={Spacing['2xl']}
        onLink={() => router.push('/hosts/all')}
      />
      <HScroll>
        {TOP_HOSTS.map(h => (
          <TopHostCard
            key={h.id}
            host={h}
            onPress={() => router.push(`/hosts/${h.id}`)}
          />
        ))}
      </HScroll>

      {/* ── New in Davao ── */}
      <SectionRow
        title="New in Davao"
        mt={Spacing['2xl']}
        onLink={() => router.push('/listings/new')}
      />
      <HScroll snap={NEW_CARD_W}>
        {NEW_LISTINGS.map(item => (
          <NewListingCard
            key={item.id}
            item={item}
            onPress={() => onListingPress?.(item.listingId)}
          />
        ))}
      </HScroll>
    </View>
  );
}