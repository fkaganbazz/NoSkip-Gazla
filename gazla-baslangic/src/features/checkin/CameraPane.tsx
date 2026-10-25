/**
 * PhotoProof canlı kamera (expo-camera `CameraView`) — önizleme çerçevesinin (420, köşe 28) içinde.
 * Tasarımda yalnızca çekim sonrası önizleme var; kamera hali onun çerçevesini kullanır:
 * sağ üstte ön/arka geçiş hapı (zaman damgası hapıyla aynı), altta ortada deklanşör (TabBar + butonu
 * ölçüsünde; "Gönder"in yeşili ve düz gölgesi). Çekim bitince `onCapture` (ekran önizlemeye geçer).
 *
 * Android'de önizleme SurfaceView: ebeveynin yuvarlak kırpmasına uymaz; köşeler ekran zemini renginde
 * bir maskeyle yuvarlatılır.
 */
import { CameraView, type CameraType } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CameraIcon } from '@/components/icons';
import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import { useT } from '@/i18n';
import { componentMetrics, radius } from '@/theme';
import { photoProofColors as c, photoProofMetrics as m, photoProofTypography as ty } from '@/theme/checkin';

export type CapturedPhoto = { uri: string; width: number; height: number };

type Props = {
  onCapture: (photo: CapturedPhoto) => void;
  /** Kamera açılamadı (simülatör, kamera meşgul): ekran galeriye düşer */
  onMountError: () => void;
  /** Çekim başarısız: ekran hata metnini gösterir */
  onCaptureError: () => void;
};

// Web'de cihazın ön/arka kamerası bilinemiyor (çoğunlukla tek kamera): geçiş yalnızca telefonda
const CAN_FLIP = Platform.OS !== 'web';

export default function CameraPane({ onCapture, onMountError, onCaptureError }: Props) {
  const t = useT();
  const tc = t.checkin.photo.camera;
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [shooting, setShooting] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const shoot = async () => {
    if (!camera.current || !ready || shooting) return;
    setShooting(true);
    try {
      const picture = await camera.current.takePictureAsync({
        quality: m.captureQuality,
        // Web: tuvalden JPEG (varsayılan PNG büyük)
        ...(Platform.OS === 'web' ? { imageType: 'jpg' as const } : null),
      });
      if (picture?.uri) onCapture({ uri: picture.uri, width: picture.width, height: picture.height });
      else onCaptureError();
    } catch {
      onCaptureError();
    } finally {
      setShooting(false);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const disabled = !ready || shooting;

  return (
    <View style={[styles.frame, { backgroundColor: c.emptyFrameBg }]} onLayout={onLayout}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="picture"
        onCameraReady={() => setReady(true)}
        onMountError={onMountError}
        accessible
        accessibilityLabel={tc.preview}
      />

      {Platform.OS === 'android' && size && <RoundedMask width={size.width} height={size.height} />}

      {!ready && (
        <View style={styles.center}>
          <ActivityIndicator color={c.text} />
        </View>
      )}

      {CAN_FLIP && (
        <Pressable
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          accessibilityRole="button"
          accessibilityLabel={facing === 'back' ? tc.toFront : tc.toBack}
          hitSlop={m.flipHitSlop}
          style={({ pressed }) => [styles.flip, { backgroundColor: c.stampBg }, pressed && styles.pressed]}>
          <Text style={[ty.stamp, { color: c.text }]}>{tc.flip}</Text>
        </Pressable>
      )}

      <View style={styles.shutterRow}>
        <Shutter onPress={shoot} disabled={disabled} busy={shooting} label={tc.shutter} />
      </View>
    </View>
  );
}

/** Deklanşör: 64 daire, 4 px kum halka, yeşil dolgu, kamera ikonu; basılınca gölgenin yarısı kadar iner */
function Shutter({
  onPress,
  disabled,
  busy,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  busy: boolean;
  label: string;
}) {
  const half = m.shutterShadow / 2;
  return (
    <View style={styles.shutterFrame}>
      <FlatShadowUnderlay offset={m.shutterShadow} color={c.shutterShadow} size={m.shutterSize} radius={m.shutterSize / 2} />
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        aria-disabled={disabled}
        aria-busy={busy}
        style={({ pressed }) => [
          styles.shutter,
          {
            backgroundColor: c.shutterBg,
            borderColor: c.shutterRing,
          },
          pressed && !disabled
            ? [{ transform: [{ translateY: m.shutterShadow - half }] }, flatShadowStyle(half, c.shutterShadow)]
            : flatShadowStyle(m.shutterShadow, c.shutterShadow),
          disabled && !busy && styles.disabled,
        ]}>
        {busy ? (
          <ActivityIndicator color={c.shutterIcon} />
        ) : (
          <CameraIcon color={c.shutterIcon} size={m.shutterIconSize} strokeWidth={m.shutterIconStrokeWidth} />
        )}
      </Pressable>
    </View>
  );
}

/** Çerçevenin dışında kalan köşeleri ekran zemini rengiyle örter (dikdörtgen eksi yuvarlak dikdörtgen) */
function RoundedMask({ width: w, height: h }: { width: number; height: number }) {
  const r = Math.min(m.frameRadius, w / 2, h / 2);
  const d = [
    `M0 0 H${w} V${h} H0 Z`,
    `M${r} 0 H${w - r} A${r} ${r} 0 0 1 ${w} ${r} V${h - r} A${r} ${r} 0 0 1 ${w - r} ${h} H${r} A${r} ${r} 0 0 1 0 ${h - r} V${r} A${r} ${r} 0 0 1 ${r} 0 Z`,
  ].join(' ');
  return (
    <Svg width={w} height={h} style={styles.mask}>
      <Path d={d} fill={c.background} fillRule="evenodd" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: {
    marginTop: m.frameMarginTop,
    height: m.frameHeight,
    borderRadius: m.frameRadius,
    overflow: 'hidden',
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  mask: {
    position: 'absolute',
    left: 0,
    top: 0,
    pointerEvents: 'none',
  },
  flip: {
    position: 'absolute',
    right: m.stampInset,
    top: m.stampInset,
    paddingVertical: m.stampPaddingY,
    paddingHorizontal: m.stampPaddingX,
    borderRadius: radius.full,
  },
  pressed: {
    opacity: componentMetrics.buttonFlatPressedOpacity,
  },
  shutterRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: m.shutterInset,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  shutterFrame: {
    width: m.shutterSize,
    height: m.shutterSize,
  },
  shutter: {
    width: m.shutterSize,
    height: m.shutterSize,
    borderRadius: m.shutterSize / 2,
    borderWidth: m.shutterBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: componentMetrics.disabledOpacity,
  },
});
