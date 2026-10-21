/**
 * Ekran tostları: `useToast()` görünme süresini tutar, `<ToastHost />` tostu ekranın altına, güvenli alanın
 * üstüne çizer. Her ekran kendi zamanlayıcısını yazmaz.
 *
 *   const toast = useToast();
 *   toast.show({ message: 'Davet linki kopyalandı', kind: 'success' });
 *   toast.show({ message: "Ece'ye laf sokuldu", action: { label: 'Geri al', onPress: undo } });
 *   …
 *   <ToastHost toast={toast} />   // ekranın kök görünümünün (flex: 1) son çocuğu
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { componentMetrics as cm, layout } from '@/theme';

import { Toast, type ToastAction, type ToastKind } from './form';

export type ToastOptions = {
  message: string;
  /** Verilmezse: `action` varsa success, yoksa info */
  kind?: ToastKind;
  /** Sağdaki buton ("Geri al"); basılınca tost da kapanır */
  action?: ToastAction;
  /** Görünme süresi (ms). Varsayılan 2.6 sn, butonluysa 5 sn; `null` = `hide()` çağrılana kadar */
  durationMs?: number | null;
};

type ToastEntry = ToastOptions & { id: number; kind: ToastKind };

export type ToastController = {
  /** Görünen tost (yoksa null) */
  current: ToastEntry | null;
  /** Yeni tost gösterir; görünen varsa onun yerine geçer ve süre baştan başlar */
  show: (options: ToastOptions) => void;
  hide: () => void;
};

export function useToast(): ToastController {
  const [current, setCurrent] = useState<ToastEntry | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setCurrent(null);
  }, [clearTimer]);

  const show = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      const kind = options.kind ?? (options.action ? 'success' : 'info');
      const duration =
        options.durationMs !== undefined
          ? options.durationMs
          : options.action
            ? cm.toastActionDurationMs
            : cm.toastDurationMs;
      seq.current += 1;
      setCurrent({ ...options, kind, id: seq.current });
      // Android'de tostun canlı bölgesi (accessibilityLiveRegion) okur; iOS'ta ayrıca duyurulur
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(options.message);
      if (duration !== null) {
        timer.current = setTimeout(() => {
          timer.current = null;
          setCurrent(null);
        }, duration);
      }
    },
    [clearTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return useMemo(() => ({ current, show, hide }), [current, show, hide]);
}

type ToastHostProps = {
  toast: ToastController;
  /** Altta sabit duran öğelerin (ör. ekran alt butonları) üstüne çıkmak için ek boşluk */
  offset?: number;
};

/** Tostu ekranın altına, kenarlardan 20 içeride çizer (güvenli alan en az 20) */
export function ToastHost({ toast, offset = 0 }: ToastHostProps) {
  const insets = useSafeAreaInsets();
  const entry = toast.current;
  const { hide } = toast;

  return (
    <View style={[styles.host, { bottom: Math.max(insets.bottom, layout.screenPadding) + offset }]}>
      {entry && (
        <Animated.View key={entry.id} entering={FadeInDown} exiting={FadeOutDown}>
          <Toast
            message={entry.message}
            kind={entry.kind}
            action={
              entry.action && {
                label: entry.action.label,
                onPress: () => {
                  hide();
                  entry.action?.onPress();
                },
              }
            }
          />
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
    pointerEvents: 'box-none',
  },
});
