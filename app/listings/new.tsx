// app/listings/new.tsx
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

import { AppText }            from '@/components/ui/AppText';
import { ListingCard }        from '@/components/explore/ListingCard';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import { LISTINGS }           from '@/components/explore/exploreData';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// Simulate "new" listings — last 4 added (by highest id)
const NEW_LISTINGS = [...LISTINGS]
  .sort((a, b) => parseInt(b.id) - parseInt(a.id))
  .slice(0, 6);

export default function NewListingsScreen() {
  const router = useRouter();
  const [saved,    setSaved]    = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<typeof LISTINGS[number] | null>(null);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.75}>
          <Feather name="arrow-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex:1, marginLeft:Spacing.sm }}>
          <AppText variant="h3" weight="extrabold">New in Davao</AppText>
          <AppText variant="caption" color={Colors.subtle}>Recently added listings</AppText>
        </View>
      </View>

      {/* Info banner */}
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

      {/* 2-col grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.grid}
      >
        <View style={s.gridInner}>
          {NEW_LISTINGS.map((item, idx) => (
            <View key={item.id} style={s.cardWrap}>
              {/* "New" badge */}
              {idx < 3 && (
                <View style={s.newBadge}>
                  <AppText style={{ fontSize:9, fontWeight:'800', color:Colors.white, letterSpacing:0.5 }}>
                    NEW
                  </AppText>
                </View>
              )}
              <ListingCard
                item={item}
                saved={saved.has(item.id)}
                onSave={() => toggleSave(item.id)}
                onPress={() => setSelected(item)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <ListingDetailSheet
        listing={selected}
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
  cardWrap:  { width:(1/2 * 100) + '%', position:'relative', paddingRight: CARD_GAP / 2 },
  newBadge: {
    position:'absolute', top:8, left:8, zIndex:10,
    backgroundColor:Colors.primary,
    paddingVertical:3, paddingHorizontal:7,
    borderRadius:Radius.full,
  },
});