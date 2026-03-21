import { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { AppText }   from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput }  from '@/components/ui/AppInput';
import { useToast }  from '@/components/ui/Toast';
import { signInWithEmail, supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const toast  = useToast();
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const { control, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    
    try {
      // First, check if the user exists and is verified
      const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (userError) {
        // Check if the error is due to unverified email
        if (userError.message.toLowerCase().includes('email not confirmed') ||
            userError.message.toLowerCase().includes('verify')) {
          toast.show(
            'Please verify your email address before logging in. Check your inbox for the confirmation link.',
            'error'
          );
          
          // Show resend verification option
          Alert.alert(
            'Email Not Verified',
            'Please check your email inbox for the verification link. Would you like us to resend the verification email?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Resend Email', 
                onPress: () => resendVerificationEmail(data.email),
                style: 'default'
              },
            ]
          );
          return;
        }
        
        // Other authentication errors
        const msg = userError.message.includes('Invalid login credentials')
          ? 'Wrong email or password. Please try again.'
          : userError.message;
        toast.show(msg, 'error');
        return;
      }
      
      // Check if the user's email is confirmed
      if (userData.user && !userData.user.email_confirmed_at) {
        toast.show(
          'Please verify your email address before logging in. Check your inbox for the confirmation link.',
          'error',
        );
        
        // Sign out immediately since they can't login without verification
        await supabase.auth.signOut();
        
        Alert.alert(
          'Email Verification Required',
          `We've sent a verification link to ${data.email}. Please check your inbox and verify your email before logging in.`,
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Resend Email', 
              onPress: () => resendVerificationEmail(data.email),
              style: 'default'
            },
          ]
        );
        return;
      }
      
      // Successfully logged in with verified email
      toast.show('Welcome back!', 'success');
      // Auth guard in _layout.tsx handles redirect automatically
      
    } catch (err) {
      console.error('Login error:', err);
      toast.show('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }
  
  // Function to resend verification email
  async function resendVerificationEmail(email: string) {
    if (!email) {
      toast.show('Please enter your email address first.', 'error');
      return;
    }
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'rentapp://login',
        },
      });
      
      if (error) {
        toast.show('Failed to resend verification email. Please try again.', 'error');
        return;
      }
      
      toast.show(
        `Verification email resent to ${email}. Please check your inbox.`,
        'success',
      );
    } catch (err) {
      console.error('Resend error:', err);
      toast.show('An error occurred. Please try again.', 'error');
    } finally {
      setResendingEmail(false);
    }
  }

  function handleGoogleLogin() {
    toast.show('Google sign-in coming soon!', 'info');
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
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={Colors.ink} />
          </TouchableOpacity>

          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 50 }}
            style={styles.header}
          >
            {/* App logo mark */}
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="home-map-marker" size={28} color={Colors.white} />
            </View>

            <AppText variant="h1" weight="extrabold" style={styles.title}>
              Welcome back
            </AppText>
            <AppText variant="bodyLg" color={Colors.muted} center style={styles.subtitle}>
              Log in to your account to continue renting or earning
            </AppText>
          </MotiView>

          {/* Google button */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 100 }}
          >
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.82}>
              <Feather name="globe" size={18} color={Colors.ink} />
              <AppText variant="body" weight="semibold" color={Colors.ink} style={{ marginLeft: 10 }}>
                Continue with Google
              </AppText>
            </TouchableOpacity>
          </MotiView>

          {/* Divider */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 150 }}
            style={styles.dividerRow}
          >
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={Colors.subtle} style={{ marginHorizontal: 12 }}>
              or log in with email
            </AppText>
            <View style={styles.dividerLine} />
          </MotiView>

          {/* Form */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, delay: 180 }}
            style={styles.form}
          >
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
                  error={errors.email?.message}
                  iconLeft={<Feather name="mail" size={17} color={Colors.subtle} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }: any) => (
                <AppInput
                  label="Password"
                  placeholder="Enter your password"
                  isPassword
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  iconLeft={<Feather name="lock" size={17} color={Colors.subtle} />}
                />
              )}
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => router.push('/forgot')}
              style={styles.forgotBtn}
            >
              <AppText variant="label" weight="semibold" color={Colors.primary}>
                Forgot password?
              </AppText>
            </TouchableOpacity>

            <AppButton
              label="Log in"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={{ marginTop: Spacing.sm }}
            />
          </MotiView>

          {/* Trust signals */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 300 }}
            style={styles.trustRow}
          >
            <View style={styles.trustItem}>
              <Feather name="shield" size={13} color={Colors.teal} />
              <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 4 }}>Secure login</AppText>
            </View>
            <View style={styles.trustItem}>
              <Feather name="lock" size={13} color={Colors.teal} />
              <AppText variant="caption" color={Colors.teal} style={{ marginLeft: 4 }}>Your data is safe</AppText>
            </View>
          </MotiView>

          {/* Sign up link */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 350 }}
            style={styles.signupRow}
          >
            <AppText variant="label" color={Colors.muted}>Don't have an account?{'  '}</AppText>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <AppText variant="label" weight="bold" color={Colors.primary}>Sign up free</AppText>
            </TouchableOpacity>
          </MotiView>

          {/* Fine print */}
          <AppText variant="caption" center color={Colors.subtle} style={styles.legal}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </AppText>
          
          {/* Resend loading indicator */}
          {resendingEmail && (
            <View style={styles.resendIndicator}>
              <AppText variant="caption" color={Colors.teal}>
                Sending verification email...
              </AppText>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.white },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  backBtn: {
    marginTop: Spacing.lg,
    width:     40,
    height:    40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems:  'center',
    justifyContent: 'center',
  },
  header: {
    alignItems:    'center',
    marginTop:     Spacing['2xl'],
    marginBottom:  Spacing['3xl'],
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
  title:    { textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { maxWidth: 280 },

  googleBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    height:          52,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.white,
    marginBottom:    Spacing.xl,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  Spacing.xl,
  },
  dividerLine: {
    flex:            1,
    height:          1,
    backgroundColor: Colors.border,
  },
  form: { gap: Spacing.md },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  trustRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            Spacing['2xl'],
    marginTop:      Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.tealLight,
    borderRadius:    Radius.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  signupRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:      Spacing.xl,
  },
  legal: {
    marginTop:        Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  resendIndicator: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
});