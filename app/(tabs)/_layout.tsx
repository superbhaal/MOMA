import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.cobalt,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodySemi,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Groups',
          tabBarLabel: 'GROUPS',
        }}
      />
      <Tabs.Screen
        name="reccos"
        options={{
          title: 'Reccos',
          tabBarLabel: 'RECCOS',
        }}
      />
      <Tabs.Screen
        name="science"
        options={{
          title: 'Science',
          tabBarLabel: 'SCIENCE',
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarLabel: 'ME',
        }}
      />
    </Tabs>
  );
}
