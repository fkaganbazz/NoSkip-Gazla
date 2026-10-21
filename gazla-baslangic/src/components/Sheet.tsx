/**
 * Alt sayfa — Poke.png, NumberEntry.png (Poke.dc.html, NumberEntry.dc.html): karartma rgba(36, 22, 63, .55),
 * üst köşeler 28, 44×5 tutamaç, iç boşluk 10 20 30. @gorhom/bottom-sheet; yükseklik içeriğe göre (dynamic sizing),
 * aşağı kaydırınca ya da karartmaya dokununca kapanır, kapanma animasyonu bitince `onClose`.
 *
 * İki kullanım:
 * - Route alt sayfası (Poke, NumberEntry): `visible` verilmez, sayfa açık doğar. Route `transparentModal`
 *   sunulur (app/_layout.tsx); `onClose` → `router.back()`.
 * - Ekran içi (seçenek listesi, profil düzenleme, yıl seçici): `visible` + `onClose`. RN `Modal` içinde çizilir;
 *   böylece sayfa içeriği ekranın bağlamlarını (veri, gezinme) görür ve native modalların üstünde kalır.
 *
 * İçerikten animasyonlu kapatmak için `ref` → `close()` (ör. sayfadaki kapat butonu, gönderince kapan).
 * `top`: sayfanın hemen üstünde, sayfayla birlikte hareket eden alan (Poke/NumberEntry'de Diken + balon);
 * karartmanın üstünde, sayfanın altında çizilir, dokunmaları karartmaya geçirir.
 */
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheet,
  useBottomSheetInternal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import {
  findNodeHandle,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { componentColors, componentMetrics as cm, spacing, typography, useTheme } from '@/theme';
import { actionSheetMetrics as am, sheetMetrics as m } from '@/theme/sheet';

export type SheetHandle = {
  /** Sayfayı animasyonla kapatır; bitince `onClose` çağrılır */
  close: () => void;
};

export type SheetProps = {
  /** Ekran içi kullanım: görünürlük. Route alt sayfasında verilmez (sayfa açık doğar). */
  visible?: boolean;
  /** Sayfa kapandıktan sonra (kaydırma, karartma, `close()`); route'ta `router.back()` */
  onClose: () => void;
  /** İsteğe bağlı başlık (Baloo 21) */
  title?: string;
  /** Sayfanın üstünde, sayfayla birlikte hareket eden alan; alt kenarı sayfanın üst kenarına oturur */
  top?: ReactNode;
  /** Uzun içerik (form, liste): kaydırılabilir gövde. Kendi listesi olan içerik `SheetFlatList` kullanır. */
  scrollable?: boolean;
  /** Zemin: kum (varsayılan, Poke/NumberEntry) ya da kart beyazı (ayar seçenekleri gibi listeler) */
  surface?: boolean;
  /**
   * Kenarlardan ayrık, alttan boşluklu yüzen içerik (işlem sayfası, FriendProfile.dc.html): tutamaç, zemin ve
   * iç boşluk çizilmez; kartları içerik kendisi çizer. `ActionSheet` kullanır.
   */
  floating?: boolean;
  /**
   * Tasarımdaki sayfa yüksekliği (tutamaç dahil, alt güvenli alan hariç; Poke 610, NumberEntry 506).
   * İçerik kısaysa sayfa bu boyda açılır; gövdede `marginTop: 'auto'` olan öğe (ana buton) en alta iner.
   */
  minHeight?: number;
  /** Gövdenin stiline eklenir (iç boşluk, öğeler arası boşluk) */
  contentStyle?: StyleProp<ViewStyle>;
  /** Ekran okuyucu için sayfanın adı */
  accessibilityLabel?: string;
  children: ReactNode;
  ref?: Ref<SheetHandle>;
};

/** Sayfa içinde kendi kaydırılan listesi olan içerik için (ör. yıl listesi); hareketleri sayfayla uyumlu */
export const SheetFlatList = BottomSheetFlatList;
/** Sayfa içinde kaydırılan alan (`scrollable` yetmediğinde) */
export const SheetScrollView = BottomSheetScrollView;

export default function Sheet({ visible, ...props }: SheetProps) {
  if (visible === undefined) {
    const { ref, ...rest } = props;
    return (
      // iOS'ta native modal ekranı (transparentModal) ayrı bir görünüm denetleyicisi; jestler kendi kökünde
      <GestureHandlerRootView style={styles.fill}>
        {/* İç tutamaç dışa açılanın üst kümesi (close + open) */}
        <SheetCore {...rest} ref={ref as Ref<CoreHandle> | undefined} />
      </GestureHandlerRootView>
    );
  }
  return <ModalSheet visible={visible} {...props} />;
}

// Ekran içi kullanım: kapanma animasyonu bitene kadar Modal açık kalır.
function ModalSheet({ visible, onClose, ref, ...props }: SheetProps & { visible: boolean }) {
  const [mounted, setMounted] = useState(visible);
  const inner = useRef<CoreHandle>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useImperativeHandle(ref, () => ({ close: () => inner.current?.close() }), []);

  // Açılış ilk çizimde (animateOnMount); sonraki değişimlerde aç/kapat. Kapanırken yeniden açılırsa geri döner.
  const shown = useRef(visible);
  useEffect(() => {
    if (shown.current === visible) return;
    shown.current = visible;
    if (visible) {
      setMounted(true);
      inner.current?.open();
    } else {
      inner.current?.close();
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => inner.current?.close()}>
      {/* Android'de Modal ayrı bir kök; jestler için kendi GestureHandlerRootView'u gerekiyor */}
      <GestureHandlerRootView style={styles.fill}>
        <SheetCore
          {...props}
          ref={inner}
          onClose={() => {
            setMounted(false);
            // Kullanıcı kapattıysa (kaydırma, karartma) üst bileşene haber ver
            if (visibleRef.current) onClose();
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

type CoreHandle = SheetHandle & { open: () => void };

/** Tutamaç alanı: üst iç boşluk + tutamaç */
const HANDLE_AREA = m.paddingTop + cm.sheetHandleHeight;

type SheetContextValue = { top?: ReactNode };
const SheetContext = createContext<SheetContextValue>({});

function SheetCore({
  onClose,
  title,
  top,
  scrollable = false,
  surface = false,
  floating = false,
  minHeight,
  contentStyle,
  accessibilityLabel,
  children,
  ref,
}: Omit<SheetProps, 'visible' | 'ref'> & { ref?: Ref<CoreHandle> }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheet = useRef<BottomSheet>(null);

  useImperativeHandle(
    ref,
    () => ({
      close: () => sheet.current?.close(),
      open: () => sheet.current?.snapToIndex(0),
    }),
    [],
  );

  // gorhom gövdeleri tek stil nesnesi bekliyor
  const body = StyleSheet.flatten(
    floating
      ? contentStyle
      : [
          styles.body,
          { paddingBottom: m.paddingBottom + insets.bottom },
          minHeight !== undefined && { minHeight: minHeight - HANDLE_AREA + insets.bottom },
          contentStyle,
        ],
  );
  const heading = title ? (
    <Text accessibilityRole="header" style={[typography.title2, styles.title, { color: colors.text }]}>
      {title}
    </Text>
  ) : null;

  return (
    <SheetContext.Provider value={{ top }}>
      <View style={styles.fill}>
        <BottomSheet
          ref={sheet}
          index={0}
          enableDynamicSizing
          maxDynamicContentSize={(height - insets.top) * m.maxHeightRatio}
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={SheetBackdrop}
          {...(floating
            ? {
                detached: true,
                bottomInset: am.bottom + insets.bottom,
                style: styles.floating,
                handleComponent: null,
                backgroundComponent: null,
              }
            : {
                handleComponent: SheetHandleBar,
                backgroundStyle: [styles.background, { backgroundColor: surface ? colors.surface : colors.background }],
              })}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          accessible={false}
          accessibilityLabel={accessibilityLabel ?? title}>
          {scrollable ? (
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={body}>
              {heading}
              {children}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetView style={body}>
              {heading}
              {children}
            </BottomSheetView>
          )}
          <KeyboardTarget />
        </BottomSheet>
      </View>
    </SheetContext.Provider>
  );
}

/** 44×5 tutamaç (sayfanın üst iç boşluğu 10) */
function SheetHandleBar() {
  const { scheme } = useTheme();
  return (
    <View style={styles.handleArea}>
      <View style={[styles.handle, { backgroundColor: componentColors[scheme].sheetHandle }]} />
    </View>
  );
}

/** Karartma (dokununca kapatır) ve sayfayla birlikte kayan üst alan */
function SheetBackdrop({ animatedIndex, animatedPosition, style }: BottomSheetBackdropProps) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { close } = useBottomSheet();
  const { animatedLayoutState } = useBottomSheetInternal();
  const { top } = useContext(SheetContext);
  const topHeight = useSharedValue(0);
  const minTop = insets.top;

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP),
  }));
  // Üst alanın alt kenarı sayfanın üst kenarında; ekrana sığmıyorsa (kısa ekran, uzun sayfa) gizlenir
  const topStyle = useAnimatedStyle(() => {
    const position = animatedPosition.value;
    const fits = position - topHeight.value >= minTop;
    return {
      opacity: fits ? interpolate(animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP) : 0,
      transform: [{ translateY: position - animatedLayoutState.value.rawContainerHeight }],
    };
  });

  return (
    <>
      <Animated.View style={[style, { backgroundColor: componentColors[scheme].scrim }, scrimStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          onPress={() => close()}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {top != null && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.top, topStyle]}>
          <View onLayout={(e) => topHeight.set(e.nativeEvent.layout.height)}>{top}</View>
        </Animated.View>
      )}
    </>
  );
}

/**
 * gorhom klavyede yalnızca kendi BottomSheetTextInput'unu tanır. Sayfadaki sıradan girdiler (ui/TextField)
 * için klavye açılınca odaktaki girdiyi hedef olarak bildiriyoruz; sayfa klavyenin üstüne çıkar.
 */
function KeyboardTarget() {
  const { animatedKeyboardState } = useBottomSheetInternal();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      // Odaktaki girdinin native etiketi (BottomSheetTextInput'un odakta yaptığı gibi)
      const input = TextInput.State.currentlyFocusedInput();
      const target = input ? findNodeHandle(input as unknown as Parameters<typeof findNodeHandle>[0]) : null;
      if (target != null && animatedKeyboardState.get().target !== target) {
        animatedKeyboardState.set((state) => ({ ...state, target }));
      }
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      animatedKeyboardState.set((state) => ({ ...state, target: undefined }));
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [animatedKeyboardState]);

  return null;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  background: {
    borderTopLeftRadius: cm.sheetRadius,
    borderTopRightRadius: cm.sheetRadius,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  handleArea: {
    paddingTop: m.paddingTop,
    alignItems: 'center',
  },
  handle: {
    width: cm.sheetHandleWidth,
    height: cm.sheetHandleHeight,
    borderRadius: cm.sheetHandleRadius,
  },
  body: {
    paddingTop: m.contentGap,
    paddingHorizontal: m.paddingX,
  },
  // Başlıklı sayfa tasarlanmadı: başlıkla içerik arası boşluk ölçeğinden
  title: {
    marginBottom: spacing.sm,
  },
  top: {
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  floating: {
    marginHorizontal: am.insetX,
  },
});
