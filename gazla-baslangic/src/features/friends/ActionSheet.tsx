import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { borderWidth, componentTypography, typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

export type SheetItem = {
  key: string;
  label: string;
  icon: (color: string) => ReactNode;
  danger?: boolean;
  onPress: () => void;
};

/** Menü yerine gösterilen onay: başlık, açıklama, kırmızı onay butonu */
export type SheetConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  error?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Menünün üstündeki gri satır: "Ece · @ece.y" */
  header: string;
  items: SheetItem[];
  confirm?: SheetConfirm | null;
};

// Kişi işlemleri menüsü: karartılmış zemin üstünde alttan kart + Vazgeç (FriendProfile.dc.html).
// Arkadaşlıktan çıkar / Engelle seçilince aynı kart onay sorusuna döner.
export default function ActionSheet({ visible, onClose, header, items, confirm }: Props) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]}
        onPress={onClose}
        accessibilityLabel="Kapat"
      />
      <View style={[styles.sheet, { bottom: m.menuBottom + insets.bottom }]}>
        <View accessibilityRole="menu" style={[styles.menu, { backgroundColor: colors.surface }]}>
          {confirm ? (
            <View style={styles.confirm}>
              <Text accessibilityRole="header" style={[typography.cardTitle, styles.center, { color: colors.text }]}>
                {confirm.title}
              </Text>
              <Text style={[typography.body, styles.center, { color: colors.textBody }]}>{confirm.message}</Text>
              {!!confirm.error && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[componentTypography.inputError, styles.center, { color: colors.danger }]}>
                  {confirm.error}
                </Text>
              )}
              <Button
                title={confirm.confirmLabel}
                variant="danger"
                loading={confirm.loading}
                onPress={confirm.onConfirm}
              />
            </View>
          ) : (
            <>
              <Text
                style={[
                  typography.meta,
                  styles.header,
                  { color: colors.textSecondary, borderBottomColor: c.rowDivider },
                ]}>
                {header}
              </Text>
              {items.map((item, i) => {
                const color = item.danger ? colors.danger : colors.text;
                return (
                  <Pressable
                    key={item.key}
                    onPress={item.onPress}
                    accessibilityRole="menuitem"
                    style={({ pressed }) => [
                      styles.item,
                      i < items.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
                      pressed && { backgroundColor: colors.surfaceMuted },
                    ]}>
                    {item.icon(color)}
                    <Text style={[socialTypography.menuItem, { color }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.cancel, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}>
          <Text style={[componentTypography.button, { color: colors.text }]}>Vazgeç</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: m.menuInsetX,
    right: m.menuInsetX,
    gap: m.menuGap,
  },
  menu: {
    borderRadius: m.menuRadius,
    overflow: 'hidden',
  },
  header: {
    paddingTop: m.menuHeaderPaddingTop,
    paddingHorizontal: m.menuHeaderPaddingX,
    paddingBottom: m.menuHeaderPaddingBottom,
    textAlign: 'center',
    borderBottomWidth: borderWidth.thin,
  },
  item: {
    height: m.menuItemHeight,
    paddingHorizontal: m.menuItemPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.menuItemGap,
  },
  confirm: {
    padding: m.menuItemPaddingX,
    gap: m.menuGap,
  },
  center: {
    textAlign: 'center',
  },
  cancel: {
    height: m.menuCancelHeight,
    borderRadius: m.menuCancelRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
