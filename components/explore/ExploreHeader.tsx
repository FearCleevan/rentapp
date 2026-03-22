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
      {/* Top row: location + notif */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.locationBtn} activeOpacity={0.8}>
          <Feather name="map-pin" size={14} color={Colors.primary} />
          <AppText variant="label" weight="bold" style={{ marginLeft: 5 }}>
            Davao City
          </AppText>
          <Feather
            name="chevron-down"
            size={14}
            color={Colors.subtle}
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>

        <View style={styles.topRight}>
          {/* Radius indicator */}
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

          {/* Notification bell */}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={onNotif}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={20} color={Colors.ink} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.greetingRow}>
        <AppText variant="h2" weight="extrabold" style={{ lineHeight: 28 }}>
          Find your next
        </AppText>
        <AppText variant="h2" weight="extrabold" color={Colors.primary}>
          {' '}rental 🔍
        </AppText>
      </View>

      {/* Search bar */}
      <SearchBar
        value={search}
        onChange={onSearch}
        onFilterPress={onFilter}
      />

      {/* Category pills */}
      <CategoryPills active={category} onChange={onCategory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.sm,
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
    borderColor:       Colors.primary + '40',
  },
  notifBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  notifDot: {
    position:        'absolute',
    top:             8,
    right:           8,
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
    marginBottom:  Spacing.md,
    marginTop:     Spacing.xs,
  },
});