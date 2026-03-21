import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing } from '@/constants/theme';

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: '#FFF0F6' }]}>
          <Feather name="heart" size={32} color="#D4537E" />
        </View>
        <AppText variant="h2" weight="extrabold" center>
          Saved
        </AppText>
        <AppText
          variant="body"
          color={Colors.muted}
          center
          style={{ marginTop: Spacing.sm, maxWidth: 260 }}
        >
          Listings you've saved will show up here so you can book them later.
        </AppText>
        <AppText
          variant="caption"
          color={Colors.subtle}
          center
          style={{ marginTop: Spacing.lg }}
        >
          Wishlist feature coming next!
        </AppText>
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
  iconWrap: {
    width:        72,
    height:       72,
    borderRadius: 20,
    alignItems:   'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
});