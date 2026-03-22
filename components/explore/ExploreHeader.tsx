// components/explore/ExploreHeader.tsx
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { SearchBar } from './SearchBar';
import { CategoryPills } from './CategoryPills';
import type { Category } from './exploreData';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  search:     string;
  category:   Category;
  radiusKm:   number;
  onSearch:   (v: string) => void;
  onCategory: (c: Category) => void;
  onFilter:   () => void;
  onNotif:    () => void;
}

export function ExploreHeader({
  search, category, radiusKm,
  onSearch, onCategory, onFilter, onNotif,
}: Props) {
  return (
    <View style={styles.container}>
      {/* ── Row 1: Location pill + right controls ── */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.locationBtn} activeOpacity={0.75}>
          <Feather name="map-pin" size={13} color={Colors.primary} />
          <AppText
            variant="label"
            weight="bold"
            style={{ marginLeft: 5, marginRight: 2 }}
          >
            Davao City
          </AppText>
          <Feather name="chevron-down" size={13} color={Colors.subtle} />
        </TouchableOpacity>

        <View style={styles.topRight}>
          <View style={styles.radiusPill}>
            <Feather name="crosshair" size={11} color={Colors.primary} />
            <AppText
              variant="caption"
              weight="bold"
              color={Colors.primary}
              style={{ marginLeft: 3 }}
            >
              {radiusKm} km
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={onNotif}
            activeOpacity={0.75}
          >
            <Feather name="bell" size={19} color={Colors.ink} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Row 2: Greeting ── */}
      <View style={styles.greetingRow}>
        <AppText variant="h2" weight="extrabold" style={styles.greetingText}>
          Find your next
        </AppText>
        <AppText
          variant="h2"
          weight="extrabold"
          color={Colors.primary}
          style={styles.greetingText}
        >
          {' '}rental 🔍
        </AppText>
      </View>

      {/* ── Row 3: Search bar ── */}
      <SearchBar
        value={search}
        onChange={onSearch}
        onFilterPress={onFilter}
      />

      {/* ── Row 4: Category pills ── */}
      <CategoryPills active={category} onChange={onCategory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,   // 20px sides — consistent with list content
    paddingTop:        Spacing.md,   // 12px top breathing room
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,      // 8px below before greeting
  },
  locationBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg,
    borderRadius:      Radius.full,
    paddingVertical:   7,
    paddingHorizontal: 12,
  },
  topRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  radiusPill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.primaryLight,
    borderRadius:      Radius.full,
    paddingVertical:   5,
    paddingHorizontal: 10,
    borderWidth:       1,
    borderColor:       Colors.primary + '35',
  },
  notifBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  notifDot: {
    position:        'absolute',
    top:             7,
    right:           7,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.primary,
    borderWidth:     2,
    borderColor:     Colors.white,
  },

  greetingRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'center',
    marginBottom:  Spacing.md,      // 12px below greeting before search
    marginTop:     Spacing.xs,      // 4px above — small but intentional
  },
  greetingText: {
    lineHeight: 30,
  },
});