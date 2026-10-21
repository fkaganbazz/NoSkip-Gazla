import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons';
import type { PokeMessage } from '@/data';
import { useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

type Props = {
  messages: PokeMessage[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

// Hazır mesajlar: iki sütunlu kartlar, seçilende koyu kenar ve sağ üstte tik (Poke.dc.html). Kartlar
// tasarımdaki <button> gibi: aynı satırdaki kısa metin dikeyde ortalı.
export default function MessageGrid({ messages, selectedKey, onSelect }: Props) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];

  // İkişerli satırlar: aynı satırdaki kartlar aynı yükseklikte
  const rows: PokeMessage[][] = [];
  for (let i = 0; i < messages.length; i += 2) rows.push(messages.slice(i, i + 2));

  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0].key} style={styles.row}>
          {row.map((msg) => {
            const selected = msg.key === selectedKey;
            return (
              <Pressable
                key={msg.key}
                onPress={() => onSelect(msg.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: selected ? c.selectedBorder : colors.border },
                  pressed && !selected && { backgroundColor: colors.surfaceMuted },
                ]}>
                <Text style={[socialTypography.message, { color: colors.text }]}>{msg.text}</Text>
                {selected && (
                  <View style={[styles.badge, { backgroundColor: c.selectedBorder }]}>
                    <CheckIcon
                      color={c.selectedBadgeIcon}
                      size={m.messageBadgeIconSize}
                      strokeWidth={m.messageBadgeIconStrokeWidth}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
          {row.length === 1 && <View style={styles.spacer} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: m.messagesMarginTop,
    gap: m.messagesGap,
  },
  row: {
    flexDirection: 'row',
    gap: m.messagesGap,
  },
  card: {
    flex: 1,
    minHeight: m.messageMinHeight,
    paddingVertical: m.messagePaddingY,
    paddingLeft: m.messagePaddingLeft,
    paddingRight: m.messagePaddingRight,
    borderRadius: m.messageRadius,
    borderWidth: m.messageBorder,
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: m.messageBadgeInset,
    right: m.messageBadgeInset,
    width: m.messageBadgeSize,
    height: m.messageBadgeSize,
    borderRadius: m.messageBadgeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
