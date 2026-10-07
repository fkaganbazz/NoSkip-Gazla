/**
 * Alt menü — kaynak: design/TabBar.dc.html. Expo Router `Tabs` için özel `tabBar`.
 * Beş eşit sütun: iki sekme, ortada + butonu (Create), iki sekme.
 * Sekme etiketleri `options.title`, ikonlar `options.tabBarIcon` ile (app/(tabs)/_layout.tsx).
 */
import { useRouter } from 'expo-router';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
} from 'expo-router/js-tabs';
import { useContext } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import { PlusIcon } from '@/components/icons';
import { borderWidth, tabBarColors, tabBarMetrics as m, typography, useTheme } from '@/theme';

/** Sekme satırının yüksekliği: 88 − üst kenar − üst boşluk − alt boşluk = 57 */
const ROW_HEIGHT = m.height - borderWidth.thin - m.paddingTop - m.paddingBottom;
/** + butonunun dış ölçüsü (RN ölçüsü kenarı içerir) */
const FAB_OUTER = m.fabSize + m.fabBorderWidth * 2;
/** + butonu ızgaradaki üçüncü sütun */
const FAB_COLUMN = 2;

/** `href: null` ile gizlenen rotalar (expo-router bunu tabBarItemStyle/tabBarButton'a çevirir) */
function isHidden(options: BottomTabNavigationOptions) {
  return StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none';
}

export default function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { scheme } = useTheme();
  const router = useRouter();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const colors = tabBarColors[scheme];

  // iOS'ta alt güvenli alan yalnızca ev göstergesi; tasarımın 24'lük alt boşluğu onu karşılıyor.
  // Android'de gezinme tuşları opak olabilir; alt boşluk sistem çubuğundan az olmasın.
  const paddingBottom =
    Platform.OS === 'android' ? Math.max(m.paddingBottom, insets.bottom) : m.paddingBottom;

  const tabs = state.routes.flatMap((route, index) => {
    const { options } = descriptors[route.key];
    if (isHidden(options)) {
      return [];
    }
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
        // iOS'ta 'tab' rolünün karşılığı yok; kütüphanenin kendi sekme öğesi gibi button.
        role={Platform.select({ ios: 'button', default: 'tab' })}
        aria-selected={focused}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        accessibilityLargeContentTitle={label}
        accessibilityShowsLargeContentViewer
        testID={options.tabBarButtonTestID}
        style={styles.tab}>
        <View style={[styles.pill, focused && { backgroundColor: colors.activePill }]}>
          {options.tabBarIcon?.({ focused, color, size: m.iconSize })}
        </View>
        {/* Menü yüksekliği sabit (88); etiket sistem yazı boyutuyla büyümez.
            iOS'ta uzun basınca büyük içerik görüntüleyici etiketi gösterir. */}
        <Text
          allowFontScaling={false}
          style={[focused ? typography.tabLabelActive : typography.tabLabel, { color }]}>
          {label}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}
      style={[
        styles.bar,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom },
      ]}>
      <View role="tablist" accessibilityLabel="Ana menü" style={styles.row}>
        {tabs.slice(0, FAB_COLUMN)}
        <View style={styles.fabColumn} />
        {tabs.slice(FAB_COLUMN)}
      </View>

      {/* + butonu sekme listesinin dışında (tablist yalnızca sekme içerir), ortadaki sütunun üstünde. */}
      <View style={styles.fabOverlay}>
        <View style={styles.fabFrame}>
          <FlatShadowUnderlay
            offset={m.fabShadowOffset}
            color={colors.fabShadow}
            size={FAB_OUTER}
            radius={FAB_OUTER / 2}
          />
          <Pressable
            onPress={() => router.navigate('/create')}
            accessibilityRole="button"
            accessibilityLabel="Yeni challenge oluştur"
            style={[
              styles.fab,
              { backgroundColor: colors.fab, borderColor: colors.background },
              // Tasarım: box-shadow 0 4px 0 (düz alt gölge)
              flatShadowStyle(m.fabShadowOffset, colors.fabShadow),
            ]}>
            <PlusIcon
              color={colors.fabIcon}
              size={m.fabIconSize}
              strokeWidth={m.fabIconStrokeWidth}
            />
          </Pressable>
        </View>
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
  },
  // Satırla aynı kutu; menü simetrik olduğundan satırın ortası ortadaki sütunun ortası.
  fabOverlay: {
    position: 'absolute',
    top: m.paddingTop,
    left: m.paddingHorizontal,
    right: m.paddingHorizontal,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  // Tasarımdaki gibi: margin kutusu (64 − 30) satırda ortalanır, buton 30 yukarı taşar.
  fabFrame: {
    width: FAB_OUTER,
    height: FAB_OUTER,
    marginTop: -m.fabLift,
  },
  fab: {
    width: FAB_OUTER,
    height: FAB_OUTER,
    borderRadius: FAB_OUTER / 2,
    borderWidth: m.fabBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
