/**
 * Alt menü — kaynak: design/TabBar.dc.html. Expo Router `Tabs` için özel `tabBar`.
 * Beş eşit sütun: iki sekme, ortada + butonu (Create), iki sekme.
 * Sekme etiketleri `options.title`, ikonlar `options.tabBarIcon` ile (app/(tabs)/_layout.tsx).
 */
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PlusIcon } from '@/components/icons';
import { borderWidth, tabBarColors, tabBarMetrics as m, typography, useTheme } from '@/theme';

/** Sekme satırının yüksekliği: 88 − üst kenar − üst boşluk − alt boşluk = 57 */
const ROW_HEIGHT = m.height - borderWidth.thin - m.paddingTop - m.paddingBottom;
/** + butonunun dış ölçüsü (RN ölçüsü kenarı içerir) */
const FAB_OUTER = m.fabSize + m.fabBorderWidth * 2;
/** + butonu ızgaradaki üçüncü sütun */
const FAB_COLUMN = 2;

export default function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { scheme } = useTheme();
  const router = useRouter();
  const colors = tabBarColors[scheme];

  // iOS'ta alt güvenli alan yalnızca ev göstergesi; tasarımın 24'lük alt boşluğu onu karşılıyor.
  // Android'de gezinme tuşları opak olabilir; alt boşluk sistem çubuğundan az olmasın.
  const paddingBottom =
    Platform.OS === 'android' ? Math.max(m.paddingBottom, insets.bottom) : m.paddingBottom;

  const tabs = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const color = focused ? colors.active : colors.inactive;
    const label = options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };
    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        testID={options.tabBarButtonTestID}
        style={styles.tab}>
        <View style={[styles.pill, focused && { backgroundColor: colors.activePill }]}>
          {options.tabBarIcon?.({ focused, color, size: m.iconSize })}
        </View>
        <Text
          numberOfLines={1}
          style={[focused ? typography.tabLabelActive : typography.tabLabel, { color }]}>
          {label}
        </Text>
      </Pressable>
    );
  });

  const fab = (
    <View key="create" style={styles.fabColumn}>
      <Pressable
        onPress={() => router.push('/create')}
        accessibilityRole="button"
        accessibilityLabel="Yeni challenge oluştur"
        style={[
          styles.fab,
          {
            backgroundColor: colors.fab,
            borderColor: colors.background,
            boxShadow: `0 ${m.fabShadowOffset}px 0 ${colors.fabShadow}`,
          },
        ]}>
        <PlusIcon color={colors.fabIcon} size={m.fabIconSize} strokeWidth={m.fabIconStrokeWidth} />
      </Pressable>
    </View>
  );

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Ana menü"
      style={[
        styles.bar,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom },
      ]}>
      <View style={styles.row}>
        {tabs.slice(0, FAB_COLUMN)}
        {fab}
        {tabs.slice(FAB_COLUMN)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: borderWidth.thin,
    paddingTop: m.paddingTop,
    paddingHorizontal: m.paddingHorizontal,
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    minHeight: m.itemMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.itemGap,
  },
  pill: {
    width: m.pillWidth,
    height: m.pillHeight,
    borderRadius: m.pillHeight / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabColumn: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: FAB_OUTER,
    height: FAB_OUTER,
    marginTop: -m.fabLift,
    borderRadius: FAB_OUTER / 2,
    borderWidth: m.fabBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
