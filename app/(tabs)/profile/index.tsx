import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { signOut } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.avatar}>
          <Feather name="user" size={36} color={Colors.white} />
        </View>
        <AppText variant="h2" weight="extrabold" center>
          My Profile
        </AppText>
        <AppText
          variant="body"
          color={Colors.muted}
          center
          style={{ marginTop: Spacing.sm, maxWidth: 260 }}
        >
          Manage your account, verification, and settings here.
        </AppText>
        <AppText
          variant="caption"
          color={Colors.subtle}
          center
          style={{ marginTop: Spacing.lg }}
        >
          Full profile screen coming next!
        </AppText>

        <AppButton
          label="Sign out"
          onPress={handleSignOut}
          variant="ghost"
          style={{ marginTop: Spacing['3xl'], width: 200 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing.xl,
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.lg,
  },
});