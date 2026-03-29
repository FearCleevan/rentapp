import { Stack } from 'expo-router';

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="verify-id" options={{ title: 'Verify ID' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change Password' }} />
      <Stack.Screen name="help" options={{ title: 'Help & FAQ' }} />
      <Stack.Screen name="support" options={{ title: 'Support' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />

      <Stack.Screen name="host/listings" options={{ title: 'My Listings' }} />
      <Stack.Screen name="host/payouts" options={{ title: 'Payout Settings' }} />
      <Stack.Screen name="host/earnings" options={{ title: 'Earnings' }} />
    </Stack>
  );
}