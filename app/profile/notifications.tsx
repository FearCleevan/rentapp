import { View, Switch, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { AppText } from '@/components/ui/AppText';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="h2" weight="extrabold">Notifications</AppText>

      <View style={styles.card}>
        <View style={styles.row}>
          <AppText>Email Notifications</AppText>
          <Switch />
        </View>

        <View style={styles.row}>
          <AppText>Push Notifications</AppText>
          <Switch />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, backgroundColor: Colors.bg },
  card: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
});