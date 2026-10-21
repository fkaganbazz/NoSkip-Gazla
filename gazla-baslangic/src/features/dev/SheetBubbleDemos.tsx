/**
 * Geliştirme ekranı (app/dev/components.tsx) "Sayfa ve balon" bölümü: Sheet (seçenek, kaydırılan ve form sayfası),
 * ActionSheet (onaylı satırlarla) ve SpeechBubble (tüm kuyruk yönleri, boylar, mesaj ve alıntı).
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ActionSheet, { type ActionSheetItem } from '@/components/ActionSheet';
import Diken from '@/components/Diken';
import { HandIcon } from '@/components/icons';
import Sheet, { SheetFlatList, type SheetHandle } from '@/components/Sheet';
import SpeechBubble, { type SpeechBubbleTail } from '@/components/SpeechBubble';
import { Button, Radio, SectionLabel, TextField } from '@/components/ui';
import { BlockIcon, FlagIcon, UserMinusIcon } from '@/features/friends/icons';
import { borderWidth, componentColors, layout, palette, radius, spacing, typography, useTheme } from '@/theme';
import { onboardingColors } from '@/theme/onboarding';

const THEMES = [
  { value: 'system', label: 'Sistem', detail: 'Telefonun ayarını izler' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
] as const;
type ThemeValue = (typeof THEMES)[number]['value'];

const YEARS = Array.from({ length: 60 }, (_, i) => 2013 - i);
const YEAR_ROW = layout.minTouchTarget + spacing.xxs;

const TAILS: Exclude<SpeechBubbleTail, 'none'>[] = ['left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

/** İşlemi taklit eden bekleme */
const fake = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SheetBubbleDemos() {
  const { colors, scheme } = useTheme();
  const [open, setOpen] = useState<'options' | 'years' | 'form' | 'actions' | null>(null);
  const [themeValue, setThemeValue] = useState<ThemeValue>('system');
  const [year, setYear] = useState(2000);
  const [name, setName] = useState('Deniz');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState('—');
  const formSheet = useRef<SheetHandle>(null);
  const close = () => setOpen(null);

  const confirmed = async (label: string) => {
    setBusy(true);
    await fake(700);
    setBusy(false);
    setLast(label);
    close();
  };

  const items: ActionSheetItem[] = [
    { key: 'poke', label: "Ece'yi dürt", icon: HandIcon, onPress: () => setLast('Dürt açıldı') },
    {
      key: 'remove',
      label: 'Arkadaşlıktan çıkar',
      icon: UserMinusIcon,
      confirm: {
        title: 'Ece arkadaşlıktan çıkarılsın mı?',
        message: 'İstersen sonra yeniden arkadaşlık isteği gönderebilirsin.',
        confirmLabel: 'Arkadaşlıktan çıkar',
        loading: busy,
      },
      onPress: () => confirmed('Arkadaşlıktan çıkarıldı'),
    },
    {
      key: 'block',
      label: 'Engelle',
      icon: BlockIcon,
      danger: true,
      confirm: {
        title: "Ece'yi engelle?",
        message: "Engellediğin kişi seni bulamaz ve dürtemez. Engeli Ayarlar'dan kaldırabilirsin.",
        confirmLabel: 'Engelle',
        loading: busy,
      },
      onPress: () => confirmed('Engellendi'),
    },
    { key: 'report', label: 'Şikayet et', icon: FlagIcon, danger: true, onPress: () => setLast('Şikayet açıldı') },
  ];

  return (
    <>
      <Panel title="Alt sayfa">
        <Note>Köşe 28, 44×5 tutamaç, karartma; içerik boyunda açılır. Aşağı kaydır ya da karartmaya dokun.</Note>
        <View style={styles.row}>
          <Button title="Seçenek" variant="secondary" size="sm" onPress={() => setOpen('options')} />
          <Button title="Uzun liste" variant="secondary" size="sm" onPress={() => setOpen('years')} />
          <Button title="Form" variant="secondary" size="sm" onPress={() => setOpen('form')} />
        </View>
        <Note>{`Görünüm: ${THEMES.find((x) => x.value === themeValue)?.label} · Yıl: ${year} · Ad: ${name}`}</Note>
      </Panel>

      <Panel title="İşlem sayfası">
        <Note>Başlık, ikonlu satırlar, kırmızı tehlike satırları, ayrı kartta Vazgeç. Engelle onay ister.</Note>
        <Button title="İşlem sayfasını aç" variant="secondary" onPress={() => setOpen('actions')} />
        <Note>{`Son işlem: ${last}`}</Note>
      </Panel>

      <Panel title="Konuşma balonu">
        <Note>Kuyruk yönleri (sm, karartma üstündeki gibi gölgesiz)</Note>
        <View style={[styles.swatch, { backgroundColor: componentColors[scheme].scrim }]}>
          <View style={styles.tails}>
            {TAILS.map((tail) => (
              <View key={tail} style={styles.tailCell}>
                <SpeechBubble size="sm" tail={tail} shadow="none">
                  {tail}
                </SpeechBubble>
              </View>
            ))}
          </View>
        </View>

        <Note>Diken'in sözü (sm) · Poke</Note>
        <View style={[styles.swatch, styles.dikenRow, { backgroundColor: componentColors[scheme].scrim }]}>
          <Diken mood="laf" stage="tam" size={88} />
          <SpeechBubble size="sm" tail="left" shadow="none" style={styles.flex}>
            Ece sert modu açmış. Acıma.
          </SpeechBubble>
        </View>

        <Note>Karşılama (md, deep gölge, koyu modda da beyaz) · Main</Note>
        <View style={[styles.swatch, { backgroundColor: palette.actionGreen }]}>
          <SpeechBubble tail="bottom-right" shadow="deep" tone="light" style={styles.main}>
            Ben Diken. Seni dürtmeye geldim.
          </SpeechBubble>
        </View>

        <Note>İzin kartı (lg, soft gölge) · NotifPermission</Note>
        <View style={[styles.swatch, { backgroundColor: onboardingColors[scheme].permissionBg }]}>
          <SpeechBubble size="lg" tail="bottom-left" tailOffset={170}>
            <Text style={[typography.screenTitle, { color: colors.text }]}>Seni dürtmeme izin ver.</Text>
            <Text style={[typography.body, styles.lgBody, { color: colors.textBody }]}>
              Söz, sadece gün bitmek üzereyken ve arkadaşların seni dürttüğünde yazarım.
            </Text>
          </SpeechBubble>
        </View>

        <Note>Kişinin notu (message) ve Diken (sm, kuyruksuz) · InviteLanding</Note>
        <View style={[styles.swatch, { backgroundColor: onboardingColors[scheme].permissionBg }]}>
          <SpeechBubble variant="message">Tatlıyı bırakıyoruz. Kaçıran herkese baklava ısmarlar.</SpeechBubble>
          <SpeechBubble size="sm" style={styles.start}>
            Baklavayı sen ısmarlama da.
          </SpeechBubble>
        </View>

        <Note>Alıntı (quote) · Activity</Note>
        <SpeechBubble variant="quote" style={styles.start}>
          &quot;Kaktüs bile senden hızlı büyüyor&quot;
        </SpeechBubble>
      </Panel>

      <Sheet visible={open === 'options'} onClose={close} title="Görünüm" surface>
        <View accessibilityRole="radiogroup">
          {THEMES.map((o, i) => (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: o.value === themeValue }}
              onPress={() => {
                setThemeValue(o.value);
                close();
              }}
              style={[
                styles.option,
                i < THEMES.length - 1 && { borderBottomWidth: borderWidth.thin, borderBottomColor: colors.border },
              ]}>
              <View style={styles.flex}>
                <Text style={[typography.cardTitle, { color: colors.text }]}>{o.label}</Text>
                {'detail' in o && <Text style={[typography.meta, { color: colors.textSecondary }]}>{o.detail}</Text>}
              </View>
              <Radio selected={o.value === themeValue} />
            </Pressable>
          ))}
        </View>
      </Sheet>

      {/* Kendi listesi olan sayfa (BirthYearField gibi): SheetFlatList, seçili yıl ortada açılır */}
      <Sheet visible={open === 'years'} onClose={close} title="Doğum yılın" surface>
        <SheetFlatList
          data={YEARS}
          keyExtractor={(y) => String(y)}
          initialScrollIndex={Math.max(0, YEARS.indexOf(year) - 3)}
          getItemLayout={(_, index) => ({ length: YEAR_ROW, offset: YEAR_ROW * index, index })}
          style={styles.years}
          renderItem={({ item: y }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: y === year }}
              onPress={() => {
                setYear(y);
                close();
              }}
              style={[styles.year, y === year && { backgroundColor: colors.actionTint }]}>
              <Text style={[typography.cardTitle, { color: y === year ? colors.actionText : colors.text }]}>{y}</Text>
            </Pressable>
          )}
        />
      </Sheet>

      <Sheet ref={formSheet} visible={open === 'form'} onClose={close} title="Profili düzenle" contentStyle={styles.form}>
        <TextField label="Adın" value={name} onChangeText={setName} />
        <Button title="Kaydet" onPress={() => formSheet.current?.close()} />
      </Sheet>

      <ActionSheet
        visible={open === 'actions'}
        onClose={close}
        title="Ece · @ece.y"
        accessibilityLabel="Ece için işlemler"
        items={items}
      />
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </View>
  );
}

function Note({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[typography.meta, { color: colors.textSecondary }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.card,
  },
  tails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.xl,
    rowGap: spacing.xxl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  tailCell: {
    flexBasis: '40%',
    flexGrow: 1,
  },
  dikenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  main: {
    width: 176,
    marginBottom: spacing.md,
  },
  lgBody: {
    marginTop: spacing.xs,
  },
  start: {
    alignSelf: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  option: {
    minHeight: layout.minTouchTarget + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  years: {
    height: YEAR_ROW * 7,
  },
  year: {
    height: YEAR_ROW,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
    justifyContent: 'center',
  },
  form: {
    gap: spacing.md,
  },
});
