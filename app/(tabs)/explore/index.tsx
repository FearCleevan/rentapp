import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Feather name="search" size={32} color={Colors.primary} />
        </View>
        <AppText variant="h2" weight="extrabold" center>
          Explore
        </AppText>
        <AppText
          variant="body"
          color={Colors.muted}
          center
          style={{ marginTop: Spacing.sm, maxWidth: 260 }}
        >
          Find parking, rooms, vehicles and more near you.
        </AppText>
        <AppText
          variant="caption"
          color={Colors.subtle}
          center
          style={{ marginTop: Spacing.lg }}
        >
          Full map + listings coming next!
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
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.lg,
  },
});