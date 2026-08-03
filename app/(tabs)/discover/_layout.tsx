import { Stack } from 'expo-router';

export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="place/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="place/[id]" />
      <Stack.Screen name="contributor/[id]" />
      <Stack.Screen name="[docId]" />
    </Stack>
  );
}
