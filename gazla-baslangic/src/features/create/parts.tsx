/**
 * Yeni challenge formunun parçaları (Create.dc.html): süre hücresi, tamamlama şekli kartı, ayar kartı satırı.
 * Artı/eksi: ortak IconButton; davet satırının kesikli ekle yuvası: ortak AddAvatar.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons';
import { Radio } from '@/components/ui';
import { borderWidth, useTheme } from '@/theme';
import { createColors, createMetrics as m, createTypography as t } from '@/theme/create';

/** Süre ızgarasındaki tek hücre (7 gün / 10 gün / 30 gün / Özel) */
export function DurationCell({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { scheme } = useTheme();
  const c = createColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[
        styles.cell,
        selected
          ? { backgroundColor: c.cellSelectedBg, borderColor: c.cellSelectedBg }
          : { backgroundColor: c.cellBg, borderColor: c.cellBorder },
      ]}>
      <Text style={[t.cell, { color: selected ? c.cellSelectedText : c.cellText }]}>{label}</Text>
    </Pressable>
  );
}

type OptionProps = {
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
  /** Seçiliyken kartın içinde açılan ek alanlar (sayı ayarları) */
  children?: ReactNode;
};

/** "Nasıl tamamlanır?" seçenek kartı */
export function TaskOption({ title, desc, selected, onPress, children }: OptionProps) {
  const { colors, scheme } = useTheme();
  const c = createColors[scheme];
  return (
    <View
      style={[
        styles.option,
        selected
          ? {
              backgroundColor: c.optionSelectedBg,
              borderColor: colors.action,
              boxShadow: `0 0 0 ${m.optionRing}px ${colors.action}`,
            }
          : { backgroundColor: c.optionBg, borderColor: c.optionBorder },
      ]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${title}. ${desc}`}
        style={styles.optionRow}>
        <Radio selected={selected} />
        <View style={styles.optionTexts}>
          <Text style={[t.optionTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[t.optionDesc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
      </Pressable>
      {children}
    </View>
  );
}

type RowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  /** Yoksa satır yalnızca bilgi gösterir (ok yok) */
  onPress?: () => void;
  expanded?: boolean;
  divider?: boolean;
};

/** Ayar kartındaki satır: ikon, etiket, değer, sağa ok */
export function SettingRow({ icon, label, value, onPress, expanded, divider }: RowProps) {
  const { colors, scheme } = useTheme();
  const c = createColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { expanded } : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.row, divider && { borderTopWidth: borderWidth.thin, borderTopColor: c.rowDivider }]}>
      {icon}
      <Text style={[t.optionTitle, styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[t.rowValue, { color: c.rowValue }]}>{value}</Text>
      {onPress && (
        <View style={expanded && styles.chevronOpen}>
          <ChevronRightIcon color={c.rowValue} size={m.chevronSize} strokeWidth={m.chevronStrokeWidth} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    height: m.cellHeight,
    borderRadius: m.cellRadius,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    borderRadius: m.optionRadius,
    borderWidth: borderWidth.thin,
  },
  optionRow: {
    minHeight: m.optionMinHeight,
    paddingHorizontal: m.optionPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.optionInnerGap,
  },
  optionTexts: {
    flex: 1,
    gap: m.optionTextGap,
  },
  row: {
    height: m.rowHeight,
    paddingHorizontal: m.rowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  rowLabel: {
    flex: 1,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
});
