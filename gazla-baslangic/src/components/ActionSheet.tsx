/**
 * İşlem sayfası — FriendProfile.png (FriendProfile.dc.html): karartma üstünde, kenarlardan 12 ve alttan 26 içeride
 * yüzen aksiyon kartı (köşe 24; isteğe bağlı gri başlık satırı, 56'lık ikonlu satırlar, tehlikeli olanlar kırmızı)
 * ve ayrı kartta "Vazgeç" (köşe 20). `Sheet` (`floating`) üstünde: alttan kayar, aşağı kaydırınca kapanır.
 *
 * `confirm` verilen satır aynı kartta onay adımına geçer (web'de Alert çalışmıyor); onay butonu `onPress`'i
 * çağırır, sayfa açık kalır (işlem bitince ekran kapatır). Onaysız satırda önce sayfa kapanır, sonra `onPress`
 * çalışır (ör. başka bir route açmak).
 */
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconProps } from '@/components/icons';
import Sheet, { type SheetHandle } from '@/components/Sheet';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { borderWidth, componentTypography, typography, useTheme } from '@/theme';
import { actionSheetMetrics as m, actionSheetTypography as at, sheetColors } from '@/theme/sheet';

export type ActionSheetConfirm = {
  /** Onay sorusu ("Ece engellensin mi?") */
  title: string;
  message?: string;
  /** Kırmızı onay butonu */
  confirmLabel: string;
  /** İşlem sürüyor: onay butonu yükleniyor */
  loading?: boolean;
  /** İşlem hatası (ApiError.message) */
  error?: string | null;
};

export type ActionSheetItem = {
  key: string;
  label: string;
  /** Çizgi ikon (`@/components/icons` imzası); satır rengini alır */
  icon?: ComponentType<IconProps>;
  /** Kırmızı satır (engelle, şikayet, ayrıl) */
  danger?: boolean;
  /** Verilirse önce onay adımı; `onPress` onayda çağrılır */
  confirm?: ActionSheetConfirm;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  /** Sayfa kapanınca (Vazgeç, karartma, kaydırma ya da onaysız bir satır) */
  onClose: () => void;
  /** Kartın üstündeki gri satır ("Ece · @ece.y") */
  title?: string;
  items: ActionSheetItem[];
  /** Ekran okuyucu için menünün adı ("Ece için işlemler") */
  accessibilityLabel?: string;
  /** Alttaki kart · varsayılan "Vazgeç" (`common.cancel`) */
  cancelLabel?: string;
};

export default function ActionSheet({
  visible,
  onClose,
  title,
  items,
  accessibilityLabel,
  cancelLabel,
}: Props) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const divider = sheetColors[scheme].actionDivider;
  const sheet = useRef<SheetHandle>(null);
  // Onaysız satırın işi: sayfa kapandıktan sonra çalışır
  const after = useRef<(() => void) | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  // Her açılış menüyle başlar
  useEffect(() => {
    if (visible) setConfirmKey(null);
  }, [visible]);

  const confirmItem = items.find((i) => i.key === confirmKey && i.confirm);
  const confirm = confirmItem?.confirm;

  const closed = () => {
    setConfirmKey(null);
    onClose();
    const run = after.current;
    after.current = null;
    run?.();
  };

  const press = (item: ActionSheetItem) => {
    if (item.confirm) {
      setConfirmKey(item.key);
      return;
    }
    after.current = item.onPress;
    sheet.current?.close();
  };

  return (
    <Sheet
      ref={sheet}
      visible={visible}
      onClose={closed}
      floating
      accessibilityLabel={accessibilityLabel ?? title}
      contentStyle={styles.stack}>
      <View
        accessibilityRole={confirm ? undefined : 'menu'}
        accessibilityLabel={confirm ? undefined : (accessibilityLabel ?? title)}
        style={[styles.card, { backgroundColor: colors.surface }]}>
        {confirmItem && confirm ? (
          <View style={styles.confirm}>
            <Text accessibilityRole="header" style={[typography.cardTitle, styles.center, { color: colors.text }]}>
              {confirm.title}
            </Text>
            {!!confirm.message && (
              <Text style={[typography.body, styles.center, { color: colors.textBody }]}>{confirm.message}</Text>
            )}
            {!!confirm.error && (
              <Text
                accessibilityLiveRegion="polite"
                style={[componentTypography.inputError, styles.center, { color: colors.dangerText }]}>
                {confirm.error}
              </Text>
            )}
            <Button
              title={confirm.confirmLabel}
              variant="danger"
              loading={confirm.loading}
              onPress={confirmItem.onPress}
            />
          </View>
        ) : (
          <>
            {!!title && (
              <Text
                style={[
                  at.header,
                  styles.header,
                  { color: colors.textSecondary, borderBottomColor: divider },
                ]}>
                {title}
              </Text>
            )}
            {items.map((item, i) => {
              // Kırmızı satır metni: koyuda okunur ton (colors.dangerText)
              const color = item.danger ? colors.dangerText : colors.text;
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => press(item)}
                  accessibilityRole="menuitem"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.item,
                    i < items.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: divider },
                    pressed && { backgroundColor: colors.surfaceMuted },
                  ]}>
                  {Icon && <Icon color={color} size={m.iconSize} strokeWidth={m.iconStrokeWidth} />}
                  <Text style={[at.item, { color }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </View>

      <Pressable
        onPress={() => sheet.current?.close()}
        accessibilityRole="button"
        style={({ pressed }) => [styles.cancel, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}>
        <Text style={[at.cancel, { color: colors.text }]}>{cancelLabel ?? t.common.cancel}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: m.gap,
  },
  card: {
    borderRadius: m.radius,
    overflow: 'hidden',
  },
  header: {
    paddingTop: m.headerPaddingTop,
    paddingHorizontal: m.headerPaddingX,
    paddingBottom: m.headerPaddingBottom,
    textAlign: 'center',
    borderBottomWidth: borderWidth.thin,
  },
  item: {
    height: m.itemHeight,
    paddingHorizontal: m.itemPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.itemGap,
  },
  confirm: {
    padding: m.confirmPadding,
    gap: m.gap,
  },
  center: {
    textAlign: 'center',
  },
  cancel: {
    height: m.cancelHeight,
    borderRadius: m.cancelRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
