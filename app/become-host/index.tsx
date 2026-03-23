// app/become-host/index.tsx

import { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText }    from '@/components/ui/AppText';
import { AppButton }  from '@/components/ui/AppButton';
import { useToast }   from '@/components/ui/Toast';
import { supabase }   from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { fetchProfile }  from '@/lib/profileService';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width: W } = Dimensions.get('window');

type FeatherName = React.ComponentProps<typeof Feather>['name'];

// ─── Step illustration (icon-based) ──────────────────────────────────────────

function StepIllustration({
  icons,
  primaryColor,
}: {
  icons:        { name: FeatherName; bg: string; color: string; size?: number }[];
  primaryColor: string;
}) {
  return (
    <View style={[ill.wrap, { borderColor: primaryColor + '20' }]}>
      {/* Center icon — large */}
      <View style={[ill.centerIcon, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}>
        <Feather name={icons[0].name} size={icons[0].size ?? 40} color={primaryColor} />
      </View>
      {/* Satellite icons */}
      {icons.slice(1).map((ic, i) => (
        <View
          key={ic.name}
          style={[
            ill.satellite,
            { backgroundColor: ic.bg, borderColor: ic.color + '30' },
            i === 0 && ill.satTopRight,
            i === 1 && ill.satBottomLeft,
            i === 2 && ill.satBottomRight,
          ]}
        >
          <Feather name={ic.name} size={18} color={ic.color} />
        </View>
      ))}
    </View>
  );
}

const ill = StyleSheet.create({
  wrap: {
    width:           200,
    height:          200,
    borderRadius:    100,
    borderWidth:     2,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
    backgroundColor: Colors.bg,
  },
  centerIcon: {
    width:        110,
    height:       110,
    borderRadius: 55,
    borderWidth:  2,
    alignItems:   'center',
    justifyContent: 'center',
  },
  satellite: {
    position:     'absolute',
    width:        44,
    height:       44,
    borderRadius: 14,
    borderWidth:  1.5,
    alignItems:   'center',
    justifyContent: 'center',
  },
  satTopRight:    { top:    16, right:  16 },
  satBottomLeft:  { bottom: 24, left:   16 },
  satBottomRight: { bottom: 16, right:  24 },
});

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    key:          'list',
    primaryColor: Colors.primary,
    illustration: {
      icons: [
        { name: 'home'         as FeatherName, bg: Colors.primaryLight, color: Colors.primary, size: 40 },
        { name: 'map-pin'      as FeatherName, bg: '#FFF0EB',           color: '#C0480A'                },
        { name: 'camera'       as FeatherName, bg: '#FAEEDA',           color: '#854F0B'                },
        { name: 'truck'        as FeatherName, bg: '#EEEDFE',           color: '#534AB7'                },
      ],
    },
    badge:    '📋  Step 1 of 3',
    title:    'List your space',
    subtitle: 'Parking slots, rooms, vehicles, equipment — if you own it and it sits idle, you can earn from it.',
    bullets: [
      { icon: 'clock'        as FeatherName, text: 'Takes less than 10 minutes to list'  },
      { icon: 'eye'          as FeatherName, text: 'You control who can book and when'   },
      { icon: 'dollar-sign'  as FeatherName, text: 'Set your own price and availability' },
    ],
  },
  {
    key:          'earn',
    primaryColor: Colors.teal,
    illustration: {
      icons: [
        { name: 'trending-up' as FeatherName, bg: Colors.tealLight,    color: Colors.teal,   size: 40 },
        { name: 'dollar-sign' as FeatherName, bg: '#FEF3C7',           color: '#D97706'               },
        { name: 'smartphone'  as FeatherName, bg: '#EEEDFE',           color: '#534AB7'               },
        { name: 'shield'      as FeatherName, bg: Colors.tealLight,    color: Colors.teal             },
      ],
    },
    badge:    '💰  Step 2 of 3',
    title:    'Earn on your terms',
    subtitle: 'Accept or decline any booking. Your money is held securely and released to you after every rental.',
    bullets: [
      { icon: 'shield'       as FeatherName, text: 'Payments protected by escrow'    },
      { icon: 'trending-up'  as FeatherName, text: 'Average host earns ₱8,000/month' },
      { icon: 'smartphone'   as FeatherName, text: 'Instant GCash or bank payout'    },
    ],
  },
  {
    key:          'safe',
    primaryColor: '#534AB7',
    illustration: {
      icons: [
        { name: 'user-check'  as FeatherName, bg: '#EEEDFE',           color: '#534AB7',     size: 40 },
        { name: 'check-circle'as FeatherName, bg: Colors.tealLight,    color: Colors.teal             },
        { name: 'phone'       as FeatherName, bg: Colors.primaryLight, color: Colors.primary          },
        { name: 'award'       as FeatherName, bg: '#FEF3C7',           color: '#D97706'               },
      ],
    },
    badge:    '🛡️  Step 3 of 3',
    title:    'Host with confidence',
    subtitle: 'Every renter is verified before they can book. Our team is here if anything goes wrong.',
    bullets: [
      { icon: 'user-check'   as FeatherName, text: 'Renters verify their ID before booking' },
      { icon: 'phone'        as FeatherName, text: '24/7 support for hosts'                 },
      { icon: 'award'        as FeatherName, text: 'Host protection on every rental'        },
    ],
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BecomeHostScreen() {
  const router    = useRouter();
  const toast     = useToast();
  const { user, setProfile } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);

  function handleScroll(e: any) {
    const page = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrent(page);
  }

  function goNext() {
    if (current < STEPS.length - 1) {
      scrollRef.current?.scrollTo({ x: W * (current + 1), animated: true });
      setCurrent(current + 1);
    } else {
      handleBecomeHost();
    }
  }

  async function handleBecomeHost() {
    if (!user?.id) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ is_host: true })
      .eq('id', user.id);

    if (error) {
      toast.show('Something went wrong. Please try again.', 'error');
      setLoading(false);
      return;
    }

    const { data } = await fetchProfile(user.id);
    if (data) setProfile(data);

    setLoading(false);
    toast.show('Welcome to hosting! 🎉', 'success');
    router.replace('/(tabs)/host');
  }

  const step = STEPS[current];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Close */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={20} color={Colors.muted} />
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {STEPS.map((s) => (
          <View key={s.key} style={styles.slide}>
            {/* Icon illustration */}
            <View style={styles.illustrationWrap}>
              <StepIllustration
                icons={s.illustration.icons}
                primaryColor={s.primaryColor}
              />
            </View>

            {/* Badge */}
            <View style={[styles.badge, { borderColor: s.primaryColor + '30' }]}>
              <AppText variant="caption" weight="bold" color={s.primaryColor}>
                {s.badge}
              </AppText>
            </View>

            {/* Text */}
            <AppText variant="h1" weight="extrabold" style={styles.title}>
              {s.title}
            </AppText>
            <AppText variant="body" color={Colors.muted} style={styles.subtitle}>
              {s.subtitle}
            </AppText>

            {/* Bullets */}
            <View style={styles.bullets}>
              {s.bullets.map(b => (
                <View key={b.text} style={styles.bulletRow}>
                  <View style={[styles.bulletIcon, { backgroundColor: s.primaryColor + '12' }]}>
                    <Feather name={b.icon} size={16} color={s.primaryColor} />
                  </View>
                  <AppText variant="label" color={Colors.ink} style={{ flex: 1 }}>
                    {b.text}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? step.primaryColor : Colors.border,
                  width:           i === current ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <AppButton
          label={current < STEPS.length - 1 ? 'Next  →' : "Get started — it's free"}
          onPress={goNext}
          loading={loading}
          style={{ backgroundColor: step.primaryColor, borderColor: step.primaryColor }}
        />

        {current === 0 && (
          <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
            <AppText variant="label" color={Colors.subtle} center>Maybe later</AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.white },
  closeBtn: {
    position:        'absolute',
    top:             Platform.OS === 'ios' ? 56 : 16,
    right:           Spacing.xl,
    zIndex:          10,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  slide: {
    width:             W,
    paddingHorizontal: Spacing.xl,
    paddingTop:        Platform.OS === 'ios' ? 56 : 44,
  },
  illustrationWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing['2xl'],
    height:         210,
  },
  badge: {
    alignSelf:         'flex-start',
    backgroundColor:   Colors.bg,
    borderRadius:      Radius.full,
    paddingVertical:   5,
    paddingHorizontal: 12,
    marginBottom:      Spacing.md,
    borderWidth:       1,
  },
  title: {
    marginBottom: Spacing.sm,
    lineHeight:   36,
  },
  subtitle: {
    lineHeight:   22,
    marginBottom: Spacing.xl,
  },
  bullets: { gap: Spacing.md },
  bulletRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  bulletIcon: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
    paddingBottom:     Platform.OS === 'ios' ? 0 : Spacing.md,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    gap:               Spacing.sm,
  },
  dots: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginBottom:   Spacing.sm,
  },
  dot: {
    height:       8,
    borderRadius: 4,
  },
  skipBtn: { paddingVertical: Spacing.sm },
});