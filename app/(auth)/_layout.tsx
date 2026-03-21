import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:  false,
        animation:    'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="login"      options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="register"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="forgot"     options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}