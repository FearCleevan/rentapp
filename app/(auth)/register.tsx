//app/(auth)/register.tsx
import { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  ScrollView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { AppText }       from '@/components/ui/AppText';
import { AppButton }     from '@/components/ui/AppButton';
import { AppInput }      from '@/components/ui/AppInput';
import { useToast }      from '@/components/ui/Toast';
import { signUpWithEmail } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── Validation schemas ───────────────────────────────────────────────────────

const step1Schema = z.object({
  fullName: z
    .string()
    .min(2, 'Please enter your full name')
    .max(80, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters'),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

const step2SchemaBase = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must have at least one uppercase letter')
    .regex(/[0-9]/,  'Must have at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
});

const fullSchema = step1Schema
  .merge(step2SchemaBase)
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof fullSchema>;

function errorText(message: unknown): string | undefined {
  return typeof message === 'string' ? message : undefined;
}

// ─── Password strength indicator ──────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: '8+ characters',    ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number',           ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const levels = [
    { label: 'Weak',   color: Colors.error },
    { label: 'Fair',   color: Colors.amber },
    { label: 'Strong', color: Colors.teal },
  ];
  const lvl = levels[Math.max(0, score - 1)];

  return (
    <View style={pw.wrap}>
      <View style={pw.bars}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[pw.bar, { backgroundColor: i < score ? lvl.color : Colors.border }]}
          />
        ))}
        <AppText variant="caption" weight="semibold" color={lvl.color} style={{ marginLeft: 8 }}>
          {lvl.label}
        </AppText>
      </View>
      <View style={pw.checks}>
        {checks.map(c => (
          <View key={c.label} style={pw.checkItem}>
            <Feather
              name={c.ok ? 'check-circle' : 'circle'}
              size={12}
              color={c.ok ? Colors.teal : Colors.border}
            />
            <AppText
              variant="caption"
              color={c.ok ? Colors.teal : Colors.subtle}
              style={{ marginLeft: 4 }}
            >
              {c.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const pw = StyleSheet.create({
  wrap:      { marginTop: 8, gap: 6 },
  bars:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar:       { flex: 1, height: 4, borderRadius: 2 },
  checks:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center' },
});

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <View style={si.row}>
      <View style={si.lineTrack}>
        <View
          style={[
            si.lineFill,
            { backgroundColor: current > 1 ? Colors.teal : Colors.border },
          ]}
        />
      </View>
      {[1, 2].map((n) => {
        const done   = n < current;
        const active = n === current;
        return (
          <View key={n} style={si.item}>
            <View style={[
              si.circle,
              active && { backgroundColor: Colors.primary,  borderColor: Colors.primary },
              done   && { backgroundColor: Colors.teal,     borderColor: Colors.teal },
            ]}>
              {done
                ? <Feather name="check" size={12} color={Colors.white} />
                : (
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={active ? Colors.white : Colors.subtle}
                  >
                    {String(n)}
                  </AppText>
                )
              }
            </View>
            <AppText
              variant="caption"
              weight={active ? 'semibold' : 'regular'}
              color={active ? Colors.primary : done ? Colors.teal : Colors.subtle}
            >
              {n === 1 ? 'Your info' : 'Account'}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const si = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: Spacing['2xl'], position: 'relative' },
  item:      { alignItems: 'center', gap: 4, flex: 1 },
  circle:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  lineTrack: { position: 'absolute', top: 13, left: '25%', right: '25%', height: 2, backgroundColor: Colors.border, zIndex: -1 },
  lineFill:  { height: '100%', width: '100%', borderRadius: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router  = useRouter();
  const toast   = useToast();
  const [step,    setStep]    = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [agreed,  setAgreed]  = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver:      zodResolver(fullSchema),
    defaultValues: {
      fullName:        '',
      phone:           '',
      email:           '',
      password:        '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  async function goToStep2() {
    const valid = await trigger(['fullName', 'phone']);
    if (valid) setStep(2);
  }

// Update your onSubmit function in register.tsx

async function onSubmit(data: FormData) {
  if (!agreed) {
    toast.show('Please agree to the Terms of Service to continue.', 'error');
    return;
  }
  setLoading(true);
  
  try {
    const { error } = await signUpWithEmail(
      data.email,
      data.password,
      data.fullName,
      data.phone,
    );
    
    if (error) {
      const msg = error.message.toLowerCase().includes('already registered')
        ? 'This email is already registered. Try logging in instead.'
        : error.message;
      toast.show(msg, 'error');
      return;
    }

    // Success! Show a more prominent success message
    toast.show(
      '✓ Account created successfully! Please check your email to verify your account before logging in.',
      'success'
    );
    
    // Navigate to login after a short delay to ensure toast is visible
    setTimeout(() => {
      router.replace('/login');
    }, 2000);
    
  } catch (err) {
    console.error('Registration error:', err);
    toast.show('An unexpected error occurred. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => (step === 2 ? setStep(1) : router.back())}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={Colors.ink} />
          </TouchableOpacity>

          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.header}
          >
            <View style={styles.logoMark}>
              <MaterialCommunityIcons
                name="home-map-marker"
                size={28}
                color={Colors.white}
              />
            </View>
            <AppText
              variant="h1"
              weight="extrabold"
              center
              style={{ marginBottom: Spacing.xs }}
            >
              Create your account
            </AppText>
            <AppText variant="body" color={Colors.muted} center>
              Free to join · List for free · No hidden fees
            </AppText>
          </MotiView>

          {/* Step indicator */}
          <StepIndicator current={step} />

          {/* ── STEP 1: Personal info ── */}
          {step === 1 && (
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={styles.form}
            >
              <View style={styles.stepCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                  <AppText
                    variant="label"
                    weight="bold"
                    color={Colors.primary}
                    style={{ marginLeft: 6 }}
                  >
                    Tell us about yourself
                  </AppText>
                </View>

                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }: any) => (
                    <AppInput
                      label="Full name"
                      placeholder="e.g. Juan dela Cruz"
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="next"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errorText(errors.fullName?.message)}
                      required
                      iconLeft={
                        <Feather name="user" size={17} color={Colors.subtle} />
                      }
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }: any) => (
                    <AppInput
                      label="Mobile number"
                      placeholder="+63 912 345 6789"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      returnKeyType="done"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errorText(errors.phone?.message)}
                      hint="Used for booking alerts and account security"
                      iconLeft={
                        <Feather name="phone" size={17} color={Colors.subtle} />
                      }
                    />
                  )}
                />
              </View>

              {/* Benefits strip */}
              <View style={styles.benefitsRow}>
                {[
                  { icon: 'shield'      as const, text: 'Secure & private' },
                  { icon: 'dollar-sign' as const, text: 'Free to join'     },
                  { icon: 'star'        as const, text: 'Earn from day 1'  },
                ].map(b => (
                  <View key={b.icon} style={styles.benefitItem}>
                    <View style={styles.benefitIcon}>
                      <Feather name={b.icon} size={13} color={Colors.teal} />
                    </View>
                    <AppText variant="caption" weight="semibold" color={Colors.teal}>
                      {b.text}
                    </AppText>
                  </View>
                ))}
              </View>

              <AppButton label="Next  →  Set up account" onPress={goToStep2} />

              <View style={styles.loginRow}>
                <AppText variant="label" color={Colors.muted}>
                  Already have an account?{'  '}
                </AppText>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <AppText variant="label" weight="bold" color={Colors.primary}>
                    Log in
                  </AppText>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {/* ── STEP 2: Account credentials ── */}
          {step === 2 && (
            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={styles.form}
            >
              <View style={styles.stepCard}>
                <View style={styles.cardHeader}>
                  <Feather name="lock" size={18} color={Colors.primary} />
                  <AppText
                    variant="label"
                    weight="bold"
                    color={Colors.primary}
                    style={{ marginLeft: 6 }}
                  >
                    Create your login
                  </AppText>
                </View>

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }: any) => (
                    <AppInput
                      label="Email address"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errorText(errors.email?.message)}
                      required
                      hint="Booking confirmations will be sent here"
                      iconLeft={
                        <Feather name="mail" size={17} color={Colors.subtle} />
                      }
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }: any) => (
                    <View>
                      <AppInput
                        label="Create a password"
                        placeholder="At least 8 characters"
                        isPassword
                        autoComplete="password-new"
                        returnKeyType="next"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errorText(errors.password?.message)}
                        required
                        iconLeft={
                          <Feather name="lock" size={17} color={Colors.subtle} />
                        }
                      />
                      <PasswordStrength password={value} />
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }: any) => (
                    <AppInput
                      label="Confirm password"
                      placeholder="Re-enter your password"
                      isPassword
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errorText(errors.confirmPassword?.message)}
                      required
                      iconLeft={
                        <Feather name="check-circle" size={17} color={Colors.subtle} />
                      }
                    />
                  )}
                />
              </View>

              {/* Terms checkbox */}
              <Pressable
                onPress={() => setAgreed((v: boolean) => !v)}
                style={styles.termsRow}
              >
                <View style={[
                  styles.checkbox,
                  agreed && { backgroundColor: Colors.teal, borderColor: Colors.teal },
                ]}>
                  {agreed && (
                    <Feather name="check" size={13} color={Colors.white} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    variant="label"
                    color={Colors.muted}
                    style={{ lineHeight: 20 }}
                  >
                    I agree to the{' '}
                    <AppText variant="label" weight="bold" color={Colors.primary}>
                      Terms of Service
                    </AppText>
                    {' '}and{' '}
                    <AppText variant="label" weight="bold" color={Colors.primary}>
                      Privacy Policy
                    </AppText>
                    . I'm at least 18 years old.
                  </AppText>
                </View>
              </Pressable>

              <AppButton
                label="Create my free account"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={{ opacity: agreed ? 1 : 0.6 }}
              />

              {/* Security reassurance */}
              <View style={styles.securityNote}>
                <Feather name="shield" size={13} color={Colors.teal} />
                <AppText
                  variant="caption"
                  color={Colors.teal}
                  style={{ marginLeft: 6, flex: 1 }}
                >
                  Your info is encrypted and never sold to third parties.
                </AppText>
              </View>
            </MotiView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: {
    flexGrow:          1,
    paddingHorizontal: Spacing.xl,
    paddingBottom:     Spacing['5xl'],
  },

  backBtn: {
    marginTop:      Spacing.lg,
    width:          40,
    height:         40,
    borderRadius:   Radius.md,
    backgroundColor: Colors.bg,
    alignItems:     'center',
    justifyContent: 'center',
  },

  header: {
    alignItems:   'center',
    marginTop:    Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  logoMark: {
    width:           64,
    height:          64,
    borderRadius:    18,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.lg,
  },

  form: { gap: Spacing.lg },

  stepCard: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    gap:             Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  cardHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingBottom:     Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom:      Spacing.xs,
  },

  benefitsRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },
  benefitItem: { alignItems: 'center', gap: 4, flex: 1 },
  benefitIcon: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
  },

  termsRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    gap:            12,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width:          22,
    height:         22,
    borderRadius:   6,
    borderWidth:    2,
    borderColor:    Colors.border,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      1,
    flexShrink:     0,
  },

  securityNote: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
  },

  loginRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:      Spacing.sm,
  },
});
