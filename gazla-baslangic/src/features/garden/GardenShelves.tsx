import { Pressable, StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { flatShadowStyle } from '@/components/FlatShadow';
import { AddIcon } from '@/components/icons';
import type { GardenItem } from '@/data';
import { useTheme } from '@/theme';
import { gardenColors, gardenMetrics as m, gardenTypography } from '@/theme/garden';

import { plantLabel, plantLooks, toShelves } from './logic';

type Props = {
  items: GardenItem[];
  onOpen: (challengeId: string) => void;
  onNext: () => void;
};

// Raflar: her tamamlanan challenge bir Diken (aşaması stage), son yerde "Sıradaki" (Garden.dc.html).
// `items` raf sırasıyla (gardenOrder).
export default function GardenShelves({ items, onOpen, onNext }: Props) {
  const { colors, scheme } = useTheme();
  const c = gardenColors[scheme];
  const shelves = toShelves(items, m.perShelf);
  const looks = plantLooks(items);

  return (
    <View style={[styles.panel, { backgroundColor: c.shelfPanelBg }]}>
      {shelves.map((shelf, s) => (
        <View key={s}>
          <View style={styles.plants}>
            {Array.from({ length: m.perShelf }, (_, i) => {
              const slot = shelf[i];
              if (slot === undefined) return <View key={i} style={styles.cell} />;
              if (slot === 'next') {
                return (
                  <View key={i} style={styles.cell}>
                    <Pressable
                      onPress={onNext}
                      accessibilityRole="button"
                      accessibilityLabel="Yeni challenge bul"
                      style={({ pressed }) => [styles.addTile, { borderColor: c.addTileBorder, opacity: pressed ? 0.7 : 1 }]}>
                      <AddIcon color={c.addTileIcon} size={m.addIconSize} strokeWidth={m.addIconStrokeWidth} />
                    </Pressable>
                  </View>
                );
              }
              const look = looks[s * m.perShelf + i];
              return (
                <Pressable
                  key={slot.challengeId}
                  onPress={() => onOpen(slot.challengeId)}
                  accessibilityRole="button"
                  accessibilityLabel={`${slot.title}, tamamlandı`}
                  style={({ pressed }) => [styles.cell, pressed && { opacity: 0.8 }]}>
                  <Diken mood={look.mood} gear={look.gear} stage={slot.stage} size={m.plantSize} />
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.plank, { backgroundColor: c.plank }, flatShadowStyle(m.plankShadow, c.plankShadow)]} />
          <View style={styles.labels}>
            {Array.from({ length: m.perShelf }, (_, i) => {
              const slot = shelf[i];
              const next = slot === 'next';
              return (
                <Text
                  key={i}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                  style={[gardenTypography.plantLabel, styles.label, { color: next ? colors.actionText : c.plantLabel }]}>
                  {slot === undefined ? '' : next ? 'Sıradaki' : plantLabel(slot)}
                </Text>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: m.panelMarginTop,
    paddingTop: m.panelPaddingTop,
    paddingHorizontal: m.panelPaddingX,
    paddingBottom: m.panelPaddingBottom,
    borderRadius: m.panelRadius,
    gap: m.shelfGap,
  },
  plants: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  addTile: {
    width: m.addTileWidth,
    height: m.addTileHeight,
    borderRadius: m.addTileRadius,
    borderWidth: m.addTileBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plank: {
    height: m.plankHeight,
    borderRadius: m.plankRadius,
  },
  labels: {
    marginTop: m.labelsMarginTop,
    flexDirection: 'row',
  },
  label: {
    flex: 1,
  },
});
