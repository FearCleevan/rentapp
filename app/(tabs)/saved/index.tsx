//app/(tabs)/saved/index.tsx
import { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Mock saved listings ──────────────────────────────────────────────────────

const INITIAL_SAVED = [
  {
    id:          '2',
    category:    'vehicle',
    title:       'Toyota Vios 2022 · Automatic',
    location:    'Matina, Davao City',
    price:       1500,
    priceUnit:   'day',
    rating:      4.7,
    reviewCount: 22,
    isVerified:  true,
    emoji:       '🚗',
    bgColor:     '#E8E4DC',
    hostName:    'Ana S.',
  },
  {
    id:          '3',
    category:    'room',
    title:       'Private Room · Poblacion District',
    location:    'Claveria St, Davao City',
    price:       800,
    priceUnit:   'night',
    rating:      4.8,
    reviewCount: 54,
    isVerified:  true,
    emoji:       '🏠',
    bgColor:     '#EAF0E8',
    hostName:    'Carlo M.',
  },
  {
    id:          '5',
    category:    'venue',
    title:       'Rooftop Event Space · City View',
    location:    'Damosa Gateway, Davao',
    price:       8000,
    priceUnit:   'day',
    rating:      4.6,
    reviewCount: 17,
    isVerified:  true,
    emoji:       '🎪',
    bgColor:     '#F0E8E8',
    hostName:    'Gina T.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SavedCard({
  item,
  onRemove,
  onBook,
}: {
  item: typeof INITIAL_SAVED[number];
  onRemove: () => void;
  onBook:   () => void;
}) {
  return (
    <View style={styles.card}>
      {/* Image area */}
      <View style={[styles.cardImg, { backgroundColor: item.bgColor }]}>
        <AppText style={{ fontSize: 44 }}>{item.emoji}</AppText>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={18} color="#FF4444" />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <AppText
          variant="caption"
          weight="bold"
          color={Colors.primary}
          style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}
        >
          {item.category}
        </AppText>

        <AppText
          variant="bodyLg"
          weight="bold"
          numberOfLines={1}
          style={{ marginBottom: 5 }}
        >
          {item.title}
        </AppText>

        <View style={styles.locationRow}>
          <Feather name="map-pin" size={11} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
            {item.location}
          </AppText>
        </View>

        {item.isVerified && (
          <View style={styles.verifiedRow}>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={9} color={Colors.teal} />
              <AppText
                variant="caption"
                weight="bold"
                color={Colors.teal}
                style={{ marginLeft: 3 }}
              >
                ID Verified
              </AppText>
            </View>
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 6 }}>
              by {item.hostName}
            </AppText>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <View style={styles.priceRow}>
              <AppText variant="h3" weight="extrabold">
                ₱{item.price.toLocaleString()}
              </AppText>
              <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 3 }}>
                / {item.priceUnit}
              </AppText>
            </View>
            <View style={styles.ratingRow}>
              <Feather name="star" size={11} color="#FFB800" />
              <AppText variant="caption" weight="bold" style={{ marginLeft: 3 }}>
                {item.rating}
              </AppText>
              <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 2 }}>
                ({item.reviewCount})
              </AppText>
            </View>
          </View>

          <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.85}>
            <AppText variant="label" weight="bold" color={Colors.white}>
              Book now
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const [savedItems, setSavedItems] = useState(INITIAL_SAVED);

  function removeItem(id: string) {
    setSavedItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="extrabold">Saved</AppText>
        <AppText variant="label" color={Colors.muted} style={{ marginTop: 2 }}>
          {savedItems.length} listing{savedItems.length !== 1 ? 's' : ''} saved
        </AppText>
      </View>

      {savedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText style={{ fontSize: 56 }}>🤍</AppText>
          <AppText
            variant="h2"
            weight="extrabold"
            center
            style={{ marginTop: Spacing.lg }}
          >
            Nothing saved yet
          </AppText>
          <AppText
            variant="body"
            color={Colors.muted}
            center
            style={{ marginTop: Spacing.sm, maxWidth: 260 }}
          >
            Tap the heart icon on any listing to save it here for later.
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Feather name="info" size={14} color={Colors.teal} />
            <AppText
              variant="caption"
              color={Colors.teal}
              style={{ marginLeft: 8, flex: 1 }}
            >
              Tap the heart to remove a listing from your saved collection.
            </AppText>
          </View>

          {savedItems.map(item => (
            <SavedCard
              key={item.id}
              item={item}
              onRemove={() => removeItem(item.id)}
              onBook={() => {}}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },

  listContent: {
    padding:       Spacing.xl,
    gap:           Spacing.md,
    paddingBottom: Spacing['5xl'],
  },

  infoBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.md,
  },
  cardImg: {
    height:         160,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  removeBtn: {
    position:        'absolute',
    top:             12,
    right:           12,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.sm,
  },
  cardBody: {
    padding: Spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.xs,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.sm,
  },
  verifiedBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.tealLight,
    borderRadius:      Radius.full,
    paddingVertical:   3,
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingTop:     Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop:      Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     2,
  },
  bookBtn: {
    backgroundColor:   Colors.primary,
    borderRadius:      Radius.md,
    paddingVertical:   10,
    paddingHorizontal: 20,
  },
});