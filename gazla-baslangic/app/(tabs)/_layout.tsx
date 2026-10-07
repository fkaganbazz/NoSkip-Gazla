import { Tabs } from 'expo-router/js-tabs';

import TabBar from '@/components/TabBar';
import { CompassIcon, FriendsIcon, HomeIcon, SproutIcon } from '@/components/icons';
import { tabBarMetrics, useTheme } from '@/theme';

// Sekmeler: Bugün, Keşfet, (ortada + → /create), Arkadaşlar, Bahçem. Görünüm: design/TabBar.dc.html.
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ color }) => (
            <HomeIcon color={color} size={tabBarMetrics.iconSize} strokeWidth={tabBarMetrics.iconStrokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color }) => (
            <CompassIcon color={color} size={tabBarMetrics.iconSize} strokeWidth={tabBarMetrics.iconStrokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Arkadaşlar',
          tabBarIcon: ({ color }) => (
            <FriendsIcon color={color} size={tabBarMetrics.iconSize} strokeWidth={tabBarMetrics.iconStrokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Bahçem',
          tabBarIcon: ({ color }) => (
            <SproutIcon color={color} size={tabBarMetrics.iconSize} strokeWidth={tabBarMetrics.iconStrokeWidth} />
          ),
        }}
      />
    </Tabs>
  );
}
