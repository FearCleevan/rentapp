// components/explore/BannerCarousel.tsx
import { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W   = SCREEN_W * 0.56;
const CARD_H   = 180;
const SIDE_PAD = Spacing.xl;
const GAP      = Spacing.md;

// ─── Mock data ────────────────────────────────────────────────────────────────

const FEATURED = [
  { id:'f1', title:'SM Lanang Parking', location:'Bajada, Davao',  price:80,   unit:'hr',    rating:5.0, guests:null, badge:'Hot this Month', badgeColor:'#FF6B35', bg:'#E8E4DC', emoji:'🅿️', pattern:'parking' },
  { id:'f2', title:'Studio · Lanang',   location:'Lanang, Davao',  price:1200, unit:'night', rating:4.9, guests:2,    badge:'Great Value',    badgeColor:'#0D9E75', bg:'#EAF0E8', emoji:'🏠', pattern:'room'    },
  { id:'f3', title:'Toyota Vios 2022',  location:'Matina, Davao',  price:1500, unit:'day',   rating:4.7, guests:5,    badge:'Top Rated',      badgeColor:'#534AB7', bg:'#EEEDFE', emoji:'🚗', pattern:'vehicle'  },
  { id:'f4', title:'Rooftop Venue',     location:'Damosa, Davao',  price:8000, unit:'day',   rating:4.6, guests:200,  badge:'Popular',        badgeColor:'#D85A30', bg:'#FAECE7', emoji:'🎪', pattern:'venue'    },
];

const TOP_HOSTS = [
  { id:'h1', name:'Miguel R.', initials:'MR', offers:38, color:'#FF6B35', accent:'#FFD0B5' },
  { id:'h2', name:'Ana S.',    initials:'AS', offers:22, color:'#534AB7', accent:'#AFA9EC' },
  { id:'h3', name:'Carlo M.', initials:'CM', offers:54, color:'#0D9E75', accent:'#9FE1CB' },
  { id:'h4', name:'Gina T.',  initials:'GT', offers:17, color:'#D85A30', accent:'#F5C4B3' },
];

// ─── "New in Davao" — now horizontal like Top Hosts ──────────────────────────
// Wider card so content reads well in a row
const NEW_CARD_W = SCREEN_W * 0.44;

const NEW_LISTINGS = [
  { id:'n1', title:'Private Room · Poblacion', price:800,  unit:'night', bg:'#EAF0E8', emoji:'🏠',  rating:4.8 },
  { id:'n2', title:'Meeting Room · Abreeza',   price:500,  unit:'hr',    bg:'#E8EEF0', emoji:'🏢',  rating:4.8 },
  { id:'n3', title:'Camera Kit · Buhangin',    price:1200, unit:'day',   bg:'#EDE8F0', emoji:'📷', rating:5.0 },
  { id:'n4', title:'Open Parking · Agdao',     price:50,   unit:'hr',    bg:'#F0EDE6', emoji:'🅿️', rating:4.3 },
];

// ─── Card pattern backgrounds ─────────────────────────────────────────────────

function CardPattern({ pattern, bg }: { pattern: string; bg: string }) {
  const shapes: Record<string, React.ReactNode> = {
    parking: (
      <View style={[pat.base, { backgroundColor: bg }]}>
        <View style={[pat.s, { backgroundColor:'#FFFFFF15', width:120, height:120, borderRadius:60, top:-30,  right:-30 }]} />
        <View style={[pat.s, { backgroundColor:'#FFFFFF10', width:80,  height:80,  borderRadius:40, bottom:-20, left:20  }]} />
        <View style={[pat.s, { backgroundColor:'#FFFFFF08', width:160, height:160, borderRadius:80, top:20,   left:-60 }]} />
        <AppText style={pat.emoji}>🅿️</AppText>
      </View>
    ),
    room: (
      <View style={[pat.base, { backgroundColor: bg }]}>
        <View style={[pat.s, { backgroundColor:'#FFFFFF15', width:100, height:100, borderRadius:12, top:10,   right:20, transform:[{rotate:'20deg'}] }]} />
        <View style={[pat.s, { backgroundColor:'#FFFFFF10', width:70,  height:70,  borderRadius:8,  bottom:10, right:60, transform:[{rotate:'10deg'}] }]} />
        <View style={[pat.s, { backgroundColor:'#FFFFFF08', width:50,  height:50,  borderRadius:6,  top:60,   left:30,  transform:[{rotate:'35deg'}] }]} />
        <AppText style={pat.emoji}>🏠</AppText>
      </View>
    ),
    vehicle: (
      <View style={[pat.base, { backgroundColor: bg }]}>
        <View style={[pat.s, { backgroundColor:'#FFFFFF18', width:200, height:80, borderRadius:40, top:20,    left:-40  }]} />
        <View style={[pat.s, { backgroundColor:'#FFFFFF10', width:120, height:50, borderRadius:25, bottom:30, right:-20 }]} />
        <AppText style={pat.emoji}>🚗</AppText>
      </View>
    ),
    venue: (
      <View style={[pat.base, { backgroundColor: bg }]}>
        {[0,1,2,3,4].map(i => (
          <View key={i} style={[pat.s, { backgroundColor:'#FFFFFF12', width:6, height:CARD_H, left:20+i*28, top:0 }]} />
        ))}
        <AppText style={pat.emoji}>🎪</AppText>
      </View>
    ),
  };
  return <>{shapes[pattern] ?? shapes.parking}</>;
}

const pat = StyleSheet.create({
  base:  { flex:1, overflow:'hidden', alignItems:'center', justifyContent:'center', position:'relative' },
  s:     { position:'absolute' },
  emoji: { fontSize:52, zIndex:1 },
});

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ item, onPress }: { item: typeof FEATURED[number]; onPress: () => void }) {
  return (
    <TouchableOpacity style={[fc.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.93}>
      <View style={[fc.imgArea, { height: CARD_H }]}>
        <CardPattern pattern={item.pattern} bg={item.bg} />
        <View style={[fc.badge, { backgroundColor: item.badgeColor }]}>
          <AppText style={{ fontSize:9, fontWeight:'700', color:'#fff', letterSpacing:0.3 }}>
            {item.badge}
          </AppText>
        </View>
      </View>
      <View style={fc.info}>
        <View style={fc.infoTop}>
          <AppText variant="label" weight="bold" numberOfLines={1} style={{ flex:1 }}>{item.title}</AppText>
          <View style={{ flexDirection:'row', alignItems:'center', flexShrink:0 }}>
            <Feather name="star" size={10} color="#FFB800" />
            <AppText style={{ fontSize:11, fontWeight:'700', marginLeft:2 }}>{item.rating}</AppText>
          </View>
        </View>
        <View style={fc.infoBottom}>
          <AppText variant="caption" weight="extrabold" color={Colors.ink}>
            ₱{item.price.toLocaleString()}
            <AppText variant="caption" color={Colors.subtle}>/{item.unit}</AppText>
          </AppText>
          {item.guests && (
            <View style={{ flexDirection:'row', alignItems:'center' }}>
              <Feather name="users" size={10} color={Colors.subtle} />
              <AppText variant="caption" color={Colors.subtle} style={{ marginLeft:3 }}>{item.guests}</AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fc = StyleSheet.create({
  card:     { backgroundColor:Colors.white, borderRadius:Radius.lg, overflow:'hidden', ...Shadow.md },
  imgArea:  { overflow:'hidden', position:'relative' },
  badge:    { position:'absolute', top:10, left:10, paddingVertical:4, paddingHorizontal:9, borderRadius:Radius.full },
  info:     { padding:12, paddingTop:10 },
  infoTop:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:4, gap:6 },
  infoBottom: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
});

// ─── Top Host card ────────────────────────────────────────────────────────────

function TopHostCard({ host }: { host: typeof TOP_HOSTS[number] }) {
  return (
    <TouchableOpacity style={[hc.card, { backgroundColor: host.color }]} activeOpacity={0.88}>
      <View style={[hc.avatar, { backgroundColor: host.accent + '50' }]}>
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize:16 }}>{host.initials}</AppText>
      </View>
      <View style={{ flexDirection:'row', gap:2, marginBottom:4 }}>
        {[1,2,3,4,5].map(i => <Feather key={i} name="star" size={8} color="rgba(255,255,255,0.9)" />)}
      </View>
      <AppText variant="caption" weight="bold" color={Colors.white} numberOfLines={1} style={{ marginBottom:8, lineHeight:16 }}>
        {host.name}
      </AppText>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <AppText style={{ fontSize:10, color:'rgba(255,255,255,0.8)' }}>{host.offers} offers</AppText>
        <View style={hc.arrowBtn}>
          <Feather name="arrow-right" size={10} color={host.color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card:     { width:110, borderRadius:Radius.lg, padding:12, flexShrink:0, ...Shadow.sm },
  avatar:   { width:52, height:52, borderRadius:26, alignItems:'center', justifyContent:'center', marginBottom:8, borderWidth:2, borderColor:'rgba(255,255,255,0.3)' },
  arrowBtn: { width:20, height:20, borderRadius:10, backgroundColor:Colors.white, alignItems:'center', justifyContent:'center' },
});

// ─── New listing card — horizontal scroll version ─────────────────────────────

function NewListingCard({ item, onPress }: { item: typeof NEW_LISTINGS[number]; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[nl.card, { width: NEW_CARD_W }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[nl.img, { backgroundColor: item.bg }]}>
        <AppText style={{ fontSize:34 }}>{item.emoji}</AppText>
      </View>
      <View style={nl.info}>
        <AppText variant="caption" weight="bold" numberOfLines={2} style={{ lineHeight:16, marginBottom:4 }}>
          {item.title}
        </AppText>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <AppText variant="caption" weight="extrabold" color={Colors.ink}>
            ₱{item.price.toLocaleString()}
            <AppText variant="caption" color={Colors.subtle}>/{item.unit}</AppText>
          </AppText>
          <View style={{ flexDirection:'row', alignItems:'center' }}>
            <Feather name="star" size={9} color="#FFB800" />
            <AppText style={{ fontSize:10, fontWeight:'700', marginLeft:2 }}>{item.rating}</AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const nl = StyleSheet.create({
  card: { backgroundColor:Colors.white, borderRadius:Radius.lg, overflow:'hidden', flexShrink:0, ...Shadow.sm },
  img:  { height:100, alignItems:'center', justifyContent:'center' },
  info: { padding:10 },
});

// ─── Shared section header ────────────────────────────────────────────────────

function SectionHeader({
  title,
  linkLabel = 'See all',
  onLink,
  mt,
}: {
  title:      string;
  linkLabel?: string;
  onLink?:    () => void;
  mt?:        number;
}) {
  return (
    <View style={[sh.row, mt !== undefined && { marginTop: mt }]}>
      <AppText variant="h2" weight="extrabold">{title}</AppText>
      <TouchableOpacity onPress={onLink} hitSlop={{ top:8, bottom:8, left:8, right:8 }}>
        <AppText variant="label" weight="bold" color={Colors.primary}>{linkLabel}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:Spacing.md },
});

// ─── Horizontal scroll helper ─────────────────────────────────────────────────

function HScroll({ children, snapW }: { children: React.ReactNode; snapW?: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snapW ? snapW + GAP : undefined}
      snapToAlignment="start"
      contentContainerStyle={{ paddingLeft:SIDE_PAD, paddingRight:SIDE_PAD, gap:GAP }}
      style={{ marginHorizontal:-SIDE_PAD }}
    >
      {children}
    </ScrollView>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

interface Props {
  onListingPress?: (id: string) => void;
}

export function BannerCarousel({ onListingPress }: Props) {
  return (
    <View style={styles.root}>

      {/* ── Discover ── */}
      <SectionHeader title="Discover" linkLabel="See all" />
      <HScroll snapW={CARD_W}>
        {FEATURED.map(item => (
          <FeaturedCard key={item.id} item={item} onPress={() => onListingPress?.(item.id)} />
        ))}
      </HScroll>

      {/* ── Top Hosts ── */}
      <SectionHeader title="Top Hosts" mt={Spacing['2xl']} />
      <HScroll>
        {TOP_HOSTS.map(h => <TopHostCard key={h.id} host={h} />)}
      </HScroll>

      {/* ── New in Davao — horizontal row (same style as Top Hosts) ── */}
      <SectionHeader title="New in Davao" mt={Spacing['2xl']} />
      <HScroll snapW={NEW_CARD_W}>
        {NEW_LISTINGS.map(item => (
          <NewListingCard key={item.id} item={item} onPress={() => onListingPress?.(item.id)} />
        ))}
      </HScroll>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: Spacing.sm },
});