import { Tabs } from 'expo-router';
import { MomaTabBar } from '@/components/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <MomaTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
