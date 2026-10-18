/**
 * Küçük ortak kontroller — design/Components.dc.html: yuvarlak ikon butonu, ekran başlığı, çip,
 * seçim kutusu (segment), anahtar, seçim düğmesi, onay kutusu, bölüm etiketi, ilerleme çubuğu, kart.
 */
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BackIcon, CheckIcon, CloseIcon } from '@/components/icons';
import {
  borderWidth,
  componentColors,
  componentMetrics as cm,
  componentTypography as ct,
  radius,
  spacing,
  typography,
  useTheme,
} from '@/theme';

// Yuvarlak ikon butonu ve ekran başlığı ---------------------------------------------------------

type IconButtonProps = {
  icon: 'back' | 'close';
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** 44 px yuvarlak geri / kapat butonu (Settings.dc.html, Create.dc.html) */
export function IconButton({ icon, onPress, accessibilityLabel }: IconButtonProps) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (icon === 'back' ? 'Geri' : 'Kapat')}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
      ]}>
      {icon === 'back' ? (
        <BackIcon color={colors.text} size={cm.backIconSize} strokeWidth={cm.backIconStroke} />
      ) : (
        <CloseIcon color={colors.text} size={cm.closeIconSize} strokeWidth={cm.closeIconStroke} />
      )}
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
      {leading !== 'none' && <IconButton icon={leading} onPress={onLeadingPress} />}
      <Text accessibilityRole="header" numberOfLines={2} style={[typography.screenTitle, styles.headerTitle, { color: colors.text }]}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}

// Çip ve segment -------------------------------------------------------------------------------

type ChipProps = {
  label: string;
  selected?: boolean;
  /** Yeşil durum çipi ("Durum") */
  status?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
};

/** Tam yuvarlak çip: seçili (koyu), varsayılan (kenarlı), durum (yeşil) */
export function Chip({ label, selected = false, status = false, onPress, icon }: ChipProps) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  const bg = selected ? c.chipSelectedBg : status ? c.statusChipBg : colors.surface;
  const fg = selected ? c.chipSelectedText : status ? c.statusChipText : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: c.chipBorder,
          borderWidth: selected || status ? 0 : borderWidth.thin,
          paddingHorizontal: status ? 12 : cm.chipPaddingX,
        },
      ]}>
      {icon}
      <Text style={[typography.chip, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Seçili hücrenin metin rengi (ör. "Laf sok" turuncu) */
  selectedColor?: (value: T) => string | undefined;
};

/** İki ya da daha çok seçenekli seçim kutusu (Gaz ver / Laf sok) */
export function Segmented<T extends string>({ options, value, onChange, selectedColor }: SegmentedProps<T>) {
  const { colors, scheme } = useTheme();
  const c = componentColors[scheme];
  return (
    <View accessibilityRole="tablist" style={[styles.segmentTrack, { backgroundColor: c.segmentTrack }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && { backgroundColor: c.segmentThumb, boxShadow: `0 1px 3px ${c.segmentShadow}` },
            ]}>
            <Text style={[ct.segment, { color: active ? (selectedColor?.(o.value) ?? colors.text) : colors.textSecondary }]}>
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
      {checked && <CheckIcon color={colors.onAction} size={14} strokeWidth={3.4} />}
    </View>
  );
}

// Bölüm etiketi, kart, ilerleme ---------------------------------------------------------------------

/** Büyük harf bölüm etiketi: "İSTEKLER · 1" */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <Text style={[ct.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>
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

/** İnce ilerleme çubuğu (0–1) */
export function ProgressBar({ value, color, style }: { value: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const { colors, scheme } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: componentColors[scheme].progressTrack }, style]}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color ?? colors.brand }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: cm.iconButton,
    height: cm.iconButton,
    borderRadius: cm.iconButton / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: cm.chipHeight,
    borderRadius: cm.chipRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs - 2,
  },
  segmentTrack: {
    flexDirection: 'row',
    gap: cm.segmentPadding,
    padding: cm.segmentPadding,
    borderRadius: cm.segmentTrackRadius,
  },
  segment: {
    flex: 1,
    height: cm.segmentHeight,
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
  track: {
    height: cm.progressHeight,
    borderRadius: cm.progressHeight / 2,
    overflow: 'hidden',
  },
  fill: {
    height: cm.progressHeight,
    borderRadius: cm.progressHeight / 2,
  },
});
