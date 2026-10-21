import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { AddIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import type { Template } from '@/data';
import { borderWidth, cardMetrics, typography, useTheme } from '@/theme';
import { exploreColors, exploreMetrics as m, exploreTypography } from '@/theme/explore';

import { CATEGORY_NAMES, DIFFICULTY_NAMES } from './labels';

type Props = {
  templates: Template[];
  onOpen: (id: string) => void;
  /** Verilirse listenin sonunda "Kendin oluştur" satırı */
  onCreate?: () => void;
};

/** "Kendin oluştur" karosu: satırdaki kategori karosuyla aynı ölçü (ikonu challenge ikonu değil) */
const ADD_TILE = cardMetrics.categoryTile[m.rowIconTile];

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
              <View style={[styles.pill, { backgroundColor: c.durationPillBg }]}>
                <Text style={[typography.smallStrong, { color: colors.text }]}>{`${t.defaultDurationDays} gün`}</Text>
              </View>
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
          <View style={[styles.addTile, { backgroundColor: colors.actionTint }]}>
            <AddIcon color={colors.actionText} size={ADD_TILE.iconSize} strokeWidth={cardMetrics.categoryTileStrokeWidth} />
          </View>
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
  addTile: {
    width: m.rowIconTile,
    height: m.rowIconTile,
    borderRadius: ADD_TILE.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  pill: {
    paddingVertical: m.durationPillPaddingY,
    paddingHorizontal: m.durationPillPaddingX,
    borderRadius: m.durationPillRadius,
  },
  divider: {
    height: borderWidth.thin,
  },
});
