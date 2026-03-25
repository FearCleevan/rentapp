// app/(tabs)/host/index.tsx

import { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Image } from 'expo-image';

import { AppText }    from '@/components/ui/AppText';
import { AppButton }  from '@/components/ui/AppButton';
import { useAuthStore } from '@/store/authStore';
import { fetchHostListings, setListingStatus } from '@/lib/listingsService';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Category icon map ────────────────────────────────────────────────────────

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type MCIName     = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CATEGORY_CONFIG: Record<string, {
  icon:      FeatherName | MCIName;
  iconLib:   'feather' | 'mci';
  color:     string;
  bg:        string;
}> = {
  parking:      { icon: 'map-pin',            iconLib: 'feather', color: '#FF6B35', bg: '#FFF0EB' },
  room:         { icon: 'home',               iconLib: 'feather', color: '#0D9E75', bg: '#E8F8F3' },
  vehicle:      { icon: 'truck',              iconLib: 'feather', color: '#534AB7', bg: '#EEEDFE' },
  equipment:    { icon: 'camera',             iconLib: 'feather', color: '#854F0B', bg: '#FAEEDA' },
  venue:        { icon: 'calendar',           iconLib: 'feather', color: '#C0480A', bg: '#FAECE7' },
  event_venue:  { icon: 'calendar',           iconLib: 'feather', color: '#C0480A', bg: '#FAECE7' },
  meeting_room: { icon: 'briefcase',          iconLib: 'feather', color: '#1A6E8C', bg: '#DDE8EC' },
  storage:      { icon: 'package',            iconLib: 'feather', color: '#5F5E5A', bg: '#F1EFE8' },
};

function CategoryIcon({
  category,
  size = 22,
  style,
}: {
  category: string;
  size?:    number;
  style?:   any;
}) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.storage;
  if (cfg.iconLib === 'mci') {
    return (
      <MaterialCommunityIcons
        name={cfg.icon as MCIName}
        size={size}
        color={cfg.color}
        style={style}
      />
    );
  }
  return (
    <Feather
      name={cfg.icon as FeatherName}
      size={size}
      color={cfg.color}
      style={style}
    />
  );
}

// ─── Become Host screen ───────────────────────────────────────────────────────

function BecomeHostScreen() {
  const router = useRouter();

  const PERKS = [
    { icon: 'dollar-sign' as FeatherName, color: Colors.teal,    bg: Colors.tealLight,    title: 'Earn extra income',     desc: 'Turn idle spaces into steady monthly income'        },
    { icon: 'shield'      as FeatherName, color: '#534AB7',       bg: '#EEEDFE',           title: 'Protected payments',    desc: 'Every peso held in escrow until rental ends'        },
    { icon: 'sliders'     as FeatherName, color: Colors.primary,  bg: Colors.primaryLight, title: 'Full control',          desc: 'Set your price, availability, and house rules'      },
    { icon: 'users'       as FeatherName, color: '#C0480A',       bg: '#FAECE7',           title: 'Verified renters only', desc: 'Renters must verify their ID before they can book'  },
  ];

  const CATEGORIES = [
    { category: 'parking',      label: 'Parking',       price: '₱50–200/hr'     },
    { category: 'room',         label: 'Rooms',          price: '₱500–2k/day'   },
    { category: 'vehicle',      label: 'Vehicles',       price: '₱800–3k/day'   },
    { category: 'equipment',    label: 'Equipment',      price: '₱300–2k/day'   },
    { category: 'venue',        label: 'Venues',         price: '₱3k–20k/day'   },
    { category: 'meeting_room', label: 'Meeting rooms',  price: '₱300–800/hr'   },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.guestScroll}
      >
        {/* Hero */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 50 }}
          style={styles.guestHero}
        >
          {/* Hero icon instead of emoji */}
          <View style={styles.heroIconWrap}>
            <Feather name="home" size={52} color={Colors.primary} />
            <View style={styles.heroBadge}>
              <Feather name="trending-up" size={18} color={Colors.teal} />
            </View>
          </View>

          <AppText variant="h1" weight="extrabold" center style={styles.heroTitle}>
            Start earning from your space
          </AppText>
          <AppText variant="body" color={Colors.muted} center style={styles.heroSubtitle}>
            Join hundreds of hosts in Davao City already earning from their parking slots, rooms, vehicles, and more.
          </AppText>

          <View style={styles.earningsBanner}>
            <View style={styles.earningsIconWrap}>
              <Feather name="trending-up" size={18} color={Colors.teal} />
            </View>
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <AppText variant="label" weight="bold" color={Colors.teal}>
                Average host earns ₱8,000/month
              </AppText>
              <AppText variant="caption" color={Colors.muted}>
                Based on Davao City hosts on Rentapp
              </AppText>
            </View>
          </View>
        </MotiView>

        {/* Perks */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 150 }}
          style={styles.perksSection}
        >
          <AppText variant="h3" weight="extrabold" style={{ marginBottom: Spacing.lg }}>
            Why host on Rentapp?
          </AppText>

          {PERKS.map(perk => (
            <View key={perk.icon} style={styles.perkRow}>
              <View style={[styles.perkIcon, { backgroundColor: perk.bg }]}>
                <Feather name={perk.icon} size={20} color={perk.color} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <AppText variant="label" weight="bold">{perk.title}</AppText>
                <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
                  {perk.desc}
                </AppText>
              </View>
            </View>
          ))}
        </MotiView>

        {/* Categories */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 250 }}
        >
          <AppText variant="h3" weight="extrabold" style={{ marginBottom: Spacing.md }}>
            What can you list?
          </AppText>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(c => {
              const cfg = CATEGORY_CONFIG[c.category] ?? CATEGORY_CONFIG.storage;
              return (
                <View key={c.category} style={styles.categoryCard}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: cfg.bg }]}>
                    <CategoryIcon category={c.category} size={24} />
                  </View>
                  <AppText variant="label" weight="bold" center style={{ marginTop: Spacing.sm }}>
                    {c.label}
                  </AppText>
                  <AppText variant="caption" weight="semibold" center style={{ color: cfg.color, marginTop: 2 }}>
                    {c.price}
                  </AppText>
                </View>
              );
            })}
          </View>
        </MotiView>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <AppButton
            label="Become a host — it's free →"
            onPress={() => router.push('/become-host')}
          />
          <AppText variant="caption" color={Colors.subtle} center style={{ marginTop: Spacing.sm }}>
            No fees to list · Cancel anytime · You stay in control
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Host Dashboard ───────────────────────────────────────────────────────────

const QUICK_ACTIONS: {
  icon:      FeatherName;
  label:     string;
  color:     string;
  iconColor: string;
}[] = [
  { icon: 'plus-circle',    label: 'Add listing',  color: Colors.primaryLight, iconColor: Colors.primary },
  { icon: 'calendar',       label: 'Availability', color: Colors.tealLight,    iconColor: Colors.teal    },
  { icon: 'bar-chart-2',    label: 'Earnings',     color: '#EEEDFE',           iconColor: '#534AB7'      },
  { icon: 'message-circle', label: 'Messages',     color: '#FAEEDA',           iconColor: '#854F0B'      },
];

function ListingRow({
  item,
  index,
  onToggle,
}: {
  item:     any;
  index:    number;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [active, setActive] = useState(item.status === 'active');
  const cfg = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.storage;

  const statusCfg = active
    ? { label: 'Active', bg: Colors.tealLight, text: Colors.teal }
    : item.status === 'draft'
      ? { label: 'Draft',  bg: '#FAEEDA',    text: '#854F0B'      }
      : { label: 'Paused', bg: Colors.bg,    text: Colors.subtle  };

  return (
    <View>
      {index > 0 && <View style={styles.listingDivider} />}
      <TouchableOpacity style={styles.listingRow} activeOpacity={0.85}>
        {/* Icon thumb */}
        <View style={[styles.listingThumb, { backgroundColor: cfg.bg }]}>
          {item.cover_photo_url ? (
            <Image source={{ uri: item.cover_photo_url }} style={styles.listingThumbImg} contentFit="cover" />
          ) : (
            <CategoryIcon category={item.category} size={22} />
          )}
        </View>

        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <AppText variant="label" weight="bold" numberOfLines={1}>{item.title}</AppText>
          <AppText variant="caption" color={Colors.muted} style={{ marginTop: 2 }}>
            ₱{Number(item.price).toLocaleString()}/{item.price_unit}
            {item.avg_rating > 0
              ? ` · ★${item.avg_rating.toFixed(1)} (${item.review_count})`
              : ' · No reviews yet'}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
              <AppText variant="caption" weight="bold" color={statusCfg.text}>
                {statusCfg.label}
              </AppText>
            </View>
            {item.total_bookings > 0 && (
              <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 8 }}>
                {item.total_bookings} bookings
              </AppText>
            )}
          </View>
        </View>

        {item.status !== 'draft' && (
          <Switch
            value={active}
            onValueChange={(v) => { setActive(v); onToggle(item.id, v); }}
            trackColor={{ false: Colors.border, true: Colors.teal }}
            thumbColor={Colors.white}
            style={{ marginLeft: Spacing.sm }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

function HostDashboard() {
  const router = useRouter(); 
  const { user, profile } = useAuthStore();

  const [listings,     setListings]     = useState<any[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = (profile?.full_name ?? 'Host').split(' ')[0];

  const loadListings = useCallback(async (refresh = false) => {
    if (!user?.id) return;
    if (refresh) setIsRefreshing(true);
    else         setIsLoading(true);
    const { data } = await fetchHostListings(user.id);
    setListings(data ?? []);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [user?.id]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalBookings  = listings.reduce((s, l) => s + (l.total_bookings ?? 0), 0);

  async function handleToggle(listingId: string, active: boolean) {
    await setListingStatus(listingId, active ? 'active' : 'paused');
    loadListings();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadListings(true)}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <AppText variant="caption" color={Colors.muted}>Welcome back,</AppText>
            <AppText variant="h2" weight="extrabold">{firstName} 👋</AppText>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={20} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Verify banner */}
        {!profile?.is_verified && (
          <TouchableOpacity style={styles.verifyBanner} activeOpacity={0.85}>
            <Feather name="shield" size={18} color="#854F0B" />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <AppText variant="label" weight="bold" color="#92400E">
                Verify your ID to get more bookings
              </AppText>
              <AppText variant="caption" color="#A16207">
                Verified hosts get 3× more bookings — takes 2 mins
              </AppText>
            </View>
            <Feather name="chevron-right" size={18} color="#854F0B" />
          </TouchableOpacity>
        )}

        {/* Stats card */}
        <View style={styles.statsCard}>
          {[
            { label: 'Active listings', value: activeListings, icon: 'home'        as FeatherName },
            { label: 'Total bookings',  value: totalBookings,  icon: 'calendar'    as FeatherName },
            { label: 'Avg rating',      value: profile?.host_rating
                ? `★${profile.host_rating.toFixed(1)}` : '—',
              icon: 'star' as FeatherName },
          ].map((s, i) => (
            <View key={s.label} style={styles.statItem}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statIconWrap}>
                <Feather name={s.icon} size={14} color="rgba(255,255,255,0.6)" />
              </View>
              <AppText variant="h2" weight="extrabold" color={Colors.white} style={{ marginTop: 4 }}>
                {s.value}
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }} center>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.label} style={styles.qaBtn} activeOpacity={0.8}>
              <View style={[styles.qaIcon, { backgroundColor: a.color }]}>
                <Feather name={a.icon} size={18} color={a.iconColor} />
              </View>
              <AppText variant="caption" weight="semibold" color={Colors.muted} center style={{ marginTop: 5 }}>
                {a.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Listings */}
        <View style={styles.sectionHeader}>
          <AppText variant="bodyLg" weight="bold">My listings</AppText>
          <View style={styles.listingsCountBadge}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              {listings.length} total
            </AppText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.primary} />
            <AppText variant="caption" color={Colors.muted} style={{ marginTop: 8 }}>
              Loading listings…
            </AppText>
          </View>
        ) : listings.length === 0 ? (
          <View style={styles.emptyListings}>
            <View style={styles.emptyIconWrap}>
              <Feather name="plus-circle" size={32} color={Colors.primary} />
            </View>
            <AppText variant="h3" weight="bold" center style={{ marginTop: Spacing.md }}>
              No listings yet
            </AppText>
            <AppText variant="body" color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
              Add your first listing to start earning.
            </AppText>
          </View>
        ) : (
          <View style={styles.listingsCard}>
            {listings.map((item, i) => (
              <ListingRow
                key={item.id}
                item={item}
                index={i}
                onToggle={handleToggle}
              />
            ))}
          </View>
        )}

        <AppButton
          label="+ Add new listing"
          onPress={() => router.push('/listings/create')}
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function HostScreen() {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isHost = (profile as any)?.is_host === true;
  return isHost ? <HostDashboard /> : <BecomeHostScreen />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.lg },

  // ── Guest ──────────────────────────────────────────────────────────────────
  guestScroll: { padding: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.xl },
  guestHero:   { alignItems: 'center' },

  heroIconWrap: {
    width:           130,
    height:          130,
    borderRadius:    65,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xl,
    borderWidth:     2,
    borderColor:     Colors.primary + '20',
  },
  heroBadge: {
    position:        'absolute',
    bottom:          4,
    right:           4,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.tealLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     Colors.white,
  },

  heroTitle:    { marginBottom: Spacing.md, lineHeight: 36 },
  heroSubtitle: { lineHeight: 22, maxWidth: 300, textAlign: 'center', marginBottom: Spacing.lg },

  earningsBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    width:           '100%',
  },
  earningsIconWrap: {
    width:           38,
    height:          38,
    borderRadius:    10,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },

  perksSection: { gap: Spacing.sm },
  perkRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    ...Shadow.sm,
  },
  perkIcon: {
    width:           46,
    height:          46,
    borderRadius:    13,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  categoryCard: {
    width:           '30.5%',
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    alignItems:      'center',
    ...Shadow.sm,
  },
  categoryIconWrap: {
    width:           52,
    height:          52,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
  },

  ctaSection: { gap: Spacing.xs },

  // ── Host dashboard ─────────────────────────────────────────────────────────
  greeting: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  notifBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.sm,
  },
  verifyBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFBEB',
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     '#FDE68A',
  },

  statsCard: {
    backgroundColor: Colors.ink,
    borderRadius:    Radius.lg,
    padding:         Spacing.xl,
    flexDirection:   'row',
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
    position:   'relative',
  },
  statDivider: {
    position:        'absolute',
    left:            0,
    top:             '10%',
    width:           1,
    height:          '80%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  qaBtn:        { alignItems: 'center', flex: 1 },
  qaIcon: {
    width:          52,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  listingsCountBadge: {
    backgroundColor:   Colors.primaryLight,
    borderRadius:      Radius.full,
    paddingVertical:   4,
    paddingHorizontal: 12,
    borderWidth:       1,
    borderColor:       Colors.primary + '30',
  },

  listingsCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.sm,
  },
  listingRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.md,
  },
  listingThumb: {
    width:           52,
    height:          52,
    borderRadius:    Radius.md,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    overflow:        'hidden',
  },
  listingThumbImg: { width: '100%', height: '100%' },
  listingDivider: {
    height:           1,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.lg,
  },
  statusPill: {
    borderRadius:      Radius.full,
    paddingVertical:   2,
    paddingHorizontal: 8,
  },

  loadingState: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyListings: {
    alignItems:      'center',
    paddingVertical: Spacing['3xl'],
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    ...Shadow.sm,
  },
  emptyIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
