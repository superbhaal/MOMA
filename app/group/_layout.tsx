import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[groupId]/index" />
      <Stack.Screen name="[groupId]/chat" />
      <Stack.Screen name="dm/[userId]" />
    </Stack>
  );
}
