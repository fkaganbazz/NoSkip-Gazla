/**
 * Ayarlar satır dili — design/Settings.dc.html: satır kartı (ortak Card), anahtarlı satır, bağlantı satırı
 * (değer + ok). Bölüm etiketi ortak SectionLabel. Bildirimler de aynı dili kullanır.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Card, Toggle } from '@/components/ui';
import { borderWidth, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

/** Satırları taşıyan kart (ortak Card: yüzey, 1 px kenar, 22 köşe) */
export function SettingsGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Card style={[styles.group, style]}>{children}</Card>;
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
  /**
   * Alt ayraç en az yüksekliğin içinde mi. Tasarımdaki satırlar `<a>` (content-box): ayraç yüksekliğe
   * eklenir (56 + 1). "Çıkış yap" `<button>` (tarayıcıda border-box): 56'nın içinde.
   */
  dividerInside?: boolean;
  disabled?: boolean;
  last?: boolean;
  accessibilityLabel?: string;
  /** Dış sayfa açan satır (Destek ve yasal): `link` */
  accessibilityRole?: 'button' | 'link';
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
  dividerInside,
  disabled,
  last,
  accessibilityLabel,
  accessibilityRole = 'button',
}: LinkRowProps) {
  const { colors } = useTheme();
  const divider = useDivider(last);
  const content = (
    <>
      <View style={styles.texts}>
        <Text style={[t.rowTitle, { color: titleColor ?? colors.text }]}>{title}</Text>
        {detail ? <Text style={[t.rowDetail, { color: colors.textSecondary }]}>{detail}</Text> : null}
      </View>
      {value !== undefined && <Text style={[t.rowValue, styles.value, { color: colors.textSecondary }]}>{value}</Text>}
      {chevron && (
        <ChevronRightIcon color={colors.textSecondary} size={m.rowChevronSize} strokeWidth={m.chevronStrokeWidth} />
      )}
    </>
  );
  const rowStyle = [
    styles.linkRow,
    {
      minHeight:
        (compact ? m.linkRowHeightCompact : m.linkRowHeight) + (divider && !dividerInside ? borderWidth.thin : 0),
    },
    detail ? styles.linkRowTall : null,
    divider,
  ];

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.surfaceMuted }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: m.groupMarginTop,
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
