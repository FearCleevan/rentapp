import { View, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

export default function ListingsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <AppText variant="h2" weight="extrabold">
          My Listings
        </AppText>

        <View style={styles.card}>
          <AppText variant="label" weight="bold">
            You have no listings yet
          </AppText>

          <AppText style={styles.text}>
            Start earning by adding your first listing.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  text: {
    marginTop: Spacing.sm,
    color: Colors.muted,
  },
});