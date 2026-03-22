//app/(auth)/forgot.tsx
import { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppText }   from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput }  from '@/components/ui/AppInput';
import { useToast }  from '@/components/ui/Toast';
import { resetPassword } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

function EmailSentIllustration() {
  return (
    <Svg width={120} height={100} viewBox="0 0 120 100">
      <Rect x="10" y="25" width="100" height="65" rx="10" fill={Colors.primaryLight} />
      <Path d="M10 35 L60 62 L110 35" stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M10 90 L42 62 M110 90 L78 62" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <Circle cx="88" cy="22" r="18" fill={Colors.teal} />
      <Path d="M80 22 l5 5 10-10" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export default function ForgotPasswordScreen() {
  const router   = useRouter();
  const toast    = useToast();
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const { error } = await resetPassword(data.email);
    setLoading(false);

    if (error) {
      toast.show(error.message, 'error');
      return;
    }
    setSentEmail(data.email);
    setSent(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Close */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={20} color={Colors.muted} />
          </TouchableOpacity>

          {!sent ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              style={styles.content}
            >
              <View style={styles.iconWrap}>
                <Feather name="lock" size={26} color={Colors.primary} />
              </View>

              <AppText variant="h2" weight="extrabold" center style={{ marginBottom: Spacing.sm }}>
                Forgot your password?
              </AppText>
              <AppText variant="body" color={Colors.muted} center style={{ marginBottom: Spacing['3xl'], lineHeight: 22 }}>
                No worries! Just enter the email you signed up with and we'll send you a link to reset it.
              </AppText>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }: { field: { onChange: (value: string) => void; onBlur: () => void; value: string } }) => (
                  <AppInput
                    label="Your email address"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    iconLeft={<Feather name="mail" size={17} color={Colors.subtle} />}
                  />
                )}
              />

              <AppButton
                label="Send reset link"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                style={{ marginTop: Spacing.lg }}
              />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backLink}
              >
                <Feather name="arrow-left" size={15} color={Colors.muted} />
                <AppText variant="label" weight="semibold" color={Colors.muted} style={{ marginLeft: 6 }}>
                  Back to login
                </AppText>
              </TouchableOpacity>
            </MotiView>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 18 }}
              style={styles.content}
            >
              <View style={styles.sentIllustration}>
                <EmailSentIllustration />
              </View>

              <AppText variant="h2" weight="extrabold" center style={{ marginBottom: Spacing.sm }}>
                Check your email!
              </AppText>
              <AppText variant="body" color={Colors.muted} center style={{ marginBottom: Spacing.sm, lineHeight: 22 }}>
                We sent a password reset link to
              </AppText>
              <AppText variant="body" weight="bold" center color={Colors.primary} style={{ marginBottom: Spacing['2xl'] }}>
                {sentEmail}
              </AppText>

              <View style={styles.tipsCard}>
                <AppText variant="label" weight="bold" color={Colors.ink} style={{ marginBottom: Spacing.sm }}>
                  Didn't receive it?
                </AppText>
                {[
                  'Check your spam or junk folder',
                  'Make sure you typed the right email',
                  'It may take up to 5 minutes',
                ].map(tip => (
                  <View key={tip} style={styles.tipRow}>
                    <Feather name="info" size={12} color={Colors.subtle} />
                    <AppText variant="caption" color={Colors.muted} style={{ marginLeft: 6, flex: 1 }}>
                      {tip}
                    </AppText>
                  </View>
                ))}
              </View>

              <AppButton
                label="Back to login"
                onPress={() => router.replace('/(auth)/login')}
                style={{ marginTop: Spacing.lg }}
              />

              <TouchableOpacity
                onPress={() => setSent(false)}
                style={styles.backLink}
              >
                <AppText variant="label" weight="semibold" color={Colors.muted}>
                  Try a different email
                </AppText>
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.white },
  container: {
    flex:              1,
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.sm,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.border,
    alignSelf:       'center',
    marginBottom:    Spacing.md,
  },
  closeBtn: {
    alignSelf:    'flex-end',
    width:        36,
    height:       36,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  content: {
    flex:           1,
    alignItems:     'center',
    paddingTop:     Spacing.lg,
  },
  iconWrap: {
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing['2xl'],
  },
  sentIllustration: {
    marginBottom: Spacing['2xl'],
  },
  tipsCard: {
    width:           '100%',
    backgroundColor: Colors.bg,
    borderRadius:    Radius.md,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  backLink: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      Spacing.xl,
    padding:        Spacing.sm,
  },
});