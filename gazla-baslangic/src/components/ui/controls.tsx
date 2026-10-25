/**
 * Küçük ortak kontroller — design/Components.dc.html: yuvarlak ikon butonu, ekran başlığı, çip,
 * seçim kutusu (segment), anahtar, seçim düğmesi, onay kutusu, bölüm etiketi, kart.
 */
import { useRouter } from 'expo-router';
import { createElement, isValidElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BackIcon, CheckIcon, CloseIcon, DotsIcon, type IconProps } from '@/components/icons';
import { useLanguage, useT, type Language } from '@/i18n';
import {
  borderWidth,
  challengeTints,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  layout,
  radius,
  typography,
  useTheme,
  type ChallengeTint,
  type Tint,
} from '@/theme';

// Yuvarlak ikon butonu ve ekran başlığı ---------------------------------------------------------

export type IconButtonIcon = 'back' | 'close' | 'options';

/**
 * default: beyaz, 1 px #EFE6DC kenar (çoğu ekran). onColor: renkli zeminde beyaz, kenarsız (ChallengePreview,
 * StreakLost). onDark: koyu ekranda #2B1E47 (PhotoProof). onBrand: yeşil kutlama zemininde yarı saydam kum
 * (Completion). ink: gece moru dolgu, kum ikon; koyuda ters (Friends "Arkadaş ekle", avatar kamera rozeti).
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
  /** Dış ölçü (kenar dahil) · varsayılan 44; küçükse dokunma alanı hitSlop ile 44'e tamamlanır */
  size?: number;
  /** Zemin renginde dış kenar (kamera rozeti: 3 px ekran/sayfa zemini) */
  outlineColor?: string;
  outlineWidth?: number;
  /** Özel ikon ölçüsü (varsayılan 22, çizgi 2.2 — Today aktivite zili) */
  iconSize?: number;
  iconStrokeWidth?: number;
  /** Tonun ikon rengini ezer (Profile kamera rozeti: beyaz — `componentColors.cameraBadgeIcon`) */
  iconColor?: string;
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
  size = cm.iconButton,
  outlineColor,
  outlineWidth = cm.cameraBadge.outline,
  iconSize = cm.iconButtonIconSize,
  iconStrokeWidth = cm.iconButtonIconStroke,
  iconColor,
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
  const fg = iconColor ?? look.fg;
  const bordered = tone === 'default';

  let glyph: ReactNode;
  if (icon === 'back') {
    glyph = <BackIcon color={fg} size={cm.backIconSize} strokeWidth={cm.backIconStroke} />;
  } else if (icon === 'close') {
    glyph = <CloseIcon color={fg} size={cm.closeIconSize} strokeWidth={cm.closeIconStroke} />;
  } else if (icon === 'options') {
    glyph = <DotsIcon color={fg} size={cm.optionsIconSize} />;
  } else {
    const Icon = icon;
    glyph = <Icon color={fg} size={iconSize} strokeWidth={iconStrokeWidth} />;
  }

  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-disabled={disabled || undefined}
      hitSlop={size < layout.minTouchTarget ? (layout.minTouchTarget - size) / 2 : undefined}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: bordered && pressed ? colors.surfaceMuted : look.bg },
        bordered && { borderWidth: borderWidth.thin, borderColor: colors.border },
        outlineColor && { borderWidth: outlineWidth, borderColor: outlineColor },
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
  /** default: Baloo 26 ekran başlığı; compact: Nunito 800 · 17 (DeleteAccount.dc.html, Report.dc.html) */
  size?: 'default' | 'compact';
  /** center: başlık ortada, sağda buton genişliğinde boşluk (Report.dc.html) */
  align?: 'start' | 'center';
  /** Sağ taraf (ör. "Tümü okundu") */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Ekran başlık satırı: geri/kapat butonu + başlık (+ sağda isteğe bağlı öğe) */
export function ScreenHeader({
  title,
  leading = 'back',
  onLeadingPress,
  size = 'default',
  align = 'start',
  trailing,
  style,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const t = useT();
  const centered = align === 'center';
  return (
    <View style={[styles.header, style]}>
      {leading !== 'none' && (
        <IconButton
          icon={leading}
          accessibilityLabel={leading === 'back' ? t.common.back : t.common.close}
          onPress={onLeadingPress}
        />
      )}
      <Text
        accessibilityRole="header"
        numberOfLines={2}
        style={[
          size === 'compact' ? ct.headerCompact : typography.screenTitle,
          styles.headerTitle,
          centered && styles.headerCentered,
          { color: colors.text },
        ]}>
        {title}
      </Text>
      {trailing ?? (centered && leading !== 'none' ? <View style={styles.headerSide} /> : null)}
    </View>
  );
}

// Çip ve segment -------------------------------------------------------------------------------

/** xxs 12 (Explore süre hapı) · xs 13 (Detail bilgi çipi) · sm 14 hap (NumberEntry) · md 38 (Components) · lg 40 (Explore) */
export type ChipSize = keyof typeof cm.chip;

/**
 * default: kenarlı yüzey. ink: gece moru / kum (koyuda ters; Detail "30 gün", seçili çip). success: yeşil
 * (Durum, "Bugün tamam", hedefte). warning: şeftali ("4 kişi", hedefe kalan, "Laf sokma…"). muted: dolgu +
 * gövde metni ("Hatırlatma 08:00", "Orta zorluk").
 */
export type ChipTone = 'default' | 'ink' | 'success' | 'warning' | 'muted';

type ChipProps = {
  label: string;
  /** Seçili (basılabilir çip): `ink` görünümü; ekran okuyucuya seçili / basılı bilgisi */
  selected?: boolean;
  tone?: ChipTone;
  /** Challenge rengi (kategori çipi) ya da doğrudan zemin/metin; tonun yerine geçer */
  tint?: ChallengeTint | Tint;
  onPress?: () => void;
  /**
   * Metnin solundaki ikon: ikon bileşeni (`CheckIcon`) çipin metin renginde ve boyun ölçüsünde çizilir;
   * hazır öğe (ör. avatar, SignIn'deki tikli yeşil nokta) olduğu gibi konur
   */
  icon?: ComponentType<IconProps> | ReactElement;
  size?: ChipSize;
  /** Uzun metin: satır sınırı (verilmezse alt satıra geçer) */
  numberOfLines?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Tam yuvarlak çip: seçilebilir (kenarlı / seçili) ya da renkli bilgi etiketi (tonlar, challenge rengi) */
export function Chip({
  label,
  selected = false,
  tone = 'default',
  tint,
  onPress,
  icon,
  size = 'md',
  numberOfLines,
  accessibilityLabel,
  style,
}: ChipProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const spec = cm.chip[size];
  const t = selected ? 'ink' : tone;

  const look: Tint = tint
    ? typeof tint === 'string'
      ? challengeTints[tint][scheme]
      : tint
    : {
        default: { bg: colors.surface, ink: colors.text },
        ink: { bg: c.chipSelectedBg, ink: c.chipSelectedText },
        success: { bg: c.chipSuccessBg, ink: c.chipSuccessText },
        warning: { bg: c.chipWarningBg, ink: c.chipWarningText },
        muted: { bg: colors.surfaceMuted, ink: colors.textBody },
      }[t];
  // Components'ta yalnızca varsayılan çip kenarlı; Keşfet'te (lg) seçili çipin kenarı zeminle aynı (ölçü değişmez)
  const isDefault = t === 'default' && !tint;
  const bordered = size === 'lg' || isDefault;

  const iconNode = !icon ? null : isValidElement(icon) ? (
    icon
  ) : (
    createElement(icon as ComponentType<IconProps>, { color: look.ink, size: spec.iconSize, strokeWidth: spec.iconStroke })
  );
  const [iconPaddingY, iconPaddingLeft, iconPaddingRight] = spec.iconPadding;
  const paddingX = t === 'success' && size === 'md' ? cm.chipSuccessPaddingX : spec.paddingX;
  const pad = iconNode
    ? { paddingTop: iconPaddingY, paddingBottom: iconPaddingY, paddingLeft: iconPaddingLeft, paddingRight: iconPaddingRight }
    : { paddingTop: spec.paddingY, paddingBottom: spec.paddingY, paddingLeft: paddingX, paddingRight: paddingX };
  const height = spec.height || undefined;
  const textStyle = size === 'xxs' ? ct.chipXxs : size === 'xs' ? ct.chipXs : ct.chip;
  const chipStyle = [
    styles.chip,
    pad,
    {
      minHeight: height,
      gap: spec.gap,
      borderRadius: spec.radius || radius.full,
      backgroundColor: look.bg,
      borderColor: isDefault ? c.chipBorder : look.bg,
      borderWidth: bordered ? borderWidth.thin : 0,
    },
    style,
  ];
  const content = (
    <>
      {iconNode}
      <Text numberOfLines={numberOfLines} style={[textStyle, styles.chipLabel, { color: look.ink }]}>
        {label}
      </Text>
    </>
  );

  // Bilgi çipi: basılmaz, düz görünüm
  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} style={chipStyle}>
        {content}
      </View>
    );
  }
  const slop = height ? (layout.minTouchTarget - height) / 2 : undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      // Web: seçilebilir çip aç/kapa butonu (Explore.dc.html aria-pressed); RN'de accessibilityState.selected
      {...(Platform.OS === 'web' ? ({ 'aria-pressed': selected } as object) : null)}
      hitSlop={slop ? { top: slop, bottom: slop } : undefined}
      style={chipStyle}>
      {content}
    </Pressable>
  );
}

export type SegmentedSize = 'md' | 'lg';

/** Seçim kutusu seçeneği; `disabled`: soluk (opaklık .5), basılamaz, ekran okuyucuda pasif (Poke "Laf sok") */
export type SegmentedOption<T extends string> = { value: T; label: string; disabled?: boolean };

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Seçili hücrenin metin rengi (ör. "Laf sok" turuncu) */
  selectedColor?: (value: T) => string | undefined;
  /** Yükseklik: md 42 (Components, ChallengePreview), lg 44 (Poke, Settings tema seçici) */
  size?: SegmentedSize;
  /** Yazı: md 15 (varsayılan), lg 16 (Poke "Gaz ver / Laf sok") */
  textSize?: SegmentedSize;
  /**
   * Ekran okuyucu: sekmeler (Poke mesaj türü; seçili gölge .12) ya da tek seçim (süre, tema; gölge .14).
   * Web'de seçim `aria-selected` / `aria-checked` olarak çıkar.
   */
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
  textSize = 'md',
  role = 'tabs',
  accessibilityLabel,
  style,
}: SegmentedProps<T>) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const tabs = role === 'tabs';
  const shadow = tabs ? c.segmentShadow : c.segmentShadowRadio;
  return (
    <View
      role={tabs ? 'tablist' : 'radiogroup'}
      aria-label={accessibilityLabel}
      style={[styles.segmentTrack, { backgroundColor: c.segmentTrack }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        const disabled = !!o.disabled;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            disabled={disabled}
            role={tabs ? 'tab' : 'radio'}
            aria-selected={tabs ? active : undefined}
            aria-checked={tabs ? undefined : active}
            // Pasif hücre: iOS/Android accessibilityState.disabled, web aria-disabled
            aria-disabled={disabled || undefined}
            style={[
              styles.segment,
              { height: size === 'lg' ? cm.segmentHeightLg : cm.segmentHeight },
              active && { backgroundColor: c.segmentThumb, boxShadow: `0 1px 3px ${shadow}` },
              disabled && { opacity: cm.disabledOpacity },
            ]}>
            <Text
              numberOfLines={1}
              style={[
                textSize === 'lg' ? ct.segmentLg : ct.segment,
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
      role="switch"
      aria-label={accessibilityLabel}
      aria-checked={value}
      aria-disabled={disabled || undefined}
      hitSlop={6}
      style={[styles.toggle, { backgroundColor: value ? colors.action : c.toggleOff, opacity: disabled ? cm.disabledOpacity : 1 }]}>
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

/** Büyük harf: Türkçede i → İ, ı → I; İngilizcede düz büyük harf ("Notifications" → "NOTIFICATIONS") */
const upperText = (text: string, lang: Language) =>
  lang === 'tr' ? text.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase() : text.toUpperCase();

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
  const lang = useLanguage();
  const c = componentColors[scheme];
  const color = tone === 'green' ? c.sectionLabelGreen : tone === 'orange' ? c.sectionLabelOrange : colors.textSecondary;
  return (
    <View style={style}>
      <Text accessibilityRole="header" style={[ct.sectionLabel, { color }]}>
        {upperText(count === undefined ? children : `${children} · ${count}`, lang)}
      </Text>
    </View>
  );
}

type CardProps = {
  children: ReactNode;
  /** Verilirse kart basılır (ör. Ayarlar profil kartı); basılıyken zemin ikincil yüzey */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Kart: yüzey, 1 px kenar, 22 köşe */
export function Card({ children, onPress, accessibilityLabel, accessibilityHint, style }: CardProps) {
  const { colors } = useTheme();
  const base = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [base, pressed && { backgroundColor: colors.surfaceMuted }, style]}>
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
    opacity: cm.disabledOpacity,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.headerGap,
  },
  headerTitle: {
    flex: 1,
  },
  headerCentered: {
    textAlign: 'center',
  },
  // Ortalı başlığın sağında, soldaki butonla aynı genişlikte boşluk
  headerSide: {
    width: cm.iconButton,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  chipLabel: {
    flexShrink: 1,
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
