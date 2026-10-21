import { Pressable, StyleSheet, Text } from 'react-native';

import { FriendList } from '@/components/FriendRow';
import { Radio } from '@/components/ui';
import type { ReportReason } from '@/data';
import { borderWidth, cardColors, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

/** Şikayet nedenleri, tasarımdaki sırayla (report_reason enum'u) */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Hakaret veya zorbalık' },
  { value: 'inappropriate_photo', label: 'Uygunsuz fotoğraf' },
  { value: 'spam_or_fake', label: 'Spam veya sahte hesap' },
  { value: 'dangerous_challenge', label: 'Tehlikeli bir challenge' },
  { value: 'other', label: 'Başka bir şey' },
];

type Props = {
  value: ReportReason;
  onChange: (reason: ReportReason) => void;
};

// Neden seçimi: kart içinde radio satırları, seçili satır açık yeşil (Report.dc.html).
export default function ReasonList({ value, onChange }: Props) {
  const { colors, scheme } = useTheme();
  const c = socialColors[scheme];

  return (
    <FriendList style={styles.card}>
      {REPORT_REASONS.map((r) => {
        const selected = r.value === value;
        return (
          <Pressable
            key={r.value}
            onPress={() => onChange(r.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            style={[
              styles.row,
              {
                backgroundColor: selected ? c.reasonSelectedBg : colors.surface,
                borderBottomColor: cardColors[scheme].rowDivider,
              },
            ]}>
            <Radio selected={selected} />
            <Text style={[socialTypography.reason, styles.label, { color: colors.text }]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </FriendList>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.reasonsMarginTop,
  },
  row: {
    minHeight: m.reasonMinHeight,
    paddingHorizontal: m.reasonPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.reasonGap,
    // Tasarımda son satırda da çizgi var; kartın alt kenarıyla birleşiyor
    borderBottomWidth: borderWidth.thin,
  },
  label: {
    flex: 1,
  },
});
