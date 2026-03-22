// app/hosts/all.tsx
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { TOP_HOSTS } from '@/components/explore/BannerCarousel';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// Extended host list for this screen
const ALL_HOSTS = [
  ...TOP_HOSTS,
  { id:'h6', name:'Ben A.',   initials:'BA', offers:14, color:'#2E7D52', accent:'#8FD4B0', rating:4.3 },
  { id:'h7', name:'Sarah L.', initials:'SL', offers:41, color:'#7B3F8C', accent:'#CDA8DC', rating:4.9 },
  { id:'h8', name:'Nico P.',  initials:'NP', offers:11, color:'#1A6E8C', accent:'#8AC8DC', rating:5.0 },
];

function HostCard({ host, onPress }: { host: typeof ALL_HOSTS[number]; onPress: () => void }) {
  return (
    <TouchableOpacity style={h.card} onPress={onPress} activeOpacity={0.88}>
      {/* Left: avatar */}
      <View style={[h.avatar, { backgroundColor: host.color }]}>
        <AppText weight="extrabold" color={Colors.white} style={{ fontSize:18 }}>
          {host.initials}
        </AppText>
      </View>

      {/* Middle: info */}
      <View style={{ flex:1, marginLeft:Spacing.md }}>
        <AppText variant="label" weight="bold">{host.name}</AppText>
        <View style={{ flexDirection:'row', alignItems:'center', marginTop:3, gap:3 }}>
          {[1,2,3,4,5].map(i => (
            <Feather key={i} name="star" size={10}
              color={i <= Math.round(host.rating) ? '#FFB800' : Colors.border}
            />
          ))}
          <AppText variant="caption" weight="bold" style={{ marginLeft:4 }}>{host.rating}</AppText>
        </View>
        <AppText variant="caption" color={Colors.muted} style={{ marginTop:2 }}>
          {host.offers} active listings
        </AppText>
      </View>

      {/* Right: view button */}
      <View style={[h.viewBtn, { backgroundColor: host.color + '18' }]}>
        <AppText variant="caption" weight="bold" color={host.color}>View</AppText>
      </View>
    </TouchableOpacity>
  );
}

const h = StyleSheet.create({
  card:    { flexDirection:'row', alignItems:'center', backgroundColor:Colors.white, borderRadius:Radius.lg, padding:Spacing.md, marginBottom:Spacing.sm, ...Shadow.sm },
  avatar:  { width:52, height:52, borderRadius:26, alignItems:'center', justifyContent:'center', flexShrink:0 },
  viewBtn: { paddingVertical:7, paddingHorizontal:14, borderRadius:Radius.full },
});

export default function AllHostsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex:1, marginLeft:Spacing.sm }}>
          <AppText variant="h3" weight="extrabold">Top Hosts</AppText>
          <AppText variant="caption" color={Colors.subtle}>
            Verified hosts in Davao City
          </AppText>
        </View>
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        {[
          { value: ALL_HOSTS.length,                                          label:'Active hosts'    },
          { value: ALL_HOSTS.reduce((a,h) => a + h.offers, 0),               label:'Total listings'  },
          { value: (ALL_HOSTS.reduce((a,h) => a + h.rating, 0) / ALL_HOSTS.length).toFixed(1), label:'Avg rating' },
        ].map(stat => (
          <View key={stat.label} style={s.statItem}>
            <AppText variant="h3" weight="extrabold">{stat.value}</AppText>
            <AppText variant="caption" color={Colors.muted}>{stat.label}</AppText>
          </View>
        ))}
      </View>

      {/* Host list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        <AppText
          variant="overline"
          weight="bold"
          color={Colors.subtle}
          style={s.listLabel}
        >
          ALL HOSTS
        </AppText>
        {ALL_HOSTS.map(host => (
          <HostCard
            key={host.id}
            host={host}
            onPress={() => router.push(`/hosts/${host.id}`)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const SIDE_PAD = Spacing.xl;

const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:Colors.bg },
  header: {
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:SIDE_PAD, paddingVertical:Spacing.md,
    backgroundColor:Colors.white,
    borderBottomWidth:1, borderBottomColor:Colors.border,
  },
  backBtn: { width:36, height:36, borderRadius:18, backgroundColor:Colors.bg, alignItems:'center', justifyContent:'center' },
  statsBar: {
    flexDirection:'row',
    backgroundColor:Colors.white,
    paddingVertical:Spacing.lg,
    paddingHorizontal:SIDE_PAD,
    borderBottomWidth:1,
    borderBottomColor:Colors.border,
    justifyContent:'space-around',
  },
  statItem:  { alignItems:'center' },
  list:      { padding:SIDE_PAD, paddingBottom:Spacing['5xl'] },
  listLabel: { marginBottom:Spacing.md },
});