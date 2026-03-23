// app/(tabs)/saved/index.tsx
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText }    from '@/components/ui/AppText';
import { CategoryIcon, CATEGORY_CONFIG } from '@/components/ui/CategoryIcon';
import { useSaved }   from '@/hooks/useBookings';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import type { SavedListingRow } from '@/lib/bookingsService';

// ─── Saved card ───────────────────────────────────────────────────────────────

function SavedCard({ item, onRemove }: { item: SavedListingRow; onRemove: () => void }) {
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  return (
    <View style={styles.card}>
      {/* Image area */}
      <View style={[styles.cardImg, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={52} color={cfg.color} />

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={18} color="#FF4444" />
        </TouchableOpacity>

        {item.instant_book && (
          <View style={styles.instantBadge}>
            <Feather name="zap" size={10} color={Colors.white} />
            <AppText variant="caption" weight="bold" color={Colors.white} style={{ fontSize: 9, marginLeft: 3 }}>
              Instant
            </AppText>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <AppText
          variant="caption"
          weight="bold"
          style={{ color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}
        >
          {item.category.replace(/_/g, ' ')}
        </AppText>

        <AppText variant="bodyLg" weight="bold" numberOfLines={1} style={{ marginBottom: 5 }}>
          {item.title}
        </AppText>

        <View style={styles.infoRow}>
          <Feather name="map-pin" size={11} color={Colors.subtle} />
          <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 4 }}>
            {item.city}
          </AppText>
        </View>

        {item.host_is_verified && (
          <View style={[styles.infoRow, { marginTop: Spacing.xs }]}>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={9} color={Colors.teal} />
              <AppText variant="caption" weight="bold" color={Colors.teal} style={{ marginLeft: 3 }}>
                ID Verified
              </AppText>
            </View>
            <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 6 }}>
              by {item.host_name}
            </AppText>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <View style={styles.priceRow}>
              <AppText variant="h3" weight="extrabold">₱{Number(item.price).toLocaleString()}</AppText>
              <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 3 }}>/ {item.price_unit}</AppText>
            </View>
            {item.avg_rating > 0 && (
              <View style={styles.ratingRow}>
                <Feather name="star" size={11} color="#FFB800" />
                <AppText variant="caption" weight="bold" style={{ marginLeft: 3 }}>{item.avg_rating.toFixed(1)}</AppText>
                {item.review_count > 0 && (
                  <AppText variant="caption" color={Colors.subtle} style={{ marginLeft: 2 }}>({item.review_count})</AppText>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.bookBtn} activeOpacity={0.85}>
            <AppText variant="label" weight="bold" color={Colors.white}>Book now</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { saved, isLoading, isRefreshing, error, refresh, toggleSave } = useSaved();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <AppText variant="h2" weight="extrabold">Saved</AppText>
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="body" color={Colors.muted} style={{ marginTop: Spacing.md }}>
            Loading saved listings…
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h2" weight="extrabold">Saved</AppText>
        <AppText variant="label" color={Colors.muted} style={{ marginTop: 2 }}>
          {saved.length} listing{saved.length !== 1 ? 's' : ''} saved
        </AppText>
      </View>

      {error ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={28} color={Colors.muted} />
          </View>
          <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>Something went wrong</AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <AppText variant="label" weight="bold" color={Colors.primary}>Try again</AppText>
          </TouchableOpacity>
        </View>
      ) : saved.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Feather name="heart" size={32} color={Colors.muted} />
          </View>
          <AppText variant="h2" weight="extrabold" center style={{ marginTop: Spacing.lg }}>
            Nothing saved yet
          </AppText>
          <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm, maxWidth: 260 }}>
            Tap the heart icon on any listing to save it here for later.
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        >
          <View style={styles.infoBanner}>
            <Feather name="info" size={14} color={Colors.teal} />
            <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 8, flex: 1 }}>
              Tap the heart to remove a listing from your saved collection.
            </AppText>
          </View>
          {saved.map(item => (
            <SavedCard key={item.id} item={item} onRemove={() => toggleSave(item.listing_id)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  retryBtn: { marginTop: Spacing.lg, paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.border },
  listContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['5xl'] },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.tealLight, borderRadius: Radius.md, padding: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md },
  cardImg: { height: 160, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  removeBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  instantBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.teal, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 8 },
  cardBody: { padding: Spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.tealLight, borderRadius: Radius.full, paddingVertical: 3, paddingHorizontal: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  bookBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: 20 },
});