import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Toast, type ToastController } from '@/components/ui';
import { useIsOnline, usePendingCheckins } from '@/data';
import { useT } from '@/i18n';
import { layout, spacing, todayMetrics as m } from '@/theme';

type Props = {
  /** Kısa süreli tost (ör. sunucu işaretlemeyi reddetti) */
  toast: ToastController;
  /** Görünen tostların toplam yüksekliği (içerik altında o kadar boşluk bırakılır); yoksa 0 */
  onHeightChange?: (height: number) => void;
};

/**
 * Bugün'ün alt tostları: + butonunun üstünde (alt menüyle çakışmaz). Çevrimdışıyken koyu tost kalıcıdır
 * (Components.dc.html: "Çevrimdışısın. İşaretlemen kaydedildi, bağlanınca gönderilir."); kuyrukta bekleyen
 * işaretleme sayısını söyler.
 */
export default function TodayToasts({ toast, onHeightChange }: Props) {
  const online = useIsOnline();
  const pending = usePendingCheckins();
  const entry = toast.current;
  const t = useT();

  const offlineMessage = pending > 0 ? t.today.toasts.offlinePending(pending) : t.today.toasts.offline;

  return (
    <View
      style={styles.host}
      onLayout={(e) => onHeightChange?.(e.nativeEvent.layout.height)}>
      {entry && (
        <Animated.View key={entry.id} entering={FadeInDown} exiting={FadeOutDown}>
          <Toast message={entry.message} kind={entry.kind} />
        </Animated.View>
      )}
      {!online && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <Toast kind="offline" message={offlineMessage} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: m.toastBottom,
    gap: spacing.xs,
    pointerEvents: 'box-none',
  },
});
