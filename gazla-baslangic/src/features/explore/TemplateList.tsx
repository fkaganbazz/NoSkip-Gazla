import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { AddIcon } from '@/components/icons';
import { Card, Chip } from '@/components/ui';
import type { Template } from '@/data';
import { useT } from '@/i18n';
import { borderWidth, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

type Props = {
  templates: Template[];
  onOpen: (id: string) => void;
  /** Verilirse listenin sonunda "Kendin oluştur" satırı */
  onCreate?: () => void;
};

// Popüler listesi: tek kartta ayraçlı satırlar (Explore.dc.html).
export default function TemplateList({ templates, onOpen, onCreate }: Props) {
  const { colors, scheme } = useTheme();
  const c = exploreColors[scheme];
  const t = useT();

  return (
    <Card style={styles.card}>
      {templates.map((tp, i) => {
        const meta = `${t.explore.categoryNames[tp.category]} · ${t.explore.difficulty[tp.difficulty]}`;
        const last = i === templates.length - 1 && !onCreate;
        return (
          <Fragment key={tp.id}>
            <Pressable
              onPress={() => onOpen(tp.id)}
              accessibilityRole="button"
              accessibilityLabel={t.explore.list.rowA11y(tp.title, meta, tp.defaultDurationDays)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
              <CategoryTile icon={tp.icon} category={tp.category} size={m.rowIconTile} />
              <View style={styles.texts}>
                <Text numberOfLines={1} style={[exploreTypography.rowTitle, { color: colors.text }]}>
                  {tp.title}
                </Text>
                <Text numberOfLines={1} style={[exploreTypography.rowMeta, { color: colors.textSecondary }]}>
                  {meta}
                </Text>
              </View>
              {/* Süre hapı: dolgu zemin, ana metin (Explore.dc.html) */}
              <Chip
                size="xxs"
                tint={{ bg: colors.surfaceMuted, ink: colors.text }}
                label={t.common.days(tp.defaultDurationDays)}
                style={styles.pill}
              />
            </Pressable>
            {!last && <View style={[styles.divider, { backgroundColor: c.rowDivider }]} />}
          </Fragment>
        );
      })}
      {onCreate && (
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
          {/* "Kendin oluştur": satırdaki kategori karosuyla aynı ölçü, aksiyon yeşili tonunda artı */}
          <CategoryTile icon={AddIcon} tint={{ bg: colors.actionTint, ink: colors.actionText }} size={m.rowIconTile} />
          <View style={styles.texts}>
            <Text style={[exploreTypography.rowTitle, { color: colors.actionText }]}>{t.explore.list.createOwn}</Text>
          </View>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.listMarginTop,
    overflow: 'hidden',
  },
  row: {
    height: m.rowHeight,
    paddingHorizontal: m.rowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  pill: {
    flexShrink: 0,
  },
  divider: {
    height: borderWidth.thin,
  },
});
