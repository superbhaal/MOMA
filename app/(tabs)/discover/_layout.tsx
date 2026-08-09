import { Stack } from 'expo-router';

export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Learn · Watch · Explore read as three chips of one screen, so Explore
          must arrive the way Watch does — instantly. It stays its own route
          (the map keeps its own lifecycle), but with no push animation either
          way. The swipe-back would be the same slide by another name, and it
          fights the map's own panning, so it's off here too — the chips are
          how you leave. The deeper routes (article, place, contributor) keep
          their slide: those are genuinely somewhere else. */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="explore" options={{ animation: 'none', gestureEnabled: false }} />
      <Stack.Screen name="place/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="place/[id]" />
      <Stack.Screen name="contributor/[id]" />
      <Stack.Screen name="[docId]" />
    </Stack>
  );
}
