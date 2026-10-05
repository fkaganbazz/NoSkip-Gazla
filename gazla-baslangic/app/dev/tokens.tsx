import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  borderWidth,
  layout,
  radius,
  spacing,
  typography,
  useTheme,
  type ColorRoles,
  type TypographyVariant,
} from '@/theme';

// Geliştirme ekranı: design/Tokens.dc.html'in mobil karşılığı.
// Fontları, Türkçe karakterleri ve açık/koyu renkleri simülatörde kontrol etmek için.

const TYPE_SAMPLES: { variant: TypographyVariant; caption: string; sample: string }[] = [
  { variant: 'display', caption: 'Gösterim · Baloo 2 800 · 46', sample: 'Bugün tamam!' },
  { variant: 'title1', caption: 'Başlık 1 · Baloo 2 800 · 30', sample: "İlk challenge'ını seç" },
  { variant: 'title2', caption: 'Başlık 2 · Baloo 2 800 · 21', sample: 'Bugünkü görevler' },
  { variant: 'cardTitle', caption: 'Kart başlığı · Nunito 800 · 16', sample: 'Uyanınca 1 saat telefonsuz' },
  {
    variant: 'body',
    caption: 'Gövde · Nunito 600 · 15',
    sample: 'Sonra istediğin kadar ekleyebilirsin. Arkadaşların da katılabilir.',
  },
  { variant: 'label', caption: 'Etiket · Nunito 800 · 13', sample: 'BUGÜN BEKLEYENLER · 2' },
];

const SPACING_STEPS = Object.entries(spacing);

const RADIUS_SAMPLES: { label: string; value: number; sheet?: boolean }[] = [
  { label: 'Çip · tam', value: radius.full },
  { label: 'Buton · 18', value: radius.button },
  { label: 'Kart · 22', value: radius.card },
  { label: 'Sayfa · 28', value: radius.sheet, sheet: true },
];

export default function TokensScreen() {
  const { colors, scheme } = useTheme();
  const colorEntries = Object.entries(colors) as [keyof ColorRoles, string][];

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  const sectionLabel = [typography.label, { color: colors.textSecondary }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[typography.title1, { color: colors.text }]}>Renk ve yazı</Text>
          <Text style={[typography.body, { color: colors.textBody }]}>
            Beyaz metin sadece aksiyon yeşilinin ve hata kırmızısının üstünde. Turuncu ve sarı zeminde
            metin her zaman gece moru.
          </Text>
        </View>

        <View style={card}>
          <Text style={sectionLabel}>YAZI ÖLÇEĞİ</Text>
          {TYPE_SAMPLES.map(({ variant, caption, sample }) => (
            <View key={variant} style={styles.sample}>
              <Text style={sectionLabel}>{caption}</Text>
              <Text
                style={[
                  typography[variant],
                  { color: variant === 'body' ? colors.textBody : variant === 'label' ? colors.textSecondary : colors.text },
                ]}>
                {sample}
              </Text>
            </View>
          ))}
          <View style={[styles.turkish, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={sectionLabel}>Türkçe karakter</Text>
            <Text style={[typography.title2, { color: colors.text }]}>ğüşıöç İĞÜŞÖÇ</Text>
          </View>
        </View>

        <View style={card}>
          <Text style={sectionLabel}>RENKLER · {scheme === 'dark' ? 'KOYU' : 'AÇIK'}</Text>
          {colorEntries.map(([name, hex]) => (
            <View key={name} style={styles.colorRow}>
              <View style={[styles.swatch, { backgroundColor: hex, borderColor: colors.border }]} />
              <Text style={[typography.cardTitle, styles.grow, { color: colors.text }]}>{name}</Text>
              <Text style={[typography.label, { color: colors.textSecondary }]}>{hex}</Text>
            </View>
          ))}
        </View>

        <View style={card}>
          <Text style={sectionLabel}>BOŞLUK VE KÖŞE</Text>
          <View style={styles.spacingRow}>
            {SPACING_STEPS.map(([name, value]) => (
              <View key={name} style={styles.spacingStep}>
                <View style={{ width: value, height: value, backgroundColor: colors.brand }} />
                <Text style={[typography.label, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
          </View>
          <Text style={[typography.body, { color: colors.textBody }]}>
            Kenar boşluğu {layout.screenPadding}
          </Text>
          <View style={styles.radiusRow}>
            {RADIUS_SAMPLES.map(({ label, value, sheet }) => (
              <View key={label} style={styles.radiusSample}>
                <View
                  style={[
                    styles.radiusShape,
                    { borderColor: colors.text },
                    sheet
                      ? { borderTopLeftRadius: value, borderTopRightRadius: value }
                      : { borderRadius: value },
                  ]}
                />
                <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  sample: {
    gap: spacing.xxs,
  },
  turkish: {
    padding: spacing.sm,
    gap: spacing.xxs,
    borderRadius: radius.button,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: spacing.sm,
    borderWidth: borderWidth.thin,
  },
  grow: {
    flex: 1,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  spacingStep: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusSample: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  radiusShape: {
    width: spacing.xxl * 2,
    height: layout.minTouchTarget,
    borderWidth: borderWidth.thick,
  },
});
