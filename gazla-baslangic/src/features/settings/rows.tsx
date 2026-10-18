/**
 * Ayarlar satır dili — design/Settings.dc.html: bölüm etiketi, satır kartı, anahtarlı satır,
 * bağlantı satırı (değer + ok). Bildirimler ve Engellenenler de aynı dili kullanır.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Toggle } from '@/components/ui';
import { borderWidth, radius, typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

/** Büyük harf bölüm etiketi: "CHALLENGE VE BİLDİRİMLER" (Nunito 800 · 13 · aralık 0.6) */
export function SettingsSection({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text accessibilityRole="header" style={[typography.label, styles.section, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
}

/** Satırları taşıyan kart: yüzey, 1 px kenar, 22 köşe */
export function SettingsGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>
  );
}

function useDivider(last: boolean | undefined) {
  const { scheme } = useTheme();
  return last ? null : { borderBottomWidth: borderWidth.thin, borderBottomColor: settingsColors[scheme].rowDivider };
}

type ToggleRowProps = {
  title: string;
  detail?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  last?: boolean;
};

/** Başlık (+ açıklama) ve sağda anahtar */
export function ToggleRow({ title, detail, value, onChange, disabled, last }: ToggleRowProps) {
  const { colors } = useTheme();
  const divider = useDivider(last);
  return (
    <View style={[styles.toggleRow, divider]}>
      <View style={styles.texts}>
        <Text style={[t.rowTitle, { color: colors.text }]}>{title}</Text>
        {detail ? <Text style={[t.rowDetail, { color: colors.textSecondary }]}>{detail}</Text> : null}
      </View>
      <Toggle value={value} onChange={onChange} disabled={disabled} accessibilityLabel={title} />
    </View>
  );
}

type LinkRowProps = {
  title: string;
  detail?: string;
  /** Sağdaki değer ("21:00", "Herkes") */
  value?: string;
  onPress?: () => void;
  /** Ok gösterilmesin (Çıkış yap, Hesabı sil) */
  chevron?: boolean;
  /** Başlık rengi (Hesabı sil: kırmızı) */
  titleColor?: string;
  /** Destek ve yasal satırları: 54 */
  compact?: boolean;
  /** Başlığın solundaki öğe (avatar) */
  leading?: ReactNode;
  /** Sağda değer/ok yerine özel öğe (Engeli kaldır butonu) */
  trailing?: ReactNode;
  disabled?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
};

/** Basılabilir satır: başlık, değer ve sağa ok */
export function LinkRow({
  title,
  detail,
  value,
  onPress,
  chevron = true,
  titleColor,
  compact,
  leading,
  trailing,
  disabled,
  last,
  accessibilityLabel,
}: LinkRowProps) {
  const { colors } = useTheme();
  const divider = useDivider(last);
  const content = (
    <>
      {leading}
      <View style={styles.texts}>
        <Text style={[t.rowTitle, { color: titleColor ?? colors.text }]}>{title}</Text>
        {detail ? <Text style={[t.rowDetail, { color: colors.textSecondary }]}>{detail}</Text> : null}
      </View>
      {trailing}
      {value !== undefined && <Text style={[t.rowValue, styles.value, { color: colors.textSecondary }]}>{value}</Text>}
      {chevron && !trailing && (
        <ChevronRightIcon color={colors.textSecondary} size={m.rowChevronSize} strokeWidth={m.chevronStrokeWidth} />
      )}
    </>
  );
  const rowStyle = [
    styles.linkRow,
    { minHeight: compact ? m.linkRowHeightCompact : m.linkRowHeight },
    detail ? styles.linkRowTall : null,
    divider,
  ];

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.surfaceMuted }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: m.sectionMarginTop,
  },
  group: {
    marginTop: m.groupMarginTop,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
    // Basılı satır zemini köşelerden taşmasın
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
    paddingVertical: m.rowPaddingY,
    paddingHorizontal: m.rowPaddingX,
  },
  texts: {
    flex: 1,
    gap: m.rowTextGap,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
    paddingHorizontal: m.rowPaddingX,
  },
  linkRowTall: {
    paddingVertical: m.rowPaddingY,
  },
  value: {
    flexShrink: 0,
  },
});
