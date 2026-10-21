/**
 * Küçük ortak kontroller — design/Components.dc.html: yuvarlak ikon butonu, ekran başlığı, çip,
 * seçim kutusu (segment), anahtar, seçim düğmesi, onay kutusu, bölüm etiketi, kart.
 */
import { useRouter } from 'expo-router';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BackIcon, CheckIcon, CloseIcon, DotsIcon, type IconProps } from '@/components/icons';
import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  layout,
  radius,
  typography,
  useTheme,
} from '@/theme';

// Yuvarlak ikon butonu ve ekran başlığı ---------------------------------------------------------

export type IconButtonIcon = 'back' | 'close' | 'options';

/**
 * default: beyaz, 1 px #EFE6DC kenar (çoğu ekran). onColor: renkli zeminde beyaz, kenarsız (ChallengePreview,
 * StreakLost). onDark: koyu ekranda #2B1E47 (PhotoProof). onBrand: yeşil kutlama zemininde yarı saydam kum
 * (Completion). ink: gece moru dolgu, kum ikon (Friends "Arkadaş ekle").
 */
export type IconButtonTone = 'default' | 'onColor' | 'onDark' | 'onBrand' | 'ink';

type IconButtonProps = {
  /** Hazır ikon (geri, kapat, seçenekler) ya da ortak ikon bileşeni (ör. `BellIcon`) */
  icon: IconButtonIcon | ComponentType<IconProps>;
  /** Ekran okuyucu etiketi: "Geri", "Kapat", "Challenge seçenekleri" … */
  accessibilityLabel: string;
  /** Verilmezse geri gider (yığın boşsa ana sayfaya) */
  onPress?: () => void;
  tone?: IconButtonTone;
  /** Özel ikon ölçüsü (varsayılan 22, çizgi 2.2 — Today aktivite zili) */
  iconSize?: number;
  iconStrokeWidth?: number;
  /** İkonun üstüne çizilen öğe (ör. okunmamış sayısı rozeti) */
  children?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 44 px yuvarlak ikon butonu: geri, kapat, seçenekler (üç nokta) ya da verilen ikon */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  tone = 'default',
  iconSize = cm.iconButtonIconSize,
  iconStrokeWidth = cm.iconButtonIconStroke,
  children,
  disabled,
  style,
}: IconButtonProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const router = useRouter();

  const look = {
    default: { bg: colors.surface, fg: colors.text },
    onColor: { bg: c.iconButtonOnColorBg, fg: c.iconButtonOnColorIcon },
    onDark: { bg: c.iconButtonOnDarkBg, fg: c.iconButtonOnDarkIcon },
    onBrand: { bg: c.iconButtonOnBrandBg, fg: c.iconButtonOnBrandIcon },
    ink: { bg: c.chipSelectedBg, fg: c.chipSelectedText },
  }[tone];
  const bordered = tone === 'default';

  let glyph: ReactNode;
  if (icon === 'back') {
    glyph = <BackIcon color={look.fg} size={cm.backIconSize} strokeWidth={cm.backIconStroke} />;
  } else if (icon === 'close') {
    glyph = <CloseIcon color={look.fg} size={cm.closeIconSize} strokeWidth={cm.closeIconStroke} />;
  } else if (icon === 'options') {
    glyph = <DotsIcon color={look.fg} size={cm.optionsIconSize} />;
  } else {
    const Icon = icon;
    glyph = <Icon color={look.fg} size={iconSize} strokeWidth={iconStrokeWidth} />;
  }

  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={disabled ? { disabled } : undefined}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: bordered && pressed ? colors.surfaceMuted : look.bg },
        bordered && { borderWidth: borderWidth.thin, borderColor: colors.border },
        !bordered && pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {glyph}
      {children}
    </Pressable>
  );
}

type ScreenHeaderProps = {
  title: string;
  /** Sol buton: geri (varsayılan), kapat ya da yok */
  leading?: 'back' | 'close' | 'none';
  onLeadingPress?: () => void;
  /** Sağ taraf (ör. "Tümü okundu") */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Ekran başlık satırı: geri/kapat butonu + Baloo 26 başlık (+ sağda isteğe bağlı öğe) */
export function ScreenHeader({ title, leading = 'back', onLeadingPress, trailing, style }: ScreenHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, style]}>
      {leading !== 'none' && (
        <IconButton icon={leading} accessibilityLabel={leading === 'back' ? 'Geri' : 'Kapat'} onPress={onLeadingPress} />
      )}
      <Text accessibilityRole="header" numberOfLines={2} style={[typography.screenTitle, styles.headerTitle, { color: colors.text }]}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}

// Çip ve segment -------------------------------------------------------------------------------

export type ChipSize = 'md' | 'lg';

type ChipProps = {
  label: string;
  /** Seçili: gece moru zemin, kum metin (koyuda ters) */
  selected?: boolean;
  /** Yeşil durum çipi ("Durum") */
  status?: boolean;
  onPress?: () => void;
  /** Metnin solundaki ikon; fonksiyon verilirse çip metninin rengiyle çağrılır */
  icon?: ReactNode | ((color: string) => ReactNode);
  /** md 38 / 14 (Components.dc.html), lg 40 / 16 köşe 20 (Explore.dc.html kategori çipi) */
  size?: ChipSize;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Tam yuvarlak çip: seçili (koyu), varsayılan (kenarlı), durum (yeşil) */
export function Chip({
  label,
  selected = false,
  status = false,
  onPress,
  icon,
  size = 'md',
  accessibilityLabel,
  style,
}: ChipProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const lg = size === 'lg';
  const height = lg ? cm.chipHeightLg : cm.chipHeight;
  const bg = selected ? c.chipSelectedBg : status ? c.statusChipBg : colors.surface;
  const fg = selected ? c.chipSelectedText : status ? c.statusChipText : colors.text;
  // Components'ta seçili/durum çipi kenarsız; Keşfet'te seçili çipin kenarı zeminle aynı renk (ölçü değişmez)
  const bordered = lg || (!selected && !status);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? { selected } : undefined}
      hitSlop={onPress ? { top: (layout.minTouchTarget - height) / 2, bottom: (layout.minTouchTarget - height) / 2 } : undefined}
      style={[
        styles.chip,
        {
          height,
          borderRadius: lg ? cm.chipRadiusLg : cm.chipRadius,
          backgroundColor: bg,
          borderColor: selected || status ? bg : c.chipBorder,
          borderWidth: bordered ? borderWidth.thin : 0,
          paddingHorizontal: status ? cm.statusChipPaddingX : lg ? cm.chipPaddingXLg : cm.chipPaddingX,
        },
        style,
      ]}>
      {typeof icon === 'function' ? icon(fg) : icon}
      <Text style={[typography.chip, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export type SegmentedSize = 'md' | 'lg';

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Seçili hücrenin metin rengi (ör. "Laf sok" turuncu) */
  selectedColor?: (value: T) => string | undefined;
  /** md 42 / 15 (Components, ChallengePreview), lg 44 / 16 (Poke "Gaz ver / Laf sok") */
  size?: SegmentedSize;
  /** Ekran okuyucu: sekmeler (Poke mesaj türü) ya da tek seçim (süre, tema) */
  role?: 'tabs' | 'radio';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** İki ya da daha çok seçenekli seçim kutusu: #EFE6DC kap, seçili beyaz hap */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  selectedColor,
  size = 'md',
  role = 'tabs',
  accessibilityLabel,
  style,
}: SegmentedProps<T>) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const lg = size === 'lg';
  return (
    <View
      accessibilityRole={role === 'tabs' ? 'tablist' : 'radiogroup'}
      accessibilityLabel={accessibilityLabel}
      style={[styles.segmentTrack, { backgroundColor: c.segmentTrack }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole={role === 'tabs' ? 'tab' : 'radio'}
            accessibilityState={role === 'tabs' ? { selected: active } : { checked: active }}
            style={[
              styles.segment,
              { height: lg ? cm.segmentHeightLg : cm.segmentHeight },
              active && { backgroundColor: c.segmentThumb, boxShadow: `0 1px 3px ${c.segmentShadow}` },
            ]}>
            <Text
              numberOfLines={1}
              style={[
                lg ? ct.segmentLg : ct.segment,
                { color: active ? (selectedColor?.(o.value) ?? colors.text) : colors.textSecondary },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Anahtar, seçim düğmesi, onay kutusu -------------------------------------------------------------

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function Toggle({ value, onChange, accessibilityLabel, disabled }: ToggleProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={6}
      style={[styles.toggle, { backgroundColor: value ? colors.action : c.toggleOff, opacity: disabled ? 0.5 : 1 }]}>
      <View
        style={[
          styles.knob,
          { backgroundColor: c.toggleKnob, left: value ? cm.toggleWidth - cm.toggleKnob - cm.toggleInset : cm.toggleInset },
        ]}
      />
    </Pressable>
  );
}

/** Seçim düğmesi (yalnızca görünüm; satırın kendisi basılır) */
export function Radio({ selected }: { selected: boolean }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        styles.radio,
        selected
          ? { borderWidth: cm.radioOnBorder, borderColor: colors.action }
          : { borderWidth: cm.radioOffBorder, borderColor: componentColors[scheme].radioOff },
      ]}
    />
  );
}

/** Onay kutusu (yalnızca görünüm) */
export function Checkbox({ checked }: { checked: boolean }) {
  const { colors, scheme } = useTheme();
  return (
    <View
      style={[
        styles.checkbox,
        checked
          ? { backgroundColor: colors.action }
          : { borderWidth: cm.radioOffBorder, borderColor: componentColors[scheme].radioOff },
      ]}>
      {checked && <CheckIcon color={colors.onAction} size={cm.checkIconSize} strokeWidth={cm.checkIconStroke} />}
    </View>
  );
}

// Bölüm etiketi, kart (ilerleme çubuğu: src/components/ProgressBar.tsx) -------------------------------

/** Türkçe büyük harf (i → İ, ı → I) */
const upperTrText = (text: string) => text.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

/** default: ikincil mor; orange: bugün bekleyenler; green: bugünü tamamlayanlar (Friends.dc.html) */
export type SectionLabelTone = 'default' | 'green' | 'orange';

type SectionLabelProps = {
  /** Metin büyük harfe çevrilir */
  children: string;
  tone?: SectionLabelTone;
  /** Sona " · n" eklenir ("İSTEKLER · 1") */
  count?: number;
  style?: StyleProp<ViewStyle>;
};

/** Büyük harf bölüm etiketi: 13 / 800, aralık 0.6 — "BUGÜN BEKLEYENLER · 2" */
export function SectionLabel({ children, tone = 'default', count, style }: SectionLabelProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const color = tone === 'green' ? c.sectionLabelGreen : tone === 'orange' ? c.sectionLabelOrange : colors.textSecondary;
  return (
    <View style={style}>
      <Text accessibilityRole="header" style={[ct.sectionLabel, { color }]}>
        {upperTrText(count === undefined ? children : `${children} · ${count}`)}
      </Text>
    </View>
  );
}

/** Kart: yüzey, 1 px kenar, 22 köşe */
export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: cm.iconButton,
    height: cm.iconButton,
    borderRadius: cm.iconButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.headerGap,
  },
  headerTitle: {
    flex: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.chipGap,
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: cm.segmentPadding,
    padding: cm.segmentPadding,
    borderRadius: cm.segmentTrackRadius,
  },
  segment: {
    flex: 1,
    borderRadius: cm.segmentRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    width: cm.toggleWidth,
    height: cm.toggleHeight,
    borderRadius: cm.toggleHeight / 2,
  },
  knob: {
    position: 'absolute',
    top: cm.toggleInset,
    width: cm.toggleKnob,
    height: cm.toggleKnob,
    borderRadius: cm.toggleKnob / 2,
  },
  radio: {
    width: cm.radioSize,
    height: cm.radioSize,
    borderRadius: cm.radioSize / 2,
  },
  checkbox: {
    width: cm.radioSize,
    height: cm.radioSize,
    borderRadius: cm.checkboxRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
});
