import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { AddIcon } from '@/components/icons';
import { Card, Chip } from '@/components/ui';
import type { Template } from '@/data';
import { borderWidth, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

import { CATEGORY_NAMES, DIFFICULTY_NAMES } from './labels';

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

  return (
    <Card style={styles.card}>
      {templates.map((t, i) => {
        const meta = `${CATEGORY_NAMES[t.category]} · ${DIFFICULTY_NAMES[t.difficulty]}`;
        const last = i === templates.length - 1 && !onCreate;
        return (
          <Fragment key={t.id}>
            <Pressable
              onPress={() => onOpen(t.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.title}, ${meta}, ${t.defaultDurationDays} gün`}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
              <CategoryTile icon={t.icon} category={t.category} size={m.rowIconTile} />
              <View style={styles.texts}>
                <Text numberOfLines={1} style={[exploreTypography.rowTitle, { color: colors.text }]}>
                  {t.title}
                </Text>
                <Text numberOfLines={1} style={[exploreTypography.rowMeta, { color: colors.textSecondary }]}>
                  {meta}
                </Text>
              </View>
              {/* Süre hapı: dolgu zemin, ana metin (Explore.dc.html) */}
              <Chip
                size="xxs"
                tint={{ bg: colors.surfaceMuted, ink: colors.text }}
                label={`${t.defaultDurationDays} gün`}
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
            <Text style={[exploreTypography.rowTitle, { color: colors.actionText }]}>Kendin oluştur</Text>
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
