import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { typography, useTheme } from '@/theme';

type Props = {
  title: string;
  /** Sağdaki kısa bilgi ("1/3 tamam") */
  detail?: string;
  detailColor?: string;
  style?: StyleProp<ViewStyle>;
};

// Bölüm başlığı: solda Baloo başlık, sağda taban çizgisine hizalı kısa bilgi.
export default function SectionHeader({ title, detail, detailColor, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text accessibilityRole="header" style={[typography.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      {detail ? (
        <Text style={[typography.captionStrong, { color: detailColor ?? colors.textSecondary }]}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
