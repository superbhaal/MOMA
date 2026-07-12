import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="onboarding/q1" />
      <Stack.Screen name="onboarding/q2" />
      <Stack.Screen name="onboarding/q3" />
      <Stack.Screen name="onboarding/q4" />
      <Stack.Screen name="onboarding/final" />
      <Stack.Screen name="onboarding/resume" />
    </Stack>
  );
}
