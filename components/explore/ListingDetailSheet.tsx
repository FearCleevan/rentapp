// components/explore/ListingDetailSheet.tsx
import { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Dimensions,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { MapPreview } from './MapPreview';
import type { Listing } from './exploreData';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const { height: SCREEN_H } = Dimensions.get('window');

const MOCK_REVIEWS = [
  { id:'r1', name:'Jessa R.', initials:'JR', color:'#534AB7', rating:5, date:'2 weeks ago',
    text:'Super convenient! The space is exactly as described. CCTV, key card access is hassle-free. Host was very responsive too. Will definitely rent again next month.' },
  { id:'r2', name:'Karl M.', initials:'KM', color:'#0D9E75', rating:4, date:'1 month ago',
    text:'Good location, near the office. Space is a bit tight for my SUV but manageable. CCTV gives peace of mind. Host replied within minutes.' },
  { id:'r3', name:'Maria T.', initials:'MT', color:'#D85A30', rating:5, date:'2 months ago',
    text:'Best parking spot so far! Clean, secure, and very easy to access. The monthly rate is also very reasonable for the area.' },
  { id:'r4', name:'Paolo C.', initials:'PC', color:'#854F0B', rating:5, date:'3 months ago',
    text:'Perfect for my daily parking needs. 24/7 access is a huge plus since I work odd hours. Highly recommend!' },
];

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection:'row', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Feather key={i} name="star" size={size} color={i <= rating ? '#FFB800' : Colors.border} />
      ))}
    </View>
  );
}

function AmenityTag({ label }: { label: string }) {
  return (
    <View style={s.amenityTag}>
      <Feather name="check-circle" size={12} color={Colors.teal} />
      <AppText variant="caption" weight="semibold" color={Colors.ink} style={{ marginLeft:5 }}>{label}</AppText>
    </View>
  );
}

function ReviewCard({ review }: { review: typeof MOCK_REVIEWS[number] }) {
  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View style={[s.reviewAvatar, { backgroundColor: review.color }]}>
          <AppText weight="bold" color={Colors.white} style={{ fontSize:13 }}>{review.initials}</AppText>
        </View>
        <View style={{ flex:1, marginLeft:Spacing.sm }}>
          <AppText variant="label" weight="bold">{review.name}</AppText>
          <View style={{ flexDirection:'row', alignItems:'center', marginTop:3 }}>
            <StarRow rating={review.rating} size={11} />
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft:6 }}>{review.date}</AppText>
          </View>
        </View>
      </View>
      <AppText variant="body" color={Colors.muted} style={{ lineHeight:20, marginTop:Spacing.sm }}>{review.text}</AppText>
    </View>
  );
}

function RatingBar({ stars, count, total }: { stars:number; count:number; total:number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
      <AppText variant="caption" color={Colors.muted} style={{ width:36 }}>{stars} ★</AppText>
      <View style={{ flex:1, height:6, backgroundColor:Colors.border, borderRadius:3, overflow:'hidden' }}>
        <View style={{ width:`${pct}%`, height:'100%', backgroundColor:'#FFB800', borderRadius:3 }} />
      </View>
      <AppText variant="caption" color={Colors.subtle} style={{ width:24, textAlign:'right' }}>{count}</AppText>
    </View>
  );
}

interface Props {
  listing: Listing | null;
  saved:   boolean;
  onSave:  () => void;
  onClose: () => void;
  onBook:  () => void;
}

export function ListingDetailSheet({ listing, saved, onSave, onClose, onBook }: Props) {
  const [expanded,     setExpanded]     = useState(false);
  const [showAllRevs,  setShowAllRevs]  = useState(false);
  const [imageIndex,   setImageIndex]   = useState(0);

  useEffect(() => {
    if (listing) setImageIndex(0);
  }, [listing?.id]);

  if (!listing) return null;

  const descPreview = listing.description.slice(0, 120);
  const needsExpand = listing.description.length > 120;
  const visibleRevs = showAllRevs ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 2);
  const images = (listing.photos && listing.photos.length > 0)
    ? listing.photos
    : (listing.coverPhotoUrl ? [listing.coverPhotoUrl] : []);
  const ratDist     = [
    { stars:5, count: Math.round(listing.reviewCount * 0.75) },
    { stars:4, count: Math.round(listing.reviewCount * 0.15) },
    { stars:3, count: Math.round(listing.reviewCount * 0.07) },
    { stars:2, count: Math.round(listing.reviewCount * 0.02) },
    { stars:1, count: Math.round(listing.reviewCount * 0.01) },
  ];

  return (
    <Modal
      visible={!!listing}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        {/* Tap outside to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={s.dimArea} />
        </TouchableWithoutFeedback>

        {/* Sheet container - fixed height */}
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* THE SCROLLABLE AREA - this is what you scroll */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            alwaysBounceVertical={true}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >

            {/* Hero */}
            <View style={[s.hero, { backgroundColor: listing.bgColor }]}>
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                    setImageIndex(Math.max(0, Math.min(images.length - 1, idx)));
                  }}
                >
                  {images.map((uri) => (
                    <Image key={uri} source={{ uri }} style={s.heroImage} contentFit="cover" />
                  ))}
                </ScrollView>
              ) : (
                <AppText style={{ fontSize:80 }}>{listing.emoji}</AppText>
              )}
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Feather name="x" size={18} color={Colors.ink} />
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={onSave}>
                <Feather name="heart" size={18} color={saved ? '#FF4444' : Colors.muted} />
              </TouchableOpacity>
              <View style={s.heroBadges}>
                <View style={[s.heroBadge, { backgroundColor: listing.instantBook ? Colors.teal : 'rgba(0,0,0,0.6)' }]}>
                  {listing.instantBook && <Feather name="zap" size={11} color={Colors.white} />}
                  <AppText variant="caption" weight="bold" color={Colors.white} style={{ marginLeft: listing.instantBook ? 4 : 0 }}>
                    {listing.instantBook ? 'Instant Book' : 'Request to Book'}
                  </AppText>
                </View>
                {images.length > 1 && (
                  <View style={s.heroBadge}>
                    <AppText variant="caption" weight="bold" color={Colors.white}>
                      {imageIndex + 1}/{images.length}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
            {images.length > 1 && (
              <View style={s.imageDots}>
                {images.map((uri, i) => (
                  <View key={uri} style={[s.imageDot, i === imageIndex && s.imageDotActive]} />
                ))}
              </View>
            )}

            {/* Title */}
            <View style={s.section}>
              <AppText variant="caption" weight="bold" color={Colors.primary} style={s.catLabel}>
                {listing.category.toUpperCase()}
              </AppText>
              <AppText variant="h2" weight="extrabold" style={{ lineHeight:28, marginBottom:Spacing.md }}>
                {listing.title}
              </AppText>
              <View style={s.metaChips}>
                <View style={s.metaChip}>
                  <Feather name="map-pin" size={12} color={Colors.subtle} />
                  <AppText variant="caption" color={Colors.muted} style={{ marginLeft:4 }}>{listing.distance} km away</AppText>
                </View>
                <View style={[s.metaChip, { backgroundColor:'#FFFBEB' }]}>
                  <Feather name="star" size={12} color="#FFB800" />
                  <AppText variant="caption" weight="bold" style={{ marginLeft:4 }}>{listing.rating}</AppText>
                  <AppText variant="caption" color={Colors.subtle} style={{ marginLeft:2 }}>· {listing.reviewCount} reviews</AppText>
                </View>
                {listing.isVerified && (
                  <View style={[s.metaChip, { backgroundColor: Colors.tealLight }]}>
                    <Feather name="shield" size={12} color={Colors.teal} />
                    <AppText variant="caption" weight="bold" color={Colors.teal} style={{ marginLeft:4 }}>ID Verified</AppText>
                  </View>
                )}
              </View>
            </View>

            {/* Host */}
            <View style={[s.section, { flexDirection:'row', alignItems:'center' }]}>
              <View style={s.hostAvatar}>
                <AppText weight="extrabold" color={Colors.white} style={{ fontSize:15 }}>{listing.hostAvatar}</AppText>
              </View>
              <View style={{ flex:1, marginLeft:Spacing.md }}>
                <AppText variant="label" weight="bold">Hosted by {listing.hostName}</AppText>
                <AppText variant="caption" color={listing.isVerified ? Colors.teal : Colors.subtle} weight={listing.isVerified ? 'bold' : 'regular'}>
                  {listing.isVerified ? '✓ ID Verified Host' : 'Not yet verified'}
                </AppText>
              </View>
              <TouchableOpacity style={s.chatBtn} activeOpacity={0.85}>
                <Feather name="message-circle" size={14} color={Colors.primary} />
                <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft:4 }}>Chat</AppText>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={s.section}>
              <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.sm }}>About this space</AppText>
              <AppText variant="body" color={Colors.muted} style={{ lineHeight:23 }}>
                {expanded || !needsExpand ? listing.description : descPreview + '…'}
              </AppText>
              {needsExpand && (
                <TouchableOpacity onPress={() => setExpanded(v => !v)} style={{ marginTop:Spacing.xs }} hitSlop={{ top:8, bottom:8, left:0, right:0 }}>
                  <AppText variant="label" weight="bold" color={Colors.primary}>
                    {expanded ? 'Show less ▲' : 'Read more ▼'}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>

            {/* Space details */}
            {(listing.totalArea || listing.capacity) && (
              <View style={s.section}>
                <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.md }}>Space details</AppText>
                <View style={{ flexDirection:'row', gap:Spacing.sm }}>
                  {listing.totalArea && (
                    <View style={s.detailTile}>
                      <Feather name="maximize" size={20} color={Colors.primary} />
                      <AppText variant="label" weight="bold" style={{ marginTop:6 }}>{listing.totalArea}</AppText>
                      <AppText variant="caption" color={Colors.subtle}>Total area</AppText>
                    </View>
                  )}
                  {listing.capacity && (
                    <View style={s.detailTile}>
                      <Feather name={listing.category === 'vehicle' ? 'user' : 'users'} size={20} color={Colors.primary} />
                      <AppText variant="label" weight="bold" style={{ marginTop:6 }}>{listing.capacity}</AppText>
                      <AppText variant="caption" color={Colors.subtle}>{listing.category === 'vehicle' ? 'Seats' : 'Guests max'}</AppText>
                    </View>
                  )}
                  <View style={s.detailTile}>
                    <Feather name="clock" size={20} color={Colors.primary} />
                    <AppText variant="label" weight="bold" style={{ marginTop:6 }}>₱{listing.price.toLocaleString()}</AppText>
                    <AppText variant="caption" color={Colors.subtle}>Per {listing.priceUnit}</AppText>
                  </View>
                </View>
              </View>
            )}

            {/* Amenities */}
            <View style={s.section}>
              <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.md }}>What this offers</AppText>
              <View style={s.amenitiesGrid}>
                {listing.amenities.map(a => <AmenityTag key={a} label={a} />)}
              </View>
            </View>

            {/* Map */}
            <View style={s.section}>
              <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.xs }}>Location</AppText>
              <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:Spacing.md }}>
                <Feather name="map-pin" size={13} color={Colors.subtle} />
                <AppText variant="body" color={Colors.muted} style={{ marginLeft:6, flex:1 }}>{listing.location}</AppText>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:Spacing.md }}>
                <Feather name="crosshair" size={13} color={Colors.primary} />
                <AppText variant="caption" color={Colors.primary} style={{ marginLeft:6 }}>
                  Tap "Get directions" below to navigate from your current location
                </AppText>
              </View>
              <MapPreview
                listingLat={listing.lat}
                listingLng={listing.lng}
                listingEmoji={listing.emoji}
                listingTitle={listing.title}
                listingAddress={listing.address ?? listing.location}
                userLat={listing.userLat}
                userLng={listing.userLng}
              />
            </View>

            {/* Reviews */}
            <View style={s.section}>
              <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:Spacing.md }}>
                <AppText variant="bodyLg" weight="bold">Reviews</AppText>
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <Feather name="star" size={14} color="#FFB800" />
                  <AppText variant="bodyLg" weight="extrabold" style={{ marginLeft:4 }}>{listing.rating}</AppText>
                  <AppText variant="body" color={Colors.subtle} style={{ marginLeft:4 }}>· {listing.reviewCount}</AppText>
                </View>
              </View>

              {/* Rating bars */}
              <View style={{ backgroundColor:Colors.bg, borderRadius:Radius.md, padding:Spacing.md, gap:6, marginBottom:Spacing.md }}>
                {ratDist.map(r => <RatingBar key={r.stars} stars={r.stars} count={r.count} total={listing.reviewCount} />)}
              </View>

              {/* Review cards */}
              <View style={{ gap:Spacing.md }}>
                {visibleRevs.map(r => <ReviewCard key={r.id} review={r} />)}
              </View>

              {MOCK_REVIEWS.length > 2 && (
                <TouchableOpacity
                  style={s.showMoreBtn}
                  onPress={() => setShowAllRevs(v => !v)}
                  activeOpacity={0.8}
                >
                  <AppText variant="label" weight="bold" color={Colors.ink}>
                    {showAllRevs ? 'Show fewer reviews' : `See all ${listing.reviewCount} reviews`}
                  </AppText>
                  <Feather name={showAllRevs ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.ink} style={{ marginLeft:6 }} />
                </TouchableOpacity>
              )}
            </View>

            {/* Cancellation */}
            <View style={s.section}>
              <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.md }}>Cancellation policy</AppText>
              <View style={{ flexDirection:'row', alignItems:'flex-start', backgroundColor:Colors.tealLight, borderRadius:Radius.md, padding:Spacing.md }}>
                <Feather name="refresh-cw" size={18} color={Colors.teal} style={{ marginTop:2 }} />
                <View style={{ flex:1, marginLeft:Spacing.sm }}>
                  <AppText variant="label" weight="bold" color={Colors.teal}>Free cancellation</AppText>
                  <AppText variant="caption" color={Colors.muted} style={{ marginTop:3, lineHeight:18 }}>
                    Cancel up to 48 hours before your booking starts and get a full refund. No questions asked.
                  </AppText>
                </View>
              </View>
            </View>

            {/* Trust & Safety */}
            <View style={[s.section, { borderBottomWidth:0 }]}>
              <AppText variant="bodyLg" weight="bold" style={{ marginBottom:Spacing.md }}>Trust & safety</AppText>
              <View style={{ gap:Spacing.md }}>
                {[
                  { icon:'shield',       title:'Payment protected',  desc:'Your money is held safely until after your rental starts.' },
                  { icon:'check-circle', title:'Verified listings',  desc:'Our team reviews every listing before it goes live.' },
                  { icon:'phone',        title:'24/7 support',       desc:'Our team is always available if something goes wrong.' },
                ].map(t => (
                  <View key={t.title} style={{ flexDirection:'row', alignItems:'flex-start' }}>
                    <View style={{ width:40, height:40, borderRadius:12, backgroundColor:Colors.tealLight, alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Feather name={t.icon as any} size={18} color={Colors.teal} />
                    </View>
                    <View style={{ flex:1, marginLeft:Spacing.md }}>
                      <AppText variant="label" weight="bold">{t.title}</AppText>
                      <AppText variant="caption" color={Colors.muted} style={{ marginTop:2, lineHeight:17 }}>{t.desc}</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Spacer for booking bar */}
            <View style={{ height:120 }} />
          </ScrollView>

          {/* Booking bar - sits outside ScrollView so it stays fixed */}
          <View style={s.bookingBar}>
            <View>
              <View style={{ flexDirection:'row', alignItems:'baseline' }}>
                <AppText variant="h2" weight="extrabold">₱{listing.price.toLocaleString()}</AppText>
                <AppText variant="label" color={Colors.muted} style={{ marginLeft:4 }}>/ {listing.priceUnit}</AppText>
              </View>
              <AppText variant="caption" color={Colors.subtle}>+10% service fee at checkout</AppText>
            </View>
            <TouchableOpacity style={s.bookBtn} onPress={onBook} activeOpacity={0.88}>
              <AppText variant="label" weight="extrabold" color={Colors.white}>Book now →</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  dimArea:     { flex:1 },
  sheet: {
    backgroundColor:      Colors.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    height:               SCREEN_H * 0.93,
    overflow:             'hidden',
  },
  handle: {
    width:40, height:4, borderRadius:2,
    backgroundColor: Colors.border,
    alignSelf:'center', marginTop:10, marginBottom:4, flexShrink:0,
  },
  scroll:        { flex:1 },
  scrollContent: { flexGrow:1 },

  hero: { height:220, alignItems:'center', justifyContent:'center', position:'relative' },
  heroImage: { width: Dimensions.get('window').width, height: 220 },
  closeBtn: {
    position:'absolute', top:Spacing.md, left:Spacing.md,
    width:36, height:36, borderRadius:18,
    backgroundColor:'rgba(255,255,255,0.92)',
    alignItems:'center', justifyContent:'center', ...Shadow.sm,
  },
  saveBtn: {
    position:'absolute', top:Spacing.md, right:Spacing.md,
    width:36, height:36, borderRadius:18,
    backgroundColor:'rgba(255,255,255,0.92)',
    alignItems:'center', justifyContent:'center', ...Shadow.sm,
  },
  heroBadges:  { position:'absolute', bottom:Spacing.md, left:Spacing.md, flexDirection:'row', gap:6 },
  heroBadge:   { flexDirection:'row', alignItems:'center', borderRadius:Radius.full, paddingVertical:5, paddingHorizontal:10 },
  imageDots: { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, marginTop:10 },
  imageDot: { width:6, height:6, borderRadius:3, backgroundColor: Colors.border },
  imageDotActive: { width:18, backgroundColor: Colors.primary },

  section: { paddingHorizontal:Spacing.xl, paddingVertical:Spacing.lg, borderBottomWidth:1, borderBottomColor:Colors.border },
  catLabel:    { fontSize:10, letterSpacing:0.8, marginBottom:6 },
  metaChips:   { flexDirection:'row', flexWrap:'wrap', gap:6 },
  metaChip:    { flexDirection:'row', alignItems:'center', backgroundColor:Colors.bg, borderRadius:Radius.full, paddingVertical:5, paddingHorizontal:10 },

  hostAvatar:  { width:46, height:46, borderRadius:23, backgroundColor:Colors.primary, alignItems:'center', justifyContent:'center' },
  chatBtn:     { flexDirection:'row', alignItems:'center', borderRadius:Radius.md, paddingVertical:8, paddingHorizontal:12, borderWidth:1.5, borderColor:Colors.primary },

  detailTile:  { flex:1, backgroundColor:Colors.bg, borderRadius:Radius.md, padding:Spacing.md, alignItems:'center' },
  amenitiesGrid: { flexDirection:'row', flexWrap:'wrap', gap:Spacing.sm },
  amenityTag:  { flexDirection:'row', alignItems:'center', backgroundColor:Colors.tealLight, borderRadius:Radius.md, paddingVertical:7, paddingHorizontal:10 },

  reviewCard:   { backgroundColor:Colors.bg, borderRadius:Radius.md, padding:Spacing.md },
  reviewHeader: { flexDirection:'row', alignItems:'center' },
  reviewAvatar: { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', flexShrink:0 },
  showMoreBtn:  { flexDirection:'row', alignItems:'center', justifyContent:'center', marginTop:Spacing.md, paddingVertical:Spacing.md, borderRadius:Radius.md, borderWidth:1.5, borderColor:Colors.border },

  bookingBar: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor:Colors.white,
    paddingHorizontal:Spacing.xl,
    paddingVertical:Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    borderTopWidth:1, borderTopColor:Colors.border, ...Shadow.lg,
  },
  bookBtn: { backgroundColor:Colors.primary, borderRadius:Radius.md, paddingVertical:14, paddingHorizontal:28 },
});
