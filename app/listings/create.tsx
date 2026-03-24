// app/listings/create.tsx
// 8-step listing creation form.
// Step 3 uses OSM LocationPicker (no API key required).
// Step 6 supports multi-photo selection.
//
// Setup (run these first):
//   npx expo install react-native-maps
//   npx expo install @react-native-async-storage/async-storage
//   npx expo install expo-image
//   npx expo install expo-image-picker
//
// app.json plugins section:
//   "plugins": [
//     "expo-router",
//     "expo-font",
//     "expo-web-browser",
//     "expo-secure-store",
//     "react-native-maps",
//     "expo-image-picker"
//   ]

import { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, KeyboardAvoidingView,
  Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useToast } from '@/components/ui/Toast';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { LocationPicker } from '@/components/listing/LocationPicker';
import { useAuthStore } from '@/store/authStore';
import {
  DRAFT_DEFAULTS, AMENITY_PRESETS,
  uploadListingPhoto, createListing, updateListingPhotos,
  type ListingDraft, type ListingCategory, type PriceUnit,
} from '@/lib/listingCreateService';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');
type FeatherName = React.ComponentProps<typeof Feather>['name'];

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'category', title: 'Choose a category', icon: 'grid' as FeatherName },
  { key: 'details', title: 'Describe your space', icon: 'edit-3' as FeatherName },
  { key: 'location', title: 'Where is it located?', icon: 'map-pin' as FeatherName },
  { key: 'pricing', title: 'Set your price', icon: 'dollar-sign' as FeatherName },
  { key: 'amenities', title: 'What does it offer?', icon: 'check-circle' as FeatherName },
  { key: 'photos', title: 'Add photos', icon: 'camera' as FeatherName },
  { key: 'rules', title: 'Rules & policy', icon: 'file-text' as FeatherName },
  { key: 'review', title: 'Review & publish', icon: 'eye' as FeatherName },
] as const;

type StepKey = typeof STEPS[number]['key'];

const CATEGORIES: { key: ListingCategory; label: string; desc: string }[] = [
  { key: 'parking', label: 'Parking', desc: 'Parking slot, garage, or covered space' },
  { key: 'room', label: 'Room / Unit', desc: 'Private room, studio, apartment, or condo' },
  { key: 'vehicle', label: 'Vehicle', desc: 'Car, van, motorcycle, or truck for rent' },
  { key: 'equipment', label: 'Equipment', desc: 'Camera, tools, sound system, or gear' },
  { key: 'event_venue', label: 'Event Venue', desc: 'Function hall, rooftop, or outdoor space' },
  { key: 'meeting_room', label: 'Meeting Room', desc: 'Boardroom, training room, or hot desk' },
  { key: 'storage', label: 'Storage', desc: 'Storage unit, bodega, or warehouse space' },
];

const PRICE_UNITS: { key: PriceUnit; label: string }[] = [
  { key: 'hour', label: 'Per hour' },
  { key: 'day', label: 'Per day' },
  { key: 'week', label: 'Per week' },
  { key: 'month', label: 'Per month' },
];

const CANCELLATION_OPTS = [
  { key: 'flexible' as const, label: 'Flexible', desc: 'Full refund if cancelled 48h before' },
  { key: 'moderate' as const, label: 'Moderate', desc: '50% refund if cancelled 24–48h before' },
  { key: 'strict' as const, label: 'Strict', desc: 'No refund within 48h of booking' },
];

// ─── Small shared components ──────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${((current + 1) / total) * 100}%` }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 3, backgroundColor: Colors.border, marginHorizontal: Spacing.xl, borderRadius: 2 },
  fill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
});

function FieldLabel({ title }: { title: string }) {
  return (
    <AppText variant="label" weight="bold" color={Colors.muted}
      style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}>
      {title}
    </AppText>
  );
}

function InfoBanner({ text }: { text: string }) {
  return (
    <View style={sh.infoBanner}>
      <Feather name="info" size={14} color={Colors.teal} />
      <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 8, flex: 1 }}>{text}</AppText>
    </View>
  );
}

// ─── STEP 1: Category ─────────────────────────────────────────────────────────

function StepCategory({ draft, onChange }: {
  draft: ListingDraft;
  onChange: (c: ListingCategory) => void;
}) {
  return (
    <View style={sh.stepWrap}>
      <AppText variant="body" color={Colors.muted}>What type of space are you listing?</AppText>
      {CATEGORIES.map(cat => {
        const cfg = CATEGORY_CONFIG[cat.key] ?? CATEGORY_CONFIG.storage;
        const selected = draft.category === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[sh.catRow, selected && sh.catRowActive]}
            onPress={() => onChange(cat.key)}
            activeOpacity={0.82}
          >
            <View style={[sh.catIcon, { backgroundColor: selected ? cfg.color : cfg.bg }]}>
              <Feather name={cfg.icon} size={22} color={selected ? Colors.white : cfg.color} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <AppText variant="label" weight="bold" color={selected ? Colors.primary : Colors.ink}>
                {cat.label}
              </AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>{cat.desc}</AppText>
            </View>
            {selected && <Feather name="check-circle" size={20} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── STEP 2: Details ─────────────────────────────────────────────────────────

function StepDetails({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  return (
    <View style={sh.stepWrap}>
      <View style={sh.field}>
        <FieldLabel title="Listing title" />
        <AppInput
          placeholder="e.g. Covered Parking · SM Lanang Area"
          value={draft.title}
          onChangeText={v => update('title', v)}
          maxLength={80}
        />
        <AppText variant="caption" color={Colors.subtle} style={{ textAlign: 'right' }}>
          {draft.title.length}/80
        </AppText>
      </View>
      <View style={sh.field}>
        <FieldLabel title="Description" />
        <View style={sh.textAreaBox}>
          <TextInput
            style={sh.textArea}
            placeholder="Describe your space — what makes it special, who it's best for, what's nearby…"
            placeholderTextColor={Colors.subtle}
            value={draft.description}
            onChangeText={v => update('description', v)}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
        </View>
        <AppText variant="caption" color={Colors.subtle} style={{ textAlign: 'right' }}>
          {draft.description.length}/500
        </AppText>
      </View>
    </View>
  );
}

// ─── STEP 3: Location — OSM map + Nominatim search + saved pins ───────────────

function StepLocation({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  return (
    <View style={sh.stepWrap}>
      <AppText variant="body" color={Colors.muted}>
        Search for your address, tap the map, or drag the pin to set the exact location.
      </AppText>

      <LocationPicker
        value={{ address: draft.address, city: draft.city, lat: draft.lat, lng: draft.lng }}
        onChange={loc => {
          update('address', loc.address);
          update('city', loc.city);
          update('lat', loc.lat);
          update('lng', loc.lng);
        }}
      />

      <InfoBanner text="Your exact address is only shown to renters after they complete a booking." />
    </View>
  );
}

// ─── STEP 4: Pricing ─────────────────────────────────────────────────────────

function StepPricing({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  const price = parseFloat(draft.price) || 0;
  const earn = price * 0.87;

  return (
    <View style={sh.stepWrap}>
      <View style={sh.field}>
        <FieldLabel title="Billing unit" />
        <View style={sh.unitRow}>
          {PRICE_UNITS.map(u => (
            <TouchableOpacity
              key={u.key}
              style={[sh.unitBtn, draft.price_unit === u.key && sh.unitBtnActive]}
              onPress={() => update('price_unit', u.key)}
              activeOpacity={0.8}
            >
              <AppText variant="label" weight="bold"
                color={draft.price_unit === u.key ? Colors.white : Colors.muted}>
                {u.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={sh.field}>
        <FieldLabel title={`Price per ${draft.price_unit}`} />
        <View style={sh.priceRow}>
          <View style={sh.pesoTag}>
            <AppText variant="h3" weight="bold" color={Colors.muted}>₱</AppText>
          </View>
          <TextInput
            style={sh.priceInput}
            placeholder="0"
            placeholderTextColor={Colors.subtle}
            value={draft.price}
            onChangeText={v => update('price', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={sh.field}>
        <FieldLabel title="Security deposit (optional)" />
        <View style={sh.priceRow}>
          <View style={sh.pesoTag}>
            <AppText variant="h3" weight="bold" color={Colors.muted}>₱</AppText>
          </View>
          <TextInput
            style={sh.priceInput}
            placeholder="0"
            placeholderTextColor={Colors.subtle}
            value={draft.deposit}
            onChangeText={v => update('deposit', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {price > 0 && (
        <View style={sh.earningsCard}>
          <AppText variant="label" weight="bold" style={{ marginBottom: Spacing.md }}>
            Earnings breakdown
          </AppText>
          {[
            { label: 'Renter pays', value: `₱${price.toLocaleString()}`, color: Colors.ink },
            { label: 'Service fee (10%)', value: `−₱${(price * 0.10).toFixed(0)}`, color: Colors.muted },
            { label: 'Host fee (3%)', value: `−₱${(price * 0.03).toFixed(0)}`, color: Colors.muted },
            { label: 'You receive', value: `₱${earn.toFixed(0)}`, color: Colors.teal },
          ].map(row => (
            <View key={row.label} style={sh.earningsRow}>
              <AppText variant="label" color={Colors.muted}>{row.label}</AppText>
              <AppText variant="label" weight="bold" color={row.color}>{row.value}</AppText>
            </View>
          ))}
        </View>
      )}

      <View style={sh.toggleCard}>
        <View style={{ flex: 1 }}>
          <AppText variant="label" weight="bold">Instant Book</AppText>
          <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
            Renters can book without waiting for your approval
          </AppText>
        </View>
        <Switch
          value={draft.instant_book}
          onValueChange={v => update('instant_book', v)}
          trackColor={{ false: Colors.border, true: Colors.teal }}
          thumbColor={Colors.white}
        />
      </View>
    </View>
  );
}

// ─── STEP 5: Amenities ────────────────────────────────────────────────────────

function StepAmenities({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  const presets = draft.category ? AMENITY_PRESETS[draft.category] : [];

  function toggle(a: string) {
    const cur = draft.amenities;
    update('amenities', cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a]);
  }

  return (
    <View style={sh.stepWrap}>
      <AppText variant="body" color={Colors.muted}>Select all features and amenities that apply.</AppText>
      <View style={sh.amenityGrid}>
        {presets.map(a => {
          const on = draft.amenities.includes(a);
          return (
            <TouchableOpacity
              key={a}
              style={[sh.amenityBtn, on && sh.amenityBtnOn]}
              onPress={() => toggle(a)}
              activeOpacity={0.8}
            >
              <Feather name={on ? 'check-circle' : 'circle'} size={14} color={on ? Colors.teal : Colors.border} />
              <AppText variant="label" color={on ? Colors.teal : Colors.muted} style={{ marginLeft: 7 }}>
                {a}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
      <AppText variant="caption" color={Colors.subtle}>{draft.amenities.length} selected</AppText>
    </View>
  );
}

// ─── STEP 6: Photos — multi-select, tap to set cover ─────────────────────────

function StepPhotos({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  const thumbSize = (W - Spacing.xl * 2 - Spacing.sm * 2) / 3;

  async function pickPhotos() {
    const remaining = 8 - draft.photos.length;
    if (remaining <= 0) { Alert.alert('Max 8 photos', 'Remove a photo before adding more.'); return; }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      update('photos', [...draft.photos, ...result.assets.map(a => a.uri)]);
    }
  }

  function removePhoto(uri: string) {
    update('photos', draft.photos.filter(p => p !== uri));
  }

  function setCover(uri: string) {
    if (draft.photos[0] === uri) return;
    update('photos', [uri, ...draft.photos.filter(p => p !== uri)]);
  }

  return (
    <View style={sh.stepWrap}>
      <AppText variant="body" color={Colors.muted}>
        Add up to 8 photos. Tap a photo to set it as the cover image.
      </AppText>

      <View style={sh.photoGrid}>
        {draft.photos.length < 8 && (
          <TouchableOpacity
            style={[sh.addPhotoBtn, { width: thumbSize, height: thumbSize }]}
            onPress={pickPhotos}
            activeOpacity={0.82}
          >
            <View style={sh.addPhotoIconBox}>
              <Feather name="camera" size={22} color={Colors.primary} />
            </View>
            <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginTop: 5 }}>
              {draft.photos.length === 0 ? 'Add photos' : 'Add more'}
            </AppText>
            <AppText variant="caption" color={Colors.subtle}>{draft.photos.length}/8</AppText>
          </TouchableOpacity>
        )}

        {draft.photos.map((uri, i) => (
          <TouchableOpacity
            key={uri}
            style={[sh.photoThumb, { width: thumbSize, height: thumbSize }, i === 0 && sh.photoThumbCover]}
            onPress={() => setCover(uri)}
            onLongPress={() =>
              Alert.alert('Remove photo?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removePhoto(uri) },
              ])
            }
            activeOpacity={0.88}
          >
            <Image source={{ uri }} style={sh.photoImg} contentFit="cover" />
            {i === 0 && (
              <View style={sh.coverLabel}>
                <Feather name="star" size={8} color={Colors.white} />
                <AppText style={sh.coverLabelText}>COVER</AppText>
              </View>
            )}
            <TouchableOpacity
              style={sh.removeBtn}
              onPress={() => removePhoto(uri)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Feather name="x" size={11} color={Colors.white} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {draft.photos.length === 0 ? (
        <InfoBanner text="Listings with photos get 3× more bookings. You can select multiple photos at once." />
      ) : (
        <View style={sh.photoHint}>
          <Feather name="info" size={12} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 6 }}>
            Tap to set as cover · Long-press to remove
          </AppText>
        </View>
      )}
    </View>
  );
}

// ─── STEP 7: Rules ───────────────────────────────────────────────────────────

function StepRules({ draft, update }: {
  draft: ListingDraft;
  update: (k: keyof ListingDraft, v: any) => void;
}) {
  return (
    <View style={sh.stepWrap}>
      <View style={sh.field}>
        <FieldLabel title="House rules (optional)" />
        <View style={sh.textAreaBox}>
          <TextInput
            style={sh.textArea}
            placeholder="e.g. No smoking · Only listed vehicle types · Renter responsible for damages…"
            placeholderTextColor={Colors.subtle}
            value={draft.house_rules}
            onChangeText={v => update('house_rules', v)}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={sh.field}>
        <FieldLabel title="Cancellation policy" />
        {CANCELLATION_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[sh.policyRow, draft.cancellation_policy === opt.key && sh.policyRowActive]}
            onPress={() => update('cancellation_policy', opt.key)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <AppText variant="label" weight="bold"
                color={draft.cancellation_policy === opt.key ? Colors.primary : Colors.ink}>
                {opt.label}
              </AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>{opt.desc}</AppText>
            </View>
            <View style={[sh.radio, draft.cancellation_policy === opt.key && sh.radioActive]}>
              {draft.cancellation_policy === opt.key && <View style={sh.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── STEP 8: Review ──────────────────────────────────────────────────────────

function StepReview({ draft }: { draft: ListingDraft }) {
  const cfg = draft.category
    ? CATEGORY_CONFIG[draft.category] ?? CATEGORY_CONFIG.storage
    : CATEGORY_CONFIG.storage;

  const [activeImage, setActiveImage] = useState(
    draft.photos?.[0] || null
  );

  const rows = [
    { label: 'Category', value: CATEGORIES.find(c => c.key === draft.category)?.label ?? '—' },
    { label: 'Title', value: draft.title || '—' },
    { label: 'Address', value: [draft.address, draft.city].filter(Boolean).join(', ') || '—' },
    { label: 'Price', value: draft.price ? `₱${parseFloat(draft.price).toLocaleString()} / ${draft.price_unit}` : '—' },
    { label: 'Deposit', value: draft.deposit && parseFloat(draft.deposit) > 0 ? `₱${parseFloat(draft.deposit).toLocaleString()}` : 'None' },
    { label: 'Instant Book', value: draft.instant_book ? 'Yes' : 'No' },
    { label: 'Amenities', value: draft.amenities.length > 0 ? draft.amenities.join(', ') : 'None' },
    { label: 'Photos', value: `${draft.photos.length} photo${draft.photos.length !== 1 ? 's' : ''}` },
    { label: 'Policy', value: draft.cancellation_policy.charAt(0).toUpperCase() + draft.cancellation_policy.slice(1) },
  ];

  return (
    <View style={sh.stepWrap}>
      <View style={sh.previewCard}>

        {/* IMAGE SECTION */}
        <View style={sh.previewImg}>
          {activeImage ? (
            <Image
              source={{ uri: activeImage }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, {
              backgroundColor: cfg.bg,
              alignItems: 'center',
              justifyContent: 'center'
            }]}>
              <Feather name={cfg.icon} size={44} color={cfg.color} />
            </View>
          )}

          {/* GRADIENT */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* GLASS TEXT */}
          <View style={sh.glassOverlay}>
            {/* Fallback glass effect */}
            <View style={sh.glassFallback} />

            {/* CONTENT */}
            <View style={{ position: 'relative' }}>
              <AppText variant="label" weight="bold" numberOfLines={1} style={{ color: 'white' }}>
                {draft.title || 'Your listing title'}
              </AppText>

              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                {draft.city || 'Davao City'}
              </AppText>

              <AppText variant="bodyLg" weight="extrabold" style={{ color: 'white', marginTop: 6 }}>
                {draft.price ? `₱${parseFloat(draft.price).toLocaleString()}` : '₱0'}
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  /{draft.price_unit}
                </AppText>
              </AppText>
            </View>
          </View>

          {/* PREVIEW BADGE */}
          <View style={sh.previewBadge}>
            <AppText style={sh.previewBadgeText}>PREVIEW</AppText>
          </View>
        </View>

        {/* 🔥 THUMBNAILS (OUTSIDE IMAGE) */}
        {draft.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sh.previewThumbRow}
          >
            {draft.photos.map((uri) => {
              const active = uri === activeImage;
              return (
                <TouchableOpacity
                  key={uri}
                  onPress={() => setActiveImage(uri)}
                  style={[sh.previewThumb, active && sh.previewThumbActive]}
                >
                  <Image source={{ uri }} style={sh.previewThumbImg} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* DETAILS TABLE */}
      <View style={sh.reviewTable}>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={sh.reviewDivider} />}
            <View style={sh.reviewRow}>
              <AppText variant="caption" weight="bold" color={Colors.subtle}
                style={{ width: 90, fontSize: 10, textTransform: 'uppercase' }}>
                {row.label}
              </AppText>
              <AppText variant="label" style={{ flex: 1, marginLeft: Spacing.md }}>
                {row.value}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateListingScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(DRAFT_DEFAULTS);
  const [saving, setSaving] = useState(false);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  function update(key: keyof ListingDraft, value: any) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function scrollTop() { scrollRef.current?.scrollTo({ y: 0, animated: true }); }

  function canProceed(): boolean {
    switch (step.key) {
      case 'category': return !!draft.category;
      case 'details': return draft.title.trim().length >= 5;
      case 'location': return draft.address.trim().length >= 5;
      case 'pricing': return !!draft.price && parseFloat(draft.price) > 0;
      default: return true;
    }
  }

  function validationMsg(): string {
    switch (step.key) {
      case 'category': return 'Please select a category to continue.';
      case 'details': return 'Title must be at least 5 characters.';
      case 'location': return 'Please set a location on the map.';
      case 'pricing': return 'Please set a price greater than ₱0.';
      default: return '';
    }
  }

  function goNext() {
    if (!canProceed()) { toast.show(validationMsg(), 'error'); return; }
    if (isLast) { handlePublish(); return; }
    setStepIndex(i => i + 1);
    scrollTop();
  }

  function goBack() {
    if (isFirst) { router.back(); return; }
    setStepIndex(i => i - 1);
    scrollTop();
  }

  function skip() { setStepIndex(i => i + 1); scrollTop(); }

  async function handlePublish() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { data: listing, error: ce } = await createListing(user.id, draft, 'draft');
      if (ce || !listing) {
        toast.show(ce?.message ?? 'Failed to create listing.', 'error');
        return;
      }

      if (draft.photos.length > 0) {
        toast.show('Uploading photos…', 'info');
        const uploads = await Promise.all(
          draft.photos.map((uri, i) => uploadListingPhoto(user.id, uri, i))
        );
        const urls = uploads.filter(r => r.url).map(r => r.url!);
        if (urls.length > 0) await updateListingPhotos(listing.id, urls);
      }

      const { setListingStatus } = await import('@/lib/listingsService');
      const { error: ae } = await setListingStatus(listing.id, 'active');

      toast.show(ae ? 'Created — activate it from the Host tab.' : 'Listing published! 🎉',
        ae ? 'info' : 'success');

      router.replace('/(tabs)/host');
    } catch (e: any) {
      toast.show(e?.message ?? 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!user?.id || !draft.category || !draft.title.trim()) {
      Alert.alert('Cannot save draft', 'Please select a category and enter a title first.');
      return;
    }
    setSaving(true);
    const { error } = await createListing(user.id, draft, 'draft');
    setSaving(false);
    if (error) { toast.show('Failed to save draft.', 'error'); return; }
    toast.show('Draft saved.', 'success');
    router.back();
  }

  const isSkippable = step.key === 'amenities' || step.key === 'photos' || step.key === 'rules';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name={isFirst ? 'x' : 'arrow-left'} size={20} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="caption" weight="bold" color={Colors.muted}>
            Step {stepIndex + 1} of {STEPS.length}
          </AppText>
          <AppText variant="label" weight="extrabold">{step.title}</AppText>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleSaveDraft} disabled={saving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText variant="caption" weight="bold" color={saving ? Colors.subtle : Colors.muted}>
            Save
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <ProgressBar current={stepIndex} total={STEPS.length} />

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((s, i) => (
          <View key={s.key} style={[
            styles.dot,
            i < stepIndex && styles.dotDone,
            i === stepIndex && styles.dotActive,
          ]}>
            {i < stepIndex
              ? <Feather name="check" size={9} color={Colors.white} />
              : <Feather name={s.icon} size={9} color={i === stepIndex ? Colors.white : Colors.border} />
            }
          </View>
        ))}
      </View>

      {/* Content */}
      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={120}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step.key === 'category' && <StepCategory draft={draft} onChange={v => update('category', v)} />}
          {step.key === 'details' && <StepDetails draft={draft} update={update} />}
          {step.key === 'location' && <StepLocation draft={draft} update={update} />}
          {step.key === 'pricing' && <StepPricing draft={draft} update={update} />}
          {step.key === 'amenities' && <StepAmenities draft={draft} update={update} />}
          {step.key === 'photos' && <StepPhotos draft={draft} update={update} />}
          {step.key === 'rules' && <StepRules draft={draft} update={update} />}
          {step.key === 'review' && <StepReview draft={draft} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <AppButton
          label={saving ? 'Publishing…' : isLast ? 'Publish listing →' : isSkippable ? 'Continue →' : 'Next →'}
          onPress={goNext}
          loading={saving}
          style={(!canProceed() && !isLast) ? { opacity: 0.5 } : undefined}
        />
        {isSkippable && !isLast && (
          <TouchableOpacity onPress={skip} style={styles.skipBtn}>
            <AppText variant="label" color={Colors.subtle} center>Skip for now</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Shared step styles ───────────────────────────────────────────────────────

const sh = StyleSheet.create({
  stepWrap: { gap: Spacing.xl },
  field: { gap: Spacing.sm },

  previewThumbRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },

  previewThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  previewThumbActive: {
    borderColor: Colors.primary,
  },

  previewThumbImg: {
    width: '100%',
    height: '100%',
  },

  glassOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },

  glassFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', // glass effect
    // backdropFilter: 'blur(10px)', // ignored on native but safe
  },

  catRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  catRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  catIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  textAreaBox: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
  },
  textArea: {
    fontSize: 14, color: Colors.ink,
    fontFamily: 'PlusJakartaSans_400Regular', minHeight: 110, lineHeight: 22,
  },

  unitRow: { flexDirection: 'row', gap: Spacing.sm },
  unitBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  unitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden',
  },
  pesoTag: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  priceInput: {
    flex: 1, fontSize: 24, fontFamily: 'PlusJakartaSans_700Bold', color: Colors.ink, padding: Spacing.md,
  },
  earningsCard: {
    backgroundColor: Colors.bg, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 13,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  amenityBtnOn: { borderColor: Colors.teal, backgroundColor: Colors.tealLight },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  addPhotoBtn: {
    borderRadius: Radius.md, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  addPhotoIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  photoThumb: { borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  photoThumbCover: { borderWidth: 2.5, borderColor: Colors.primary },
  photoImg: { width: '100%', height: '100%' },
  coverLabel: {
    position: 'absolute', bottom: 5, left: 5,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingVertical: 3, paddingHorizontal: 6,
  },
  coverLabelText: { fontSize: 8, fontWeight: '800', color: Colors.white, marginLeft: 3 },
  removeBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  photoHint: { flexDirection: 'row', alignItems: 'center' },

  policyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
  },
  policyRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.md, flexShrink: 0,
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  previewCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.black, // fallback behind image
  },
  previewImg: { height: 450, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  previewBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: Colors.ink, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 9,
  },
  previewBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white },
  reviewTable: {
    backgroundColor: Colors.bg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm },
  reviewDivider: { height: 1, backgroundColor: Colors.border },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.tealLight, borderRadius: Radius.md, padding: Spacing.md,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center',
  },

  dotsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: Spacing.sm,
  },
  dot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },

  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },

  bottomBar: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.white, gap: Spacing.xs,
  },
  skipBtn: { paddingVertical: Spacing.xs },
});