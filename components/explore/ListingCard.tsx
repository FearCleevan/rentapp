// components/explore/ListingCard.tsx
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText } from '@/components/ui/AppText';
import type { Listing } from './exploreData';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { Colors, Radius, Shadow } from '@/constants/theme';

interface Props {
  item: Listing;
  saved: boolean;
  onSave: () => void;
  onPress: () => void;
}

export function ListingCard({ item, saved, onSave, onPress }: Props) {
  const imageUrl = item.coverPhotoUrl ?? item.photos?.[0] ?? null;
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imgWrapper}>
        {/* Image */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: item.bgColor || cfg.bg }]} />
        )}

        {/* Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          locations={[0.4, 1]}
          style={styles.overlay}
        />

        {/* Heart */}
        <TouchableOpacity style={styles.heartBtn} onPress={onSave}>
          <Feather
            name="heart"
            size={14}
            color={saved ? '#FF4D4F' : '#fff'}
          />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <AppText numberOfLines={1} style={styles.title}>
            {item.title}
          </AppText>

          {/* Subtext */}
          <AppText style={styles.subText}>
            {item.distance} km away • ₱{item.price.toLocaleString()}/{item.priceUnit}
          </AppText>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color="#FFD700" />
              <AppText style={styles.ratingText}>
                {item.rating}
              </AppText>
            </View>

            <View style={styles.arrowBtn}>
              <Feather name="arrow-right" size={14} color="#000" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    flex: 1,
    backgroundColor: '#000',
    ...Shadow.md,
  },

  imgWrapper: {
    height: 180,
    position: 'relative',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  heartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },

  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },

  subText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginBottom: 6,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },

  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
