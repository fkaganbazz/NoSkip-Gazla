import { Tabs, type BottomTabNavigationOptions } from 'expo-router/js-tabs';
import type { ComponentType } from 'react';

import TabBar from '@/components/TabBar';
import { CompassIcon, FriendsIcon, HomeIcon, SproutIcon, type IconProps } from '@/components/icons';
import { tabBarMetrics, useTheme } from '@/theme';

const tabIcon =
  (Icon: ComponentType<IconProps>): BottomTabNavigationOptions['tabBarIcon'] =>
  ({ color, size }) => <Icon color={color} size={size} strokeWidth={tabBarMetrics.iconStrokeWidth} />;

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
        options={{ title: 'Bugün', tabBarIcon: tabIcon(HomeIcon) }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Keşfet', tabBarIcon: tabIcon(CompassIcon) }}
      />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Arkadaşlar', tabBarIcon: tabIcon(FriendsIcon) }}
      />
      <Tabs.Screen
        name="garden"
        options={{ title: 'Bahçem', tabBarIcon: tabIcon(SproutIcon) }}
      />
    </Tabs>
  );
}
