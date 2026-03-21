import { useState, useRef } from 'react';
import {
  View, StyleSheet, Dimensions, ScrollView,
  TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Svg, { Circle, Rect, Path, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText }   from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { Colors, Spacing, Radius } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ─── Slide illustrations (pure SVG — no external images needed) ───────────────

function ParkingIllustration() {
  return (
    <Svg width={240} height={200} viewBox="0 0 240 200">
      {/* Road */}
      <Rect x="20" y="140" width="200" height="50" rx="8" fill="#E8E4DC" />
      <Rect x="60" y="162" width="30" height="6" rx="3" fill="white" opacity={0.6} />
      <Rect x="105" y="162" width="30" height="6" rx="3" fill="white" opacity={0.6} />
      <Rect x="150" y="162" width="30" height="6" rx="3" fill="white" opacity={0.6} />
      {/* Parking structure */}
      <Rect x="60" y="60" width="120" height="90" rx="10" fill="#F0EDE6" />
      <Rect x="60" y="60" width="120" height="14" rx="10" fill="#E0DDD6" />
      {/* Pillars */}
      <Rect x="75"  y="74" width="8" height="70" rx="2" fill="#D4D0C8" />
      <Rect x="116" y="74" width="8" height="70" rx="2" fill="#D4D0C8" />
      <Rect x="157" y="74" width="8" height="70" rx="2" fill="#D4D0C8" />
      {/* Car */}
      <Rect x="82" y="98" width="52" height="28" rx="7" fill="#FF6B35" />
      <Rect x="89" y="91" width="36" height="16" rx="5" fill="#FF8C5E" />
      <Circle cx="92"  cy="130" r="7" fill="#2C2C2C" />
      <Circle cx="92"  cy="130" r="3" fill="#555" />
      <Circle cx="124" cy="130" r="7" fill="#2C2C2C" />
      <Circle cx="124" cy="130" r="3" fill="#555" />
      <Rect x="86" y="95" width="14" height="9" rx="2" fill="#BDE9FF" opacity={0.8} />
      <Rect x="104" y="95" width="14" height="9" rx="2" fill="#BDE9FF" opacity={0.8} />
      {/* P sign */}
      <Circle cx="188" cy="48" r="18" fill={Colors.primary} />
      <Path d="M182 57V39h9a6 6 0 010 12h-9" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function RentEverythingIllustration() {
  return (
    <Svg width={240} height={200} viewBox="0 0 240 200">
      {/* House */}
      <Polygon points="120,30 170,70 170,140 70,140 70,70" fill="#FF8C5E" />
      <Polygon points="60,75 120,25 180,75" fill="#FF6B35" />
      <Rect x="100" y="100" width="40" height="40" rx="4" fill="#BDE9FF" opacity={0.9} />
      <Rect x="108" y="100" width="3" height="40" fill="white" opacity={0.4} />
      <Rect x="100" y="118" width="40" height="3" fill="white" opacity={0.4} />
      {/* Car bottom-left */}
      <Rect x="12" y="145" width="70" height="32" rx="8" fill="#534AB7" />
      <Rect x="20" y="135" width="52" height="18" rx="6" fill="#7F77DD" />
      <Circle cx="25" cy="178" r="8" fill="#1A1A1A" /><Circle cx="25" cy="178" r="3" fill="#555" />
      <Circle cx="69" cy="178" r="8" fill="#1A1A1A" /><Circle cx="69" cy="178" r="3" fill="#555" />
      {/* Equipment bottom-right */}
      <Rect x="158" y="138" width="70" height="46" rx="8" fill="#0D9E75" />
      <Rect x="170" y="148" width="46" height="6" rx="3" fill="white" opacity={0.5} />
      <Rect x="170" y="160" width="36" height="6" rx="3" fill="white" opacity={0.5} />
      <Rect x="170" y="172" width="42" height="6" rx="3" fill="white" opacity={0.5} />
      {/* Floating coins */}
      <Circle cx="195" cy="50" r="12" fill="#F59E0B" />
      <Path d="M192 50 h6 M192 46 h6 M192 54 h6" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <Circle cx="40" cy="55" r="10" fill="#F59E0B" opacity={0.7} />
      <Path d="M37 55 h6 M37 51 h6" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function EarnIllustration() {
  return (
    <Svg width={240} height={200} viewBox="0 0 240 200">
      {/* Phone */}
      <Rect x="80" y="20" width="80" height="140" rx="16" fill="#1A1A1A" />
      <Rect x="86" y="28" width="68" height="116" rx="10" fill="#F7F5F2" />
      {/* Screen content */}
      <Rect x="94" y="36" width="52" height="8" rx="4" fill={Colors.primary} />
      <Rect x="94" y="50" width="38" height="6" rx="3" fill="#E0DDD6" />
      <Rect x="94" y="62" width="44" height="6" rx="3" fill="#E0DDD6" />
      {/* Earnings card on screen */}
      <Rect x="90" y="74" width="60" height="40" rx="8" fill={Colors.primary} />
      <Rect x="96" y="80" width="28" height="5" rx="2" fill="white" opacity={0.6} />
      <Rect x="96" y="90" width="40" height="8" rx="3" fill="white" />
      <Rect x="96" y="103" width="20" height="4" rx="2" fill="white" opacity={0.5} />
      {/* Checkmark */}
      <Rect x="90" y="120" width="60" height="18" rx="6" fill="#0D9E75" />
      <Path d="M102 129 l5 5 10-10" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="118" y="126" width="24" height="5" rx="2" fill="white" opacity={0.7} />
      {/* Money flying out */}
      <Circle cx="185" cy="60" r="18" fill="#F59E0B" />
      <Path d="M178 60 h14 M178 54 h14 M178 66 h10" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <Circle cx="55"  cy="80" r="14" fill="#F59E0B" opacity={0.8} />
      <Path d="M49 80 h12 M49 75 h12" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      {/* Stars */}
      <Path d="M190 100 l2 5 5 0 -4 3 1 5 -4-3 -4 3 1-5 -4-3 5 0z" fill="#FFD700" />
      <Path d="M45 40 l1.5 3.5 3.5 0 -3 2.5 1 3.5 -3-2 -3 2 1-3.5 -3-2.5 3.5 0z" fill="#FFD700" opacity={0.7} />
    </Svg>
  );
}

// ─── Slide data ────────────────────────────────────────────────────────────────

const slides = [
  {
    key:         'find',
    gradient:    ['#FFF7F4', '#FFE8DA'] as const,
    accentColor: Colors.primary,
    illustration: <ParkingIllustration />,
    title:       'Find spaces near you',
    subtitle:    'Parking, rooms, cars, equipment — search whats available around you in seconds.',
    badge:       '🔍  Explore nearby',
  },
  {
    key:         'rent',
    gradient:    ['#F0FDF9', '#D1FAE5'] as const,
    accentColor: Colors.teal,
    illustration: <RentEverythingIllustration />,
    title:       'Rent almost anything',
    subtitle:    'From a parking slot to a rest house to a camera — book it safely through the app.',
    badge:       '✅  Safe & protected',
  },
  {
    key:         'earn',
    gradient:    ['#FFFBEB', '#FDE68A'] as const,
    accentColor: '#F59E0B',
    illustration: <EarnIllustration />,
    title:       'List yours. Earn today.',
    subtitle:    'Have an extra parking slot or spare room? List it free and start earning — no experience needed.',
    badge:       '💰  List for free',
  },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);

  function handleScroll(e: any) {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(page);
  }

  function goNext() {
    if (current < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (current + 1), animated: true });
      setCurrent(current + 1);
    } else {
      router.push('/(auth)/login');
    }
  }

  function skip() {
    router.push('/(auth)/login');
  }

  const slide = slides[current];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Sliding content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => (
          <LinearGradient
            key={s.key}
            colors={s.gradient}
            style={styles.slide}
          >
            {/* Skip button */}
            {i < slides.length - 1 && (
              <SafeAreaView style={styles.skipWrap}>
                <TouchableOpacity onPress={skip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <AppText variant="label" weight="semibold" color={Colors.muted}>Skip</AppText>
                </TouchableOpacity>
              </SafeAreaView>
            )}

            {/* Illustration */}
            <MotiView
              from={{ opacity: 0, translateY: 20, scale: 0.92 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120 }}
              style={styles.illustrationWrap}
            >
              {s.illustration}
            </MotiView>

            {/* Badge */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 150, type: 'spring', damping: 20 }}
            >
              <View style={[styles.badge, { backgroundColor: s.accentColor + '22', borderColor: s.accentColor + '44' }]}>
                <AppText variant="caption" weight="bold" color={s.accentColor}>{s.badge}</AppText>
              </View>
            </MotiView>

            {/* Text */}
            <MotiView
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, type: 'spring', damping: 20 }}
              style={styles.textBlock}
            >
              <AppText variant="h1" weight="extrabold" center style={{ color: Colors.ink, marginBottom: 12 }}>
                {s.title}
              </AppText>
              <AppText variant="bodyLg" center color={Colors.muted} style={{ lineHeight: 26 }}>
                {s.subtitle}
              </AppText>
            </MotiView>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <MotiView
              key={s.key}
              animate={{
                width:            i === current ? 24 : 8,
                backgroundColor:  i === current ? slide.accentColor : Colors.border,
              }}
              transition={{ type: 'spring', damping: 18 }}
              style={styles.dot}
            />
          ))}
        </View>

        {/* CTA */}
        <AppButton
          label={current < slides.length - 1 ? 'Next  →' : 'Get started  →'}
          onPress={goNext}
          style={{ backgroundColor: slide.accentColor, borderColor: slide.accentColor, marginBottom: 14 }}
        />

        {current === slides.length - 1 && (
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <AppText variant="label" weight="semibold" center color={Colors.muted}>
              New here?{'  '}
              <AppText variant="label" weight="bold" color={Colors.primary}>Create a free account</AppText>
            </AppText>
          </TouchableOpacity>
        )}

        {current < slides.length - 1 && (
          <TouchableOpacity onPress={skip}>
            <AppText variant="label" weight="semibold" center color={Colors.subtle}>
              Already have an account? Log in
            </AppText>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.white },
  slide: {
    width,
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop:     Platform.OS === 'android' ? 50 : 0,
  },
  skipWrap: {
    position: 'absolute',
    top:      Platform.OS === 'android' ? 48 : 56,
    right:    Spacing.xl,
    zIndex:   10,
  },
  illustrationWrap: {
    marginBottom: Spacing['3xl'],
    alignItems:   'center',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderRadius:      Radius.full,
    borderWidth:       1,
    marginBottom:      Spacing.lg,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  bottom: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
    backgroundColor:   Colors.white,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    paddingBottom:     8,
  },
  dots: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginBottom:   Spacing.lg,
  },
  dot: {
    height:       8,
    borderRadius: Radius.full,
  },
});
