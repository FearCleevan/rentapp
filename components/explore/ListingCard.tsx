// components/explore/ListingCard.tsx
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import type { Listing } from './exploreData';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

interface Props {
  item:    Listing;
  saved:   boolean;
  onSave:  () => void;
  onPress: () => void;
}

export function ListingCard({ item, saved, onSave, onPress }: Props) {
  const imageUrl = item.coverPhotoUrl ?? item.photos?.[0] ?? null;
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image / fallback area */}
      <View style={[styles.imgArea, { backgroundColor: item.bgColor || cfg.bg }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <AppText style={styles.emoji}>{item.emoji}</AppText>
        )}

        {/* Instant book badge */}
        {item.instantBook && (
          <View style={styles.instantBadge}>
            <Feather name="zap" size={9} color={Colors.white} />
            <AppText
              variant="caption"
              weight="bold"
              color={Colors.white}
              style={{ fontSize: 9, marginLeft: 2 }}
            >
              Instant
            </AppText>
          </View>
        )}

        {/* Heart */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={onSave}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather
            name={saved ? 'heart' : 'heart'}
            size={14}
            color={saved ? '#FF4444' : 'rgba(255,255,255,0.9)'}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Category label */}
        <AppText
          variant="caption"
          weight="bold"
          color={Colors.primary}
          style={styles.catLabel}
        >
          {item.category.toUpperCase()}
        </AppText>

        {/* Title */}
        <AppText
          variant="label"
          weight="bold"
          numberOfLines={2}
          style={styles.title}
        >
          {item.title}
        </AppText>

        {/* Location */}
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={9} color={Colors.subtle} />
          <AppText
            variant="caption"
            color={Colors.subtle}
            numberOfLines={1}
            style={{ marginLeft: 3, flex: 1 }}
          >
            {item.distance} km away
          </AppText>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Feather name="star" size={10} color="#FFB800" />
          <AppText
            variant="caption"
            weight="bold"
            style={{ marginLeft: 3 }}
          >
            {item.rating}
          </AppText>
          <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 2 }}>
            ({item.reviewCount})
          </AppText>
          {item.isVerified && (
            <View style={styles.verifiedDot}>
              <Feather name="check" size={8} color={Colors.teal} />
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <AppText variant="label" weight="extrabold" color={Colors.ink}>
            ₱{item.price.toLocaleString()}
          </AppText>
          <AppText variant="caption" color={Colors.subtle}>
            /{item.priceUnit}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    flex:            1,
    ...Shadow.sm,
  },
  imgArea: {
    height:         130,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
    overflow:       'hidden',
  },
  photo: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },

  instantBadge: {
    position:          'absolute',
    top:               8,
    left:              8,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.teal,
    borderRadius:      Radius.full,
    paddingVertical:   3,
    paddingHorizontal: 6,
  },
  heartBtn: {
    position:        'absolute',
    top:             8,
    right:           8,
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  body: {
    padding: Spacing.sm,
  },
  catLabel: {
    fontSize:      9,
    letterSpacing: 0.5,
    marginBottom:  2,
  },
  title: {
    lineHeight:   18,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  5,
  },
  verifiedDot: {
    marginLeft:      4,
    width:           14,
    height:          14,
    borderRadius:    7,
    backgroundColor: Colors.tealLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           2,
  },
});
