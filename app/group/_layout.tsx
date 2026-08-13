import { Stack } from 'expo-router';

export default function GroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[groupId]/index" />
      <Stack.Screen name="[groupId]/chat" />
      {/* The gate between accepting a preview and being in the group: the join
          is written on this screen's Done, so an undeclared route here doesn't
          just skip a step — it makes joining impossible. Second time in two
          days a new file under an enumerating layout went undeclared. */}
      <Stack.Screen name="[groupId]/busy" />
      <Stack.Screen name="dm/[userId]" />
    </Stack>
  );
}
