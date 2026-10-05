import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken, {
  DIKEN_GEARS,
  DIKEN_MOODS,
  DIKEN_POSES,
  DIKEN_STAGES,
  type DikenGear,
  type DikenMood,
  type DikenPose,
  type DikenStage,
} from '@/components/Diken';
import { borderWidth, layout, palette, radius, spacing, typography, useTheme } from '@/theme';

// Geliştirme ekranı: design/Diken.dc.html, Moods.dc.html ve Evolution.dc.html'in mobil karşılığı.
// Tüm ifade, aşama, aksesuar ve duruşları simülatörde kontrol etmek için.

const MOOD_INFO: Record<DikenMood, { name: string; use: string }> = {
  mutlu: { name: 'Mutlu', use: 'Günlük görev tamamlanınca, ana ekranda' },
  selam: { name: 'Selam', use: 'Karşılama ekranı ve ilk açılış' },
  laf: { name: 'Laf sokma', use: 'Dürtme mesajları, bildirim izni' },
  cosku: { name: 'Coşkulu', use: 'Tamamlama anı, seri kurtarılınca' },
  gurur: { name: 'Gururlu', use: 'Challenge bitince, rozet kazanınca' },
  endise: { name: 'Endişeli', use: 'Gün bitmek üzereyken, görev bekliyorken' },
  saskin: { name: 'Şaşkın', use: 'Arkadaşın seni geçince, keşfet vitrini' },
  uykulu: { name: 'Uykulu', use: 'Boş durum, gece sessiz saatler' },
  solgun: { name: 'Solmuş', use: 'Seri koptuğunda, hesap silerken' },
};

const STAGE_NAMES: Record<DikenStage, string> = {
  filiz: 'Filiz',
  genc: 'Genç',
  tam: 'Tam',
  cicek: 'Çiçek',
};

const GEAR_NAMES: Record<DikenGear, string> = {
  yok: 'Yok',
  bant: 'Bant',
  gozluk: 'Gözlük',
};

const POSE_NAMES: Record<DikenPose, string> = {
  relaxed: 'Rahat',
  akimbo: 'Belde',
  cross: 'Kavuşturmuş',
  up: 'Havada',
  droop: 'Sarkık',
  wave: 'El sallıyor',
};

// Evolution.dc.html: seri evrimi
const EVOLUTION: {
  title: string;
  days: string;
  mood: DikenMood;
  stage: DikenStage;
  gear: DikenGear;
}[] = [
  { title: 'Filiz', days: '1–6. gün', mood: 'mutlu', stage: 'filiz', gear: 'yok' },
  { title: 'Genç', days: '7–9. gün', mood: 'mutlu', stage: 'genc', gear: 'yok' },
  { title: 'Savaşçı', days: '10–29. gün', mood: 'cosku', stage: 'tam', gear: 'bant' },
  { title: 'Efsane', days: '30. gün', mood: 'gurur', stage: 'cicek', gear: 'gozluk' },
  { title: 'Solgun', days: 'Seri koptu · 24 saat kurtarma', mood: 'solgun', stage: 'tam', gear: 'yok' },
];

// Tasarımlarda kullanılan boyutlardan bir seçki (en küçük 40, en büyük 420).
const SIZES = [40, 80, 138, 176, 240] as const;
const MATRIX_SIZE = 64;
const GRID_DIKEN_SIZE = 120;
const AUTO_POSE = 'auto';
const POSE_OPTIONS = [AUTO_POSE, ...DIKEN_POSES] as const;

type ChipProps = { label: string; selected: boolean; onPress: () => void };

function Chip({ label, selected, onPress }: ChipProps) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={(layout.minTouchTarget - layout.chipHeight) / 2}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.text, borderColor: colors.text }
          : {
              backgroundColor: colors.surface,
              // Components.dc.html: çip kenarı güçlü çizgi; koyu karşılığı tasarlanmadı.
              borderColor: isDark ? colors.border : palette.strongLine,
            },
      ]}>
      <Text style={[typography.chip, { color: selected ? colors.background : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChipRow<T extends string | number>({
  title,
  options,
  value,
  labelOf,
  onChange,
}: {
  title: string;
  options: readonly T[];
  value: T;
  labelOf: (option: T) => string;
  onChange: (next: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.chipGroup}>
      <Text style={[typography.label, { color: colors.textSecondary }]}>{title}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => (
          <Chip
            key={option}
            label={labelOf(option)}
            selected={option === value}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

export default function DikenScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [mood, setMood] = useState<DikenMood>('mutlu');
  const [stage, setStage] = useState<DikenStage>('tam');
  const [gear, setGear] = useState<DikenGear>('yok');
  const [pose, setPose] = useState<DikenPose | typeof AUTO_POSE>(AUTO_POSE);
  const [size, setSize] = useState<(typeof SIZES)[number]>(240);

  const columnWidth = (width - layout.screenPadding * 2 - spacing.sm) / 2;
  // Dar ekranlarda Diken kartın içinden taşmasın.
  const gridDikenSize = Math.min(
    GRID_DIKEN_SIZE,
    columnWidth - spacing.md * 2 - borderWidth.thin * 2,
  );
  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];
  const sectionTitle = [typography.title2, { color: colors.text }];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: layout.screenPadding + insets.bottom }]}>
      {/* Oyun alanı: her prop tek tek */}
      <View style={card}>
        <View style={[styles.stage, { backgroundColor: colors.surfaceMuted }]}>
          <Diken
            mood={mood}
            stage={stage}
            gear={gear}
            size={size}
            pose={pose === AUTO_POSE ? undefined : pose}
          />
        </View>
        <Text style={[typography.label, { color: colors.textSecondary }]}>
          {`mood="${mood}" stage="${stage}" gear="${gear}" size={${size}}`}
          {pose === AUTO_POSE ? '' : ` pose="${pose}"`}
        </Text>
        <ChipRow
          title="İFADE"
          options={DIKEN_MOODS}
          value={mood}
          labelOf={(m) => MOOD_INFO[m].name}
          onChange={setMood}
        />
        <ChipRow
          title="AŞAMA"
          options={DIKEN_STAGES}
          value={stage}
          labelOf={(s) => STAGE_NAMES[s]}
          onChange={setStage}
        />
        <ChipRow
          title="AKSESUAR"
          options={DIKEN_GEARS}
          value={gear}
          labelOf={(g) => GEAR_NAMES[g]}
          onChange={setGear}
        />
        <ChipRow
          title="DURUŞ"
          options={POSE_OPTIONS}
          value={pose}
          labelOf={(p) => (p === AUTO_POSE ? 'İfadeye göre' : POSE_NAMES[p])}
          onChange={setPose}
        />
        <ChipRow title="BOYUT" options={SIZES} value={size} labelOf={String} onChange={setSize} />
      </View>

      {/* Moods.dc.html: 9 ifade */}
      <Text style={sectionTitle}>İfadeler</Text>
      <View style={styles.grid}>
        {DIKEN_MOODS.map((m) => (
          <View key={m} style={[card, styles.moodCard, { width: columnWidth }]}>
            <View style={[styles.moodStage, { backgroundColor: colors.surfaceMuted }]}>
              <Diken mood={m} stage="tam" size={gridDikenSize} />
            </View>
            <Text style={[typography.cardTitle, { color: colors.text }]}>{MOOD_INFO[m].name}</Text>
            <Text style={[typography.body, { color: colors.textBody }]}>{MOOD_INFO[m].use}</Text>
          </View>
        ))}
      </View>

      {/* Evolution.dc.html: seri evrimi */}
      <Text style={sectionTitle}>Seri evrimi</Text>
      <View style={styles.grid}>
        {EVOLUTION.map((step) => (
          <View key={step.title} style={[card, styles.moodCard, { width: columnWidth }]}>
            <View style={[styles.moodStage, { backgroundColor: colors.surfaceMuted }]}>
              <Diken mood={step.mood} stage={step.stage} gear={step.gear} size={gridDikenSize} />
            </View>
            <Text style={[typography.cardTitle, { color: colors.text }]}>{step.title}</Text>
            <Text style={[typography.body, { color: colors.textBody }]}>{step.days}</Text>
          </View>
        ))}
      </View>

      {/* Tüm ifade × aşama kombinasyonları; aksesuar yukarıdaki seçimden */}
      <Text style={sectionTitle}>Matris · aksesuar: {GEAR_NAMES[gear]}</Text>
      {DIKEN_STAGES.map((s) => (
        <View key={s} style={styles.matrixBlock}>
          <Text style={[typography.cardTitle, { color: colors.text }]}>{STAGE_NAMES[s]}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.matrixRow}>
              {DIKEN_MOODS.map((m) => (
                <View key={m} style={styles.matrixCell}>
                  <Diken mood={m} stage={s} gear={gear} size={MATRIX_SIZE} />
                  <Text style={[typography.label, { color: colors.text }]}>{m}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
    borderRadius: radius.button,
  },
  chipGroup: {
    gap: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    height: layout.chipHeight,
    paddingHorizontal: layout.chipPaddingX,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: borderWidth.thin,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodCard: {
    gap: spacing.xxs,
  },
  moodStage: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: radius.button,
  },
  matrixBlock: {
    gap: spacing.xs,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matrixCell: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
