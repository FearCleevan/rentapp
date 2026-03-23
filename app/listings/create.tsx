// app/listings/create.tsx
// Multi-step listing creation form.
// Steps: Category → Details → Location → Pricing → Amenities → Photos → Rules → Review

import { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppText }   from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput }  from '@/components/ui/AppInput';
import { useToast }  from '@/components/ui/Toast';
import { CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { useAuthStore } from '@/store/authStore';
import {
  DRAFT_DEFAULTS, AMENITY_PRESETS,
  uploadListingPhoto, createListing, updateListingPhotos,
  type ListingDraft, type ListingCategory, type PriceUnit,
} from '@/lib/listingCreateService';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

type FeatherName = React.ComponentProps<typeof Feather>['name'];

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'category',  title: 'Choose a category',     icon: 'grid'       as FeatherName },
  { key: 'details',   title: 'Describe your space',   icon: 'edit-3'     as FeatherName },
  { key: 'location',  title: 'Where is it located?',  icon: 'map-pin'    as FeatherName },
  { key: 'pricing',   title: 'Set your price',        icon: 'dollar-sign'as FeatherName },
  { key: 'amenities', title: 'What does it offer?',   icon: 'check-circle'as FeatherName },
  { key: 'photos',    title: 'Add photos',            icon: 'camera'     as FeatherName },
  { key: 'rules',     title: 'House rules & policy',  icon: 'file-text'  as FeatherName },
  { key: 'review',    title: 'Review & publish',      icon: 'eye'        as FeatherName },
] as const;

type StepKey = typeof STEPS[number]['key'];

const CATEGORIES: { key: ListingCategory; label: string; desc: string }[] = [
  { key: 'parking',      label: 'Parking',       desc: 'Parking slot, garage, or covered space'      },
  { key: 'room',         label: 'Room / Unit',   desc: 'Private room, studio, apartment, or condo'   },
  { key: 'vehicle',      label: 'Vehicle',       desc: 'Car, van, motorcycle, or truck for rent'     },
  { key: 'equipment',    label: 'Equipment',     desc: 'Camera, tools, sound system, or gear'        },
  { key: 'event_venue',  label: 'Event Venue',   desc: 'Function hall, rooftop, or outdoor space'    },
  { key: 'meeting_room', label: 'Meeting Room',  desc: 'Boardroom, training room, or hot desk'       },
  { key: 'storage',      label: 'Storage',       desc: 'Storage unit, bodega, or warehouse space'    },
];

const PRICE_UNITS: { key: PriceUnit; label: string }[] = [
  { key: 'hour',  label: 'Per hour'  },
  { key: 'day',   label: 'Per day'   },
  { key: 'week',  label: 'Per week'  },
  { key: 'month', label: 'Per month' },
];

const CANCELLATION_OPTIONS = [
  { key: 'flexible' as const, label: 'Flexible',  desc: 'Full refund if cancelled 48h before' },
  { key: 'moderate' as const, label: 'Moderate',  desc: '50% refund if cancelled 24–48h before' },
  { key: 'strict'   as const, label: 'Strict',    desc: 'No refund within 48h of booking' },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct}%` }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 3, backgroundColor: Colors.border, borderRadius: 2, marginHorizontal: Spacing.xl },
  fill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      {title && <AppText variant="label" weight="bold" color={Colors.muted} style={sec.title}>{title}</AppText>}
      {children}
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:  { gap: Spacing.sm },
  title: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11, marginBottom: 2 },
});

// ─── Step 1: Category ─────────────────────────────────────────────────────────

function StepCategory({ draft, onChange }: { draft: ListingDraft; onChange: (c: ListingCategory) => void }) {
  return (
    <View style={styles.stepContent}>
      <AppText variant="body" color={Colors.muted} style={{ marginBottom: Spacing.lg }}>
        What type of space are you listing?
      </AppText>
      {CATEGORIES.map(cat => {
        const cfg      = CATEGORY_CONFIG[cat.key] ?? CATEGORY_CONFIG.storage;
        const selected = draft.category === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catRow, selected && styles.catRowSelected]}
            onPress={() => onChange(cat.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.catIconWrap, { backgroundColor: selected ? cfg.color : cfg.bg }]}>
              <Feather name={cfg.icon} size={22} color={selected ? Colors.white : cfg.color} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <AppText variant="label" weight="bold" color={selected ? Colors.primary : Colors.ink}>
                {cat.label}
              </AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                {cat.desc}
              </AppText>
            </View>
            {selected && <Feather name="check-circle" size={20} color={Colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Step 2: Details ─────────────────────────────────────────────────────────

function StepDetails({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  return (
    <View style={styles.stepContent}>
      <Section title="Listing title">
        <AppInput
          placeholder="e.g. Covered Parking · SM Lanang Area"
          value={draft.title}
          onChangeText={v => update('title', v)}
          maxLength={80}
        />
        <AppText variant="caption" color={Colors.subtle} style={{ textAlign: 'right' }}>
          {draft.title.length}/80
        </AppText>
      </Section>

      <Section title="Description">
        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textArea}
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
      </Section>
    </View>
  );
}

// ─── Step 3: Location ─────────────────────────────────────────────────────────

const DAVAO_BARANGAYS = [
  'Agdao', 'Bajada', 'Buhangin', 'Bunawan', 'Calinan', 'Communal',
  'Damosa', 'Eden', 'Lanang', 'Lasang', 'Matina', 'Mintal',
  'Panacan', 'Poblacion', 'Sasa', 'Talomo', 'Tibungco', 'Toril',
  'Tugbok', 'Ula',
];

function StepLocation({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  return (
    <View style={styles.stepContent}>
      <Section title="Street address">
        <AppInput
          placeholder="e.g. JP Laurel Ave, Bajada"
          value={draft.address}
          onChangeText={v => update('address', v)}
          iconLeft={<Feather name="map-pin" size={16} color={Colors.subtle} />}
        />
      </Section>

      <Section title="City">
        <AppInput
          placeholder="Davao City"
          value={draft.city}
          onChangeText={v => update('city', v)}
          iconLeft={<Feather name="navigation" size={16} color={Colors.subtle} />}
        />
      </Section>

      <Section title="Barangay">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 4 }}>
          {DAVAO_BARANGAYS.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.chipBtn, draft.barangay === b && styles.chipBtnActive]}
              onPress={() => update('barangay', b)}
              activeOpacity={0.8}
            >
              <AppText
                variant="caption"
                weight="bold"
                color={draft.barangay === b ? Colors.white : Colors.muted}
              >
                {b}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Section>

      <View style={styles.infoBanner}>
        <Feather name="info" size={14} color={Colors.teal} />
        <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 8, flex: 1 }}>
          Your exact address is only shown to renters after they complete a booking.
        </AppText>
      </View>
    </View>
  );
}

// ─── Step 4: Pricing ─────────────────────────────────────────────────────────

function StepPricing({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  const price   = parseFloat(draft.price)   || 0;
  const deposit = parseFloat(draft.deposit) || 0;
  const fee     = price * 0.10;
  const earn    = price * 0.97;

  return (
    <View style={styles.stepContent}>
      <Section title="Billing unit">
        <View style={styles.unitRow}>
          {PRICE_UNITS.map(u => (
            <TouchableOpacity
              key={u.key}
              style={[styles.unitBtn, draft.price_unit === u.key && styles.unitBtnActive]}
              onPress={() => update('price_unit', u.key)}
              activeOpacity={0.8}
            >
              <AppText
                variant="label"
                weight="bold"
                color={draft.price_unit === u.key ? Colors.white : Colors.muted}
              >
                {u.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title={`Price per ${draft.price_unit}`}>
        <View style={styles.priceInputWrap}>
          <View style={styles.pesoCurrency}>
            <AppText variant="h3" weight="bold" color={Colors.muted}>₱</AppText>
          </View>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor={Colors.subtle}
            value={draft.price}
            onChangeText={v => update('price', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </Section>

      <Section title="Security deposit (optional)">
        <View style={styles.priceInputWrap}>
          <View style={styles.pesoCurrency}>
            <AppText variant="h3" weight="bold" color={Colors.muted}>₱</AppText>
          </View>
          <TextInput
            style={styles.priceInput}
            placeholder="0"
            placeholderTextColor={Colors.subtle}
            value={draft.deposit}
            onChangeText={v => update('deposit', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </View>
      </Section>

      {/* Earnings breakdown */}
      {price > 0 && (
        <View style={styles.earningsCard}>
          <AppText variant="label" weight="bold" style={{ marginBottom: Spacing.md }}>
            Earnings breakdown
          </AppText>
          {[
            { label: `Renter pays`,      value: `₱${price.toLocaleString()}`,        color: Colors.ink    },
            { label: `Service fee (10%)`, value: `−₱${fee.toFixed(0)}`,             color: Colors.muted  },
            { label: `Host fee (3%)`,    value: `−₱${(price * 0.03).toFixed(0)}`,   color: Colors.muted  },
            { label: `You receive`,      value: `₱${earn.toFixed(0)}`,              color: Colors.teal   },
          ].map(row => (
            <View key={row.label} style={styles.earningsRow}>
              <AppText variant="label" color={Colors.muted}>{row.label}</AppText>
              <AppText variant="label" weight="bold" color={row.color}>{row.value}</AppText>
            </View>
          ))}
        </View>
      )}

      {/* Instant book toggle */}
      <View style={styles.toggleRow}>
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

// ─── Step 5: Amenities ────────────────────────────────────────────────────────

function StepAmenities({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  const presets = draft.category ? AMENITY_PRESETS[draft.category] : [];

  function toggle(amenity: string) {
    const current = draft.amenities;
    if (current.includes(amenity)) {
      update('amenities', current.filter(a => a !== amenity));
    } else {
      update('amenities', [...current, amenity]);
    }
  }

  return (
    <View style={styles.stepContent}>
      <AppText variant="body" color={Colors.muted} style={{ marginBottom: Spacing.lg }}>
        Select everything that applies to your listing.
      </AppText>

      <View style={styles.amenitiesGrid}>
        {presets.map(a => {
          const selected = draft.amenities.includes(a);
          return (
            <TouchableOpacity
              key={a}
              style={[styles.amenityBtn, selected && styles.amenityBtnSelected]}
              onPress={() => toggle(a)}
              activeOpacity={0.8}
            >
              <Feather
                name={selected ? 'check-circle' : 'circle'}
                size={15}
                color={selected ? Colors.teal : Colors.border}
              />
              <AppText
                variant="label"
                color={selected ? Colors.teal : Colors.muted}
                style={{ marginLeft: 8 }}
              >
                {a}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <AppText variant="caption" color={Colors.subtle} style={{ marginTop: Spacing.sm }}>
        {draft.amenities.length} selected
      </AppText>
    </View>
  );
}

// ─── Step 6: Photos ───────────────────────────────────────────────────────────

function StepPhotos({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  async function pickPhoto() {
    if (draft.photos.length >= 8) {
      Alert.alert('Max 8 photos', 'Remove a photo first to add another.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:    ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality:       0.85,
      aspect:        [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      update('photos', [...draft.photos, result.assets[0].uri]);
    }
  }

  function removePhoto(uri: string) {
    update('photos', draft.photos.filter(p => p !== uri));
  }

  return (
    <View style={styles.stepContent}>
      <AppText variant="body" color={Colors.muted} style={{ marginBottom: Spacing.lg }}>
        Add up to 8 photos. The first photo will be your cover image.
      </AppText>

      <View style={styles.photosGrid}>
        {/* Add button */}
        <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto} activeOpacity={0.8}>
          <View style={styles.addPhotoIcon}>
            <Feather name="camera" size={24} color={Colors.primary} />
          </View>
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginTop: 6 }}>
            Add photo
          </AppText>
          <AppText variant="caption" color={Colors.subtle}>
            {draft.photos.length}/8
          </AppText>
        </TouchableOpacity>

        {/* Photo thumbnails */}
        {draft.photos.map((uri, i) => (
          <View key={uri} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.photoImg} contentFit="cover" />

            {/* Cover badge */}
            {i === 0 && (
              <View style={styles.coverBadge}>
                <AppText style={{ fontSize: 9, fontWeight: '800', color: Colors.white }}>COVER</AppText>
              </View>
            )}

            {/* Remove button */}
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={() => removePhoto(uri)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Feather name="x" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {draft.photos.length === 0 && (
        <View style={styles.infoBanner}>
          <Feather name="info" size={14} color={Colors.teal} />
          <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 8, flex: 1 }}>
            Listings with photos get 3× more bookings. You can skip for now and add later.
          </AppText>
        </View>
      )}
    </View>
  );
}

// ─── Step 7: Rules ────────────────────────────────────────────────────────────

function StepRules({ draft, update }: { draft: ListingDraft; update: (k: keyof ListingDraft, v: any) => void }) {
  return (
    <View style={styles.stepContent}>
      <Section title="House rules (optional)">
        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. No smoking inside · Only listed vehicle types · Renter responsible for damages…"
            placeholderTextColor={Colors.subtle}
            value={draft.house_rules}
            onChangeText={v => update('house_rules', v)}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
        </View>
      </Section>

      <Section title="Cancellation policy">
        {CANCELLATION_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.policyRow, draft.cancellation_policy === opt.key && styles.policyRowSelected]}
            onPress={() => update('cancellation_policy', opt.key)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <AppText
                variant="label"
                weight="bold"
                color={draft.cancellation_policy === opt.key ? Colors.primary : Colors.ink}
              >
                {opt.label}
              </AppText>
              <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                {opt.desc}
              </AppText>
            </View>
            <View style={[
              styles.radioOuter,
              draft.cancellation_policy === opt.key && styles.radioOuterActive,
            ]}>
              {draft.cancellation_policy === opt.key && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </Section>
    </View>
  );
}

// ─── Step 8: Review ───────────────────────────────────────────────────────────

function StepReview({ draft }: { draft: ListingDraft }) {
  const cfg = draft.category
    ? CATEGORY_CONFIG[draft.category] ?? CATEGORY_CONFIG.storage
    : CATEGORY_CONFIG.storage;

  const rows = [
    { label: 'Category',     value: CATEGORIES.find(c => c.key === draft.category)?.label ?? '—' },
    { label: 'Title',        value: draft.title       || '—' },
    { label: 'Address',      value: [draft.address, draft.barangay, draft.city].filter(Boolean).join(', ') || '—' },
    { label: 'Price',        value: draft.price ? `₱${parseFloat(draft.price).toLocaleString()} / ${draft.price_unit}` : '—' },
    { label: 'Deposit',      value: draft.deposit && parseFloat(draft.deposit) > 0 ? `₱${parseFloat(draft.deposit).toLocaleString()}` : 'None' },
    { label: 'Instant Book', value: draft.instant_book ? 'Yes' : 'No' },
    { label: 'Amenities',    value: draft.amenities.length > 0 ? draft.amenities.join(', ') : 'None selected' },
    { label: 'Photos',       value: `${draft.photos.length} photo${draft.photos.length !== 1 ? 's' : ''}` },
    { label: 'Policy',       value: draft.cancellation_policy.charAt(0).toUpperCase() + draft.cancellation_policy.slice(1) },
  ];

  return (
    <View style={styles.stepContent}>
      {/* Preview card */}
      <View style={styles.previewCard}>
        <View style={[styles.previewImg, { backgroundColor: cfg.bg }]}>
          {draft.photos.length > 0 ? (
            <Image source={{ uri: draft.photos[0] }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <Feather name={cfg.icon} size={40} color={cfg.color} />
          )}
          <View style={styles.previewBadge}>
            <AppText style={{ fontSize: 9, fontWeight: '800', color: Colors.white }}>PREVIEW</AppText>
          </View>
        </View>
        <View style={{ padding: Spacing.md }}>
          <AppText variant="label" weight="bold" numberOfLines={1}>{draft.title || 'Your listing title'}</AppText>
          <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
            {draft.city || 'Davao City'}
          </AppText>
          <AppText variant="bodyLg" weight="extrabold" color={Colors.primary} style={{ marginTop: 6 }}>
            {draft.price ? `₱${parseFloat(draft.price).toLocaleString()}` : '₱0'}
            <AppText variant="caption" color={Colors.subtle}>/{draft.price_unit}</AppText>
          </AppText>
        </View>
      </View>

      {/* Details table */}
      <View style={styles.reviewCard}>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 && <View style={styles.reviewDivider} />}
            <View style={styles.reviewRow}>
              <AppText variant="caption" weight="bold" color={Colors.subtle} style={{ width: 90 }}>
                {row.label.toUpperCase()}
              </AppText>
              <AppText variant="label" color={Colors.ink} style={{ flex: 1, marginLeft: Spacing.md }}>
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
  const router  = useRouter();
  const toast   = useToast();
  const { user } = useAuthStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft,     setDraft]     = useState<ListingDraft>(DRAFT_DEFAULTS);
  const [saving,    setSaving]    = useState(false);
  const scrollRef   = useRef<ScrollView>(null);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === STEPS.length - 1;

  function update(key: keyof ListingDraft, value: any) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function scrollTop() {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  // ── Validation per step ────────────────────────────────────────────────────
  function canProceed(): boolean {
    switch (step.key) {
      case 'category':  return !!draft.category;
      case 'details':   return draft.title.trim().length >= 5;
      case 'location':  return draft.address.trim().length >= 5;
      case 'pricing':   return !!draft.price && parseFloat(draft.price) > 0;
      default:          return true;
    }
  }

  function validationMessage(): string {
    switch (step.key) {
      case 'category':  return 'Please select a category to continue.';
      case 'details':   return 'Please enter a title (at least 5 characters).';
      case 'location':  return 'Please enter a street address.';
      case 'pricing':   return 'Please set a price greater than ₱0.';
      default:          return '';
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goNext() {
    if (!canProceed()) {
      toast.show(validationMessage(), 'error');
      return;
    }
    if (isLast) {
      handlePublish();
    } else {
      setStepIndex(i => i + 1);
      scrollTop();
    }
  }

  function goBack() {
    if (isFirst) {
      router.back();
    } else {
      setStepIndex(i => i - 1);
      scrollTop();
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!user?.id) return;
    setSaving(true);

    try {
      // 1. Create the listing row (draft first)
      const { data: listing, error: createError } = await createListing(user.id, draft, 'draft');
      if (createError || !listing) {
        toast.show(createError?.message ?? 'Failed to create listing.', 'error');
        setSaving(false);
        return;
      }

      // 2. Upload photos if any
      let uploadedUrls: string[] = [];
      if (draft.photos.length > 0) {
        toast.show('Uploading photos…', 'info');
        const uploads = await Promise.all(
          draft.photos.map((uri, i) => uploadListingPhoto(user.id, uri, i))
        );
        uploadedUrls = uploads.filter(r => r.url).map(r => r.url!);

        if (uploadedUrls.length > 0) {
          await updateListingPhotos(listing.id, uploadedUrls);
        }
      }

      // 3. Activate
      const { error: activateError } = await import('@/lib/listingsService').then(m =>
        m.setListingStatus(listing.id, 'active')
      );

      if (activateError) {
        toast.show('Listing created but could not be published. Go to Host tab to activate it.', 'info');
      } else {
        toast.show('Listing published! 🎉', 'success');
      }

      router.replace('/(tabs)/host');
    } catch (e: any) {
      toast.show(e?.message ?? 'Something went wrong.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Save as draft ──────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!user?.id || !draft.category || !draft.title.trim()) {
      Alert.alert('Cannot save draft', 'Please select a category and enter a title first.');
      return;
    }
    setSaving(true);
    const { error } = await createListing(user.id, draft, 'draft');
    setSaving(false);
    if (error) {
      toast.show('Failed to save draft.', 'error');
    } else {
      toast.show('Draft saved.', 'success');
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name={isFirst ? 'x' : 'arrow-left'} size={20} color={Colors.ink} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="label" weight="bold" color={Colors.muted}>
            Step {stepIndex + 1} of {STEPS.length}
          </AppText>
          <AppText variant="label" weight="extrabold">{step.title}</AppText>
        </View>

        <TouchableOpacity onPress={handleSaveDraft} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText variant="caption" weight="bold" color={Colors.muted}>Save</AppText>
        </TouchableOpacity>
      </View>

      {/* ── Progress ── */}
      <ProgressBar current={stepIndex} total={STEPS.length} />

      {/* ── Step icons row ── */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.stepDot,
              i < stepIndex  && styles.stepDotDone,
              i === stepIndex && styles.stepDotActive,
            ]}
          >
            {i < stepIndex ? (
              <Feather name="check" size={10} color={Colors.white} />
            ) : (
              <Feather name={s.icon} size={10} color={i === stepIndex ? Colors.white : Colors.border} />
            )}
          </View>
        ))}
      </View>

      {/* ── Content ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={120}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step.key === 'category'  && <StepCategory  draft={draft} onChange={v => update('category', v)} />}
          {step.key === 'details'   && <StepDetails   draft={draft} update={update} />}
          {step.key === 'location'  && <StepLocation  draft={draft} update={update} />}
          {step.key === 'pricing'   && <StepPricing   draft={draft} update={update} />}
          {step.key === 'amenities' && <StepAmenities draft={draft} update={update} />}
          {step.key === 'photos'    && <StepPhotos    draft={draft} update={update} />}
          {step.key === 'rules'     && <StepRules     draft={draft} update={update} />}
          {step.key === 'review'    && <StepReview    draft={draft} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomBar}>
        <AppButton
          label={
            saving    ? 'Publishing…' :
            isLast    ? 'Publish listing →' :
            step.key === 'photos' || step.key === 'amenities' || step.key === 'rules'
              ? 'Continue →'
              : 'Next →'
          }
          onPress={goNext}
          loading={saving}
          style={!canProceed() && !isLast ? { opacity: 0.5 } : undefined}
        />
        {(step.key === 'photos' || step.key === 'amenities') && (
          <TouchableOpacity onPress={goNext} style={styles.skipBtn}>
            <AppText variant="label" color={Colors.subtle} center>Skip for now</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width:           40,
    height:          40,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },

  stepsRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    paddingVertical:   Spacing.sm,
  },
  stepDot: {
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: Colors.bg,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotDone:   { backgroundColor: Colors.teal,    borderColor: Colors.teal    },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
    paddingBottom:     Spacing['3xl'],
  },

  stepContent: { gap: Spacing.xl },

  // Category
  catRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  catRowSelected: {
    borderColor:     Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  catIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  // Text area
  textAreaWrap: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    padding:         Spacing.md,
  },
  textArea: {
    fontSize:    14,
    color:       Colors.ink,
    fontFamily:  'PlusJakartaSans_400Regular',
    minHeight:   120,
    lineHeight:  22,
  },

  // Barangay chips
  chipBtn: {
    paddingVertical:   7,
    paddingHorizontal: 14,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  chipBtnActive: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },

  // Pricing
  unitRow: { flexDirection: 'row', gap: Spacing.sm },
  unitBtn: {
    flex:              1,
    paddingVertical:   10,
    alignItems:        'center',
    borderRadius:      Radius.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  unitBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  priceInputWrap: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    overflow:        'hidden',
  },
  pesoCurrency: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    backgroundColor:   Colors.border,
    alignItems:        'center',
    justifyContent:    'center',
  },
  priceInput: {
    flex:        1,
    fontSize:    24,
    fontFamily:  'PlusJakartaSans_700Bold',
    color:       Colors.ink,
    padding:     Spacing.md,
  },

  earningsCard: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  earningsRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  toggleRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
  },

  // Amenities
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  amenityBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   10,
    paddingHorizontal: 14,
    borderRadius:      Radius.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  amenityBtnSelected: {
    borderColor:     Colors.teal,
    backgroundColor: Colors.tealLight,
  },

  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  addPhotoBtn: {
    width:           (W - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    aspectRatio:     1,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderStyle:     'dashed',
    borderColor:     Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.primaryLight,
  },
  addPhotoIcon: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
  },
  photoThumb: {
    width:        (W - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    aspectRatio:  1,
    borderRadius: Radius.md,
    overflow:     'hidden',
    position:     'relative',
  },
  photoImg: {
    width:  '100%',
    height: '100%',
  },
  coverBadge: {
    position:          'absolute',
    bottom:            6,
    left:              6,
    backgroundColor:   Colors.primary,
    borderRadius:      Radius.full,
    paddingVertical:   3,
    paddingHorizontal: 7,
  },
  removePhotoBtn: {
    position:        'absolute',
    top:             6,
    right:           6,
    width:           22,
    height:          22,
    borderRadius:    11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Rules
  policyRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  policyRowSelected: {
    borderColor:     Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioOuter: {
    width:          20,
    height:         20,
    borderRadius:   10,
    borderWidth:    2,
    borderColor:    Colors.border,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     Spacing.md,
    flexShrink:     0,
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: Colors.primary,
  },

  // Review
  previewCard: {
    borderRadius: Radius.lg,
    overflow:     'hidden',
    borderWidth:  1,
    borderColor:  Colors.border,
    ...Shadow.sm,
  },
  previewImg: {
    height:         160,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  previewBadge: {
    position:          'absolute',
    top:               10,
    left:              10,
    backgroundColor:   Colors.ink,
    borderRadius:      Radius.full,
    paddingVertical:   4,
    paddingHorizontal: 9,
  },
  reviewCard: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  reviewRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: Spacing.sm,
  },
  reviewDivider: {
    height:          1,
    backgroundColor: Colors.border,
  },

  // Shared
  infoBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },

  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    backgroundColor:   Colors.white,
    gap:               Spacing.xs,
  },
  skipBtn: { paddingVertical: Spacing.xs },
});