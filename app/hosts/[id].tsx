// app/hosts/[id].tsx
import { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { ListingDetailSheet } from '@/components/explore/ListingDetailSheet';
import {
  fetchHostProfile,
  fetchHostProfileReviews,
  fetchPublicHostListings,
} from '@/lib/listingsService';

const { width: SCREEN_W } = Dimensions.get('window');
const LISTING_CARD_W = SCREEN_W * 0.44;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function yearsHosting(createdAt: string) {
  const years = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return Math.max(1, years);
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30)   return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''} ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={s.statBlock}>
      <AppText variant="h2" weight="extrabold">{value}</AppText>
      <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}

function InfoRow({ icon, label, underline }: { icon: string; label: string; underline?: boolean }) {
  return (
    <View style={s.infoRow}>
      <Feather name={icon as any} size={18} color={Colors.ink} />
      <AppText
        variant="body"
        style={underline ? { ...s.infoLabel, textDecorationLine: 'underline' as const } : s.infoLabel}
      >
        {label}
      </AppText>
    </View>
  );
}

function ReviewCard({ review }: { review: any }) {
  const initials = (review.reviewer_name ?? 'R')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={s.reviewCard}>
      {/* Reviewer header */}
      <View style={s.reviewHeader}>
        {review.reviewer_avatar_url ? (
          <Image
            source={{ uri: review.reviewer_avatar_url }}
            style={s.reviewAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[s.reviewAvatar, s.reviewAvatarFallback]}>
            <AppText weight="bold" color={Colors.white} style={{ fontSize: 13 }}>{initials}</AppText>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText variant="label" weight="bold" numberOfLines={1}>{review.reviewer_name}</AppText>
          {review.reviewer_city && (
            <AppText variant="caption" color={Colors.muted}>{review.reviewer_city}</AppText>
          )}
        </View>
      </View>

      {/* Stars + time */}
      <View style={s.reviewMeta}>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Feather
              key={i}
              name="star"
              size={11}
              color={i <= review.rating ? '#FFB800' : Colors.border}
            />
          ))}
        </View>
        <AppText variant="caption" color={Colors.muted} style={{ marginLeft: Spacing.sm }}>
          {timeAgo(review.created_at)}
        </AppText>
      </View>

      {/* Comment */}
      {review.comment && (
        <AppText variant="body" color={Colors.ink} style={s.reviewComment} numberOfLines={5}>
          {review.comment}
        </AppText>
      )}
    </View>
  );
}

function ListingThumb({ item, onPress }: { item: any; onPress: () => void }) {
  const imageUrl = item.cover_photo_url ?? item.photos?.[0] ?? null;
  const cfg      = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <TouchableOpacity style={[s.listingThumb, { width: LISTING_CARD_W }]} onPress={onPress} activeOpacity={0.9}>
      <View style={s.listingImgWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={s.listingImg} contentFit="cover" />
        ) : (
          <View style={[s.listingImgPlaceholder, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={28} color={cfg.color} />
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={s.listingContent}>
          <AppText numberOfLines={1} style={s.listingTitle}>{item.title}</AppText>
          <AppText style={s.listingPrice}>
            ₱{Number(item.price ?? 0).toLocaleString()}
            <AppText style={s.listingPriceUnit}>/{item.price_unit}</AppText>
          </AppText>
          <View style={s.listingBottom}>
            <View style={s.listingRatingRow}>
              <Feather name="star" size={11} color="#FFD700" />
              <AppText style={s.listingRatingText}>
                {item.avg_rating > 0 ? item.avg_rating.toFixed(1) : 'New'}
              </AppText>
              <AppText style={s.listingReviewCount}>· {item.review_count}</AppText>
            </View>
            <View style={s.listingArrow}>
              <Feather name="arrow-right" size={12} color="#000" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HostProfileScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();

  const [profile,         setProfile]         = useState<any>(null);
  const [reviews,         setReviews]         = useState<any[]>([]);
  const [listings,        setListings]        = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [savedSet,        setSavedSet]        = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [pRes, rRes, lRes] = await Promise.all([
        fetchHostProfile(id),
        fetchHostProfileReviews(id, 10),
        fetchPublicHostListings(id, 8),
      ]);
      setProfile(pRes.data);
      setReviews(rRes.data ?? []);
      setListings(lRes.data ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.loadingWrap}>
        <AppText variant="label" color={Colors.muted}>Host not found.</AppText>
      </View>
    );
  }

  const years    = yearsHosting(profile.created_at);
  const rating   = profile.host_rating ? Number(profile.host_rating).toFixed(2) : '—';
  const initials = (profile.full_name ?? 'H')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function toggleSave(listingId: string) {
    setSavedSet(prev => {
      const next = new Set(prev);
      next.has(listingId) ? next.delete(listingId) : next.add(listingId);
      return next;
    });
  }

  const hostAvatar = (profile.full_name ?? 'H')
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sheetListing = selectedListing ? {
    id:           selectedListing.id,
    category:     selectedListing.category,
    title:        selectedListing.title,
    location:     selectedListing.address,
    address:      selectedListing.address,
    city:         selectedListing.city,
    distance:     0,
    lat:          selectedListing.lat,
    lng:          selectedListing.lng,
    userLat:      0,
    userLng:      0,
    price:        Number(selectedListing.price),
    priceUnit:    selectedListing.price_unit,
    rating:       selectedListing.avg_rating,
    reviewCount:  selectedListing.review_count,
    isVerified:   profile.is_verified ?? false,
    instantBook:  selectedListing.instant_book,
    hostName:     profile.full_name ?? 'Host',
    hostAvatar,
    amenities:    selectedListing.amenities ?? [],
    emoji:        '📦',
    bgColor:      CATEGORY_CONFIG[selectedListing.category]?.bg ?? '#F0EDE6',
    coverPhotoUrl: selectedListing.cover_photo_url,
    photos:       selectedListing.photos ?? [],
    description:  selectedListing.description ?? 'No description provided.',
  } : null;

  return (
    <View style={s.root}>
      {/* Fixed back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Feather name="arrow-left" size={20} color={Colors.ink} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <AppText weight="extrabold" color={Colors.white} style={{ fontSize: 32 }}>{initials}</AppText>
              </View>
            )}
            {profile.is_verified && (
              <View style={s.verifiedBadge}>
                <Feather name="check" size={12} color={Colors.white} />
              </View>
            )}
          </View>

          <AppText variant="h2" weight="extrabold" style={{ marginTop: Spacing.md }}>
            {profile.full_name}
          </AppText>

          {profile.is_verified && (
            <View style={s.superhostRow}>
              <Feather name="award" size={13} color={Colors.primary} />
              <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
                Superhost
              </AppText>
            </View>
          )}

          {/* Stats */}
          <View style={s.statsRow}>
            <StatBlock value={profile.host_review_count ?? 0} label="Reviews" />
            <View style={s.statDivider} />
            <StatBlock value={`${rating} ★`} label="Rating" />
            <View style={s.statDivider} />
            <StatBlock value={years} label="Years hosting" />
          </View>
        </View>

        {/* ── Info section ── */}
        <View style={s.section}>
          {profile.default_city && (
            <InfoRow icon="globe" label={`Lives in ${profile.default_city}, Philippines`} />
          )}
          {profile.is_verified && (
            <InfoRow icon="shield" label="Identity verified" underline />
          )}
          {profile.phone && (
            <InfoRow icon="phone" label={profile.phone} />
          )}
          {profile.bio && (
            <AppText variant="body" color={Colors.muted} style={s.bio}>{profile.bio}</AppText>
          )}
        </View>

        {/* ── Reviews ── */}
        <View style={s.sectionHeader}>
          <AppText variant="h3" weight="extrabold">{profile.full_name?.split(' ')[0]}'s reviews</AppText>
        </View>

        {reviews.length === 0 ? (
          <View style={s.emptySection}>
            <AppText variant="caption" color={Colors.muted}>No reviews yet.</AppText>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.reviewScroll}
            >
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </ScrollView>

            <TouchableOpacity
              style={s.showMoreBtn}
              activeOpacity={0.8}
              onPress={() => Alert.alert('Reviews', 'Full review list coming soon.')}
            >
              <AppText variant="label" weight="semibold" color={Colors.ink}>Show more reviews</AppText>
            </TouchableOpacity>
          </>
        )}

        {/* ── Listings ── */}
        {listings.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <AppText variant="h3" weight="extrabold">
                {profile.full_name?.split(' ')[0]}'s listings
              </AppText>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.listingScroll}
            >
              {listings.map(l => (
                <ListingThumb
                  key={l.id}
                  item={l}
                  onPress={() => setSelectedListing(l)}
                />
              ))}
            </ScrollView>

            <TouchableOpacity
              style={s.viewAllBtn}
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  `/listings/all?host=${id}&hostName=${encodeURIComponent(profile.full_name ?? '')}` as any,
                )
              }
            >
              <AppText variant="label" weight="bold" color={Colors.primary}>
                View all {profile.total_listings} listings
              </AppText>
            </TouchableOpacity>
          </>
        )}

        {/* ── Report / Block ── */}
        <View style={s.actionsSection}>
          <TouchableOpacity
            style={s.actionRow}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                `Report ${profile.full_name}`,
                'Are you sure you want to report this host?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Report', style: 'destructive', onPress: () => {} },
                ],
              )
            }
          >
            <Feather name="flag" size={18} color={Colors.ink} />
            <AppText variant="label" weight="medium" style={s.actionLabel}>
              Report {profile.full_name?.split(' ')[0]}
            </AppText>
            <Feather name="chevron-right" size={18} color={Colors.subtle} />
          </TouchableOpacity>

          <View style={s.actionDivider} />

          <TouchableOpacity
            style={s.actionRow}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                `Block ${profile.full_name}`,
                'You will no longer see listings from this host.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Block', style: 'destructive', onPress: () => {} },
                ],
              )
            }
          >
            <Feather name="slash" size={18} color={Colors.ink} />
            <AppText variant="label" weight="medium" style={s.actionLabel}>
              Block {profile.full_name?.split(' ')[0]}
            </AppText>
            <Feather name="chevron-right" size={18} color={Colors.subtle} />
          </TouchableOpacity>
        </View>

      </ScrollView>

      <ListingDetailSheet
        listing={sheetListing}
        saved={selectedListing ? savedSet.has(selectedListing.id) : false}
        onSave={() => selectedListing && toggleSave(selectedListing.id)}
        onClose={() => setSelectedListing(null)}
        onBook={() => setSelectedListing(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SIDE = Spacing.xl;

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll:      { paddingBottom: Spacing['5xl'] },

  backBtn: {
    position: 'absolute',
    top: 52,
    left: SIDE,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },

  // ── Hero ──
  heroCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: Spacing.xl,
    paddingHorizontal: SIDE,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.border,
  },
  avatarFallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  superhostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: '100%',
    justifyContent: 'space-around',
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // ── Info ──
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: SIDE,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    marginLeft: Spacing.md,
    color: Colors.ink,
  },
  bio: {
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  // ── Section headers ──
  sectionHeader: {
    paddingHorizontal: SIDE,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  emptySection: {
    paddingHorizontal: SIDE,
    paddingBottom: Spacing.lg,
  },

  // ── Reviews ──
  reviewScroll: {
    paddingLeft: SIDE,
    paddingRight: Spacing.sm,
    gap: Spacing.md,
  },
  reviewCard: {
    width: SCREEN_W * 0.72,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewAvatarFallback: {
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewComment: {
    lineHeight: 20,
    color: Colors.ink,
  },
  showMoreBtn: {
    marginHorizontal: SIDE,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },

  // ── Listings ──
  listingScroll: {
    paddingLeft: SIDE,
    paddingRight: Spacing.sm,
    gap: Spacing.md,
  },
  listingThumb: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Shadow.md,
  },
  listingImgWrap: {
    height: 200,
    position: 'relative',
  },
  listingImg: {
    width: '100%',
    height: '100%',
  },
  listingImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  listingTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  listingPrice: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 5,
  },
  listingPriceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  listingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listingRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listingRatingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 3,
  },
  listingReviewCount: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    marginLeft: 3,
  },
  listingArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllBtn: {
    paddingHorizontal: SIDE,
    paddingTop: Spacing.md,
  },

  // ── Report / Block ──
  actionsSection: {
    marginHorizontal: SIDE,
    marginTop: Spacing['2xl'],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  actionLabel: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
});
