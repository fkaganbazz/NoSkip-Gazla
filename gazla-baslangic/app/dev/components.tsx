import { Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AddAvatar, Avatar, AvatarStack } from '@/components/Avatar';
import { CategoryTile } from '@/components/CategoryTile';
import { DropMeter } from '@/components/DropMeter';
import { FriendBubble, FriendList, FriendRow, InviteBubble } from '@/components/FriendRow';
import { AddIcon, BellIcon, HandIcon, SendIcon, ShareIcon } from '@/components/icons';
import OnboardingHeader from '@/components/OnboardingHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { StreakChip } from '@/components/StreakChip';
import { TaskCard } from '@/components/TaskCard';
import {
  Button,
  Checkbox,
  Chip,
  IconButton,
  Radio,
  SectionLabel,
  Segmented,
  Toast,
  ToastHost,
  Toggle,
  useToast,
} from '@/components/ui';
import {
  borderWidth,
  challengeTints,
  componentMetrics as cm,
  layout,
  palette,
  radius,
  spacing,
  typography,
  useTheme,
} from '@/theme';
import { celebrationColors } from '@/theme/moments';
import { onboardingColors } from '@/theme/onboarding';
import { socialColors } from '@/theme/social';

// Geliştirme ekranı: design/Components.dc.html'deki ortak bileşenler, açık/koyu modda ve tüm halleriyle.
// Basılı hal: butona basılı tut (2 px iner, gölge 2 px kalır).

const noop = () => {};
const icon20 = { size: cm.buttonIconSize, strokeWidth: cm.buttonIconStroke };

type Tone = 'hype' | 'roast';
const TONES: { value: Tone; label: string }[] = [
  { value: 'hype', label: 'Gaz ver' },
  { value: 'roast', label: 'Laf sok' },
];
const DURATIONS = [
  { value: '7', label: '7 gün' },
  { value: '10', label: '10 gün' },
  { value: '30', label: '30 gün' },
];
const CATEGORIES = ['Tümü', 'Detoks', 'Sosyal cesaret', 'Spor'];

export default function ComponentsScreen() {
  const { colors, scheme } = useTheme();
  const toast = useToast();
  const [tone, setTone] = useState<Tone>('roast');
  const [toneLg, setToneLg] = useState<Tone>('hype');
  const [duration, setDuration] = useState('10');
  const [category, setCategory] = useState('Tümü');
  const [toggle, setToggle] = useState(true);
  const [radio, setRadio] = useState(true);
  const [checked, setChecked] = useState(true);
  const roastColor = socialColors[scheme].roastText;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Bileşenler' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.body, { color: colors.textBody }]}>
          Butonlar tok ve dokunulası: altlarında 4 px&apos;lik gölge var. Dokunma alanı en az 44 px.
        </Text>

        <Panel title="Butonlar">
          <Button title="Ana buton" onPress={noop} />
          <Button title="İkincil buton" variant="secondary" onPress={noop} />
          <View style={styles.grid}>
            <Button title="Dürt" variant="orange" size="md" onPress={noop} style={styles.half} />
            <Button title="Sil" variant="danger" size="md" onPress={noop} style={styles.half} />
            <Button title="Metin buton" variant="text" size="md" onPress={noop} style={styles.half} />
            <Button title="Pasif" size="md" disabled onPress={noop} style={styles.half} />
          </View>
          <Caption>lg 56 · ikon · yükleniyor · gece moru</Caption>
          <Button
            title="Ece'yi dürt"
            variant="orange"
            icon={(c) => <HandIcon color={c} {...icon20} />}
            onPress={noop}
          />
          <Button title="Kaydet" loading onPress={noop} />
          <Button title="Şikayeti gönder" variant="ink" onPress={noop} />
          <Button title="Pasif ana buton" disabled onPress={noop} />
          <Caption>sm 36 hap · metin buton 48</Caption>
          <View style={styles.row}>
            <Button title="Dürt" variant="orange" size="sm" onPress={noop} />
            <Button title="Kabul et" size="sm" onPress={noop} />
            <Button title="Dürt" variant="orange" size="sm" disabled onPress={noop} />
          </View>
          <Button title="Şimdilik atla" variant="text" onPress={noop} />
        </Panel>

        <Swatch bg={celebrationColors.bg}>
          <Button title="Süper" variant="onGreen" onPress={noop} />
          <Button title="Ece ve Selin'i gazla" variant="text" color={celebrationColors.linkText} onPress={noop} />
        </Swatch>

        <Swatch bg={palette.darkBackground}>
          <View style={styles.row}>
            <Button title="Tekrar çek" variant="ink" scheme="dark" onPress={noop} style={styles.half} />
            <Button
              title="Gönder"
              scheme="dark"
              icon={(c) => <SendIcon color={c} {...icon20} />}
              onPress={noop}
              style={styles.half}
            />
          </View>
        </Swatch>

        <Panel title="İkon butonu">
          <View style={styles.row}>
            <IconButton icon="back" accessibilityLabel="Geri" onPress={noop} />
            <IconButton icon="close" accessibilityLabel="Kapat" onPress={noop} />
            <IconButton icon="options" accessibilityLabel="Seçenekler" onPress={noop} />
            <IconButton icon={BellIcon} accessibilityLabel="Aktivite" onPress={noop} />
            <IconButton icon={AddIcon} tone="ink" accessibilityLabel="Arkadaş ekle" onPress={noop} />
          </View>
        </Panel>
        <View style={styles.row}>
          <Swatch bg={challengeTints.butter[scheme].bg} style={styles.half}>
            <View style={styles.row}>
              <IconButton icon="back" tone="onColor" accessibilityLabel="Geri" onPress={noop} />
              <IconButton icon={ShareIcon} tone="onColor" accessibilityLabel="Paylaş" onPress={noop} />
            </View>
          </Swatch>
          <Swatch bg={palette.darkBackground}>
            <IconButton icon="close" tone="onDark" accessibilityLabel="Kapat" onPress={noop} />
          </Swatch>
          <Swatch bg={celebrationColors.bg}>
            <IconButton icon="close" tone="onBrand" accessibilityLabel="Kapat" onPress={noop} />
          </Swatch>
        </View>

        <Panel title="Onboarding başlığı">
          <OnboardingHeader step={1} onBack={noop} />
          <OnboardingHeader step={2} half onBack={noop} />
          <OnboardingHeader step={2} onBack={noop} />
          <OnboardingHeader step={3} onBack={noop} />
          <OnboardingHeader step={3} />
        </Panel>
        <Swatch bg={onboardingColors[scheme].permissionBg} bordered>
          <OnboardingHeader step={4} tone="permission" onBack={noop} />
        </Swatch>

        {/* Seçim kutusu ekranlarda zeminin üstünde durur (Poke, ChallengePreview, Settings) */}
        <Swatch bg={colors.background} bordered>
          <Caption>Seçim kutusu · md 42 · lg 44 · tek seçim</Caption>
          <Segmented
            options={TONES}
            value={tone}
            onChange={setTone}
            selectedColor={(v) => (v === 'roast' ? roastColor : colors.actionText)}
          />
          <Segmented
            size="lg"
            options={TONES}
            value={toneLg}
            onChange={setToneLg}
            selectedColor={(v) => (v === 'roast' ? roastColor : colors.actionText)}
          />
          <Segmented role="radio" accessibilityLabel="Süre" options={DURATIONS} value={duration} onChange={setDuration} />
        </Swatch>
        <Panel title="Seçim">
          <View style={styles.row}>
            <Chip label="Seçili" selected />
            <Chip label="Çip" />
            <Chip label="Durum" status />
          </View>
          <View style={styles.row}>
            {CATEGORIES.map((label) => (
              <Chip
                key={label}
                size="lg"
                label={label}
                selected={label === category}
                onPress={() => setCategory(label)}
              />
            ))}
          </View>
          <View style={[styles.row, styles.controls]}>
            <Toggle value={toggle} onChange={setToggle} accessibilityLabel="Anahtar" />
            <Toggle value={!toggle} onChange={(v) => setToggle(!v)} accessibilityLabel="Anahtar (ters)" />
            <Pressed onPress={() => setRadio(!radio)}>
              <Radio selected={radio} />
            </Pressed>
            <Pressed onPress={() => setRadio(!radio)}>
              <Radio selected={!radio} />
            </Pressed>
            <Pressed onPress={() => setChecked(!checked)}>
              <Checkbox checked={checked} />
            </Pressed>
            <Pressed onPress={() => setChecked(!checked)}>
              <Checkbox checked={!checked} />
            </Pressed>
          </View>
        </Panel>

        <Panel title="Bölüm etiketi">
          <SectionLabel count={1}>İstekler</SectionLabel>
          <SectionLabel tone="orange" count={2}>
            Bugün bekleyenler
          </SectionLabel>
          <SectionLabel tone="green" count={2}>
            Bugünü tamamlayanlar
          </SectionLabel>
        </Panel>

        <Panel title="Geri bildirim">
          <Toast kind="offline" message="Çevrimdışısın. İşaretlemen kaydedildi, bağlanınca gönderilir." />
          <Toast message="Ece'ye laf sokuldu" action={{ label: 'Geri al', onPress: noop }} />
          <Toast kind="info" message="Kaydedildi" />
          <Caption>useToast + ToastHost (ekran altı)</Caption>
          <View style={styles.row}>
            <Button title="Bilgi" size="sm" variant="ink" onPress={() => toast.show({ message: 'Kaydedildi' })} />
            <Button
              title="Geri al"
              size="sm"
              onPress={() =>
                toast.show({ message: "Ece'ye laf sokuldu", action: { label: 'Geri al', onPress: noop } })
              }
            />
            <Button
              title="Çevrimdışı"
              size="sm"
              variant="orange"
              onPress={() =>
                toast.show({
                  kind: 'offline',
                  message: 'Çevrimdışısın. İşaretlemen kaydedildi, bağlanınca gönderilir.',
                })
              }
            />
          </View>
        </Panel>

        {/* KARTLAR */}
        <Panel title="Kategori karosu">
          <View style={styles.row}>
            <CategoryTile category="detox" icon="phoneOff" />
            <CategoryTile category="social_courage" icon="chatHeart" />
            <CategoryTile category="sport" icon="timer" />
            <CategoryTile category="food_drink" icon="coffee" />
            <CategoryTile category="reading" icon="book" />
            <CategoryTile category="money" icon="wallet" />
            <CategoryTile category="quirky" icon="toothbrush" />
            <CategoryTile category={null} icon="check" />
          </View>
          <Caption>detoks · sosyal · spor · yeme · okuma · para · tuhaf · özel</Caption>
          <View style={styles.row}>
            <CategoryTile category="detox" icon="phoneOff" size={36} />
            <CategoryTile category="detox" icon="phoneOff" size={42} />
            <CategoryTile category="detox" icon="phoneOff" size={44} />
            <CategoryTile category="food_drink" icon="coffee" size={52} />
            <CategoryTile category="detox" icon="phoneOff" size={56} />
          </View>
          <Caption>36 · 42 · 44 · 52 · 56</Caption>
        </Panel>

        <Swatch bg={colors.background} bordered>
          <SectionLabel>Görev kartı</SectionLabel>
          <TaskCard
            task={{ title: 'Uyanınca 1 saat telefonsuz', meta: 'Gün 12/30 · Grup 4 kişi', progress: 0.4, taskType: 'check', done: true, icon: 'phoneOff', category: 'detox' }}
            onPressBody={noop}
            onPressAction={noop}
          />
          <TaskCard
            task={{ title: 'Uyanınca 1 saat telefonsuz', meta: 'Gün 12/30 · Grup 4 kişi', progress: 0.4, taskType: 'check', done: false, icon: 'phoneOff', category: 'detox' }}
            onPressBody={noop}
            onPressAction={noop}
          />
          <TaskCard
            task={{ title: 'Her gün 20 sayfa oku', meta: 'Gün 4/30 · Fotoğraf kanıtı', progress: 0.13, taskType: 'photo', done: false, icon: 'book', category: 'reading' }}
            onPressBody={noop}
            onPressAction={noop}
          />
          <TaskCard
            task={{ title: 'Plank: her gün +5 saniye, uzun başlık kesilir', meta: 'Gün 3/10 · Bugün 70 sn', progress: 0.3, taskType: 'number', done: false, icon: 'timer', category: 'sport' }}
            onPressBody={noop}
            onPressAction={noop}
          />
          <Caption>yapıldı · işaretle · fotoğraf · sayı</Caption>
        </Swatch>

        <Panel title="Avatar">
          <View style={styles.row}>
            <Avatar name="Mert" tint="peach" size={54} ring="done" badge />
            <Avatar name="Ece" tint="lavender" size={54} ring="pending" />
            <Avatar name="Selin" tint="butter" size={54} ring="invite" />
            <AddAvatar />
            <Avatar name="Ece" tint="lavender" size={48} ring="pending" />
            <Avatar name="Ece" tint="lavender" size={40} ring="pending" />
            <Avatar name="Can" tint="mint" size={40} badge />
          </View>
          <Caption>yaptı + tik · bekliyor · davetli · davet et · 48 · 40</Caption>
          <View style={styles.row}>
            {[26, 30, 36, 40, 44, 52, 56, 72, 84, 88].map((s) => (
              <Avatar key={s} name="Deniz" tint="peach" size={s} />
            ))}
          </View>
          <Caption>26 · 30 · 36 · 40 · 44 · 52 · 56 · 72 · 84 · 88</Caption>
          <View style={styles.row}>
            <AvatarStack
              people={[
                { name: 'Mert', tint: 'peach' },
                { name: 'Can', tint: 'mint' },
                { name: 'Selin', tint: 'butter' },
              ]}
              size={30}
              outlineColor={colors.surface}
            />
            <AvatarStack
              people={[
                { name: 'Mert', tint: 'peach' },
                { name: 'Ece', tint: 'lavender' },
              ]}
              size={28}
              total={7}
              outlineColor={colors.surface}
            />
            <AvatarStack
              people={[
                { name: 'Mert', tint: 'peach' },
                { name: 'Can', tint: 'mint' },
                { name: 'Ece', tint: 'lavender' },
                { name: 'Selin', tint: 'butter' },
              ]}
              size={26}
              max={2}
              outlineColor={colors.surface}
            />
          </View>
          <Caption>yüz yığını · 30 · 28 + toplam · 26 + en çok 2</Caption>
        </Panel>

        <Swatch bg={colors.background} bordered>
          <SectionLabel>Arkadaş satırı</SectionLabel>
          <FriendList>
            <FriendRow
              person={{ displayName: 'Kerem', avatarTint: 'lavender' }}
              sub="@kerem.a · 3 ortak"
              action={{ type: 'request', onAccept: noop, onDismiss: noop }}
              divider
            />
            <FriendRow
              person={{ displayName: 'Ece', avatarTint: 'lavender' }}
              status="pending"
              sub="11 gün seri · telefonsuz sabah"
              onPress={noop}
              action={{ type: 'poke', onPress: noop }}
              divider
            />
            <FriendRow
              person={{ displayName: 'Mert', avatarTint: 'peach' }}
              status="done"
              sub="12 gün seri · 2 challenge"
              onPress={noop}
              action={{ type: 'hype', onPress: noop }}
              divider
            />
            <FriendRow
              person={{ displayName: 'Selin', avatarTint: 'butter' }}
              sub="@selin"
              action={{ type: 'add', onPress: noop }}
              divider
            />
            <FriendRow person={{ displayName: 'Can', avatarTint: 'mint' }} sub="@can" action={{ type: 'sent' }} />
          </FriendList>
          <SectionLabel>Arkadaş şeridi</SectionLabel>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <FriendBubble person={{ displayName: 'Mert', avatarTint: 'peach' }} done />
            <FriendBubble person={{ displayName: 'Ece', avatarTint: 'lavender' }} done={false} onPoke={noop} />
            <FriendBubble person={{ displayName: 'Can', avatarTint: 'mint' }} done />
            <FriendBubble person={{ displayName: 'Selin', avatarTint: 'butter' }} done={false} onPoke={noop} />
            <InviteBubble onPress={noop} />
          </View>
        </Swatch>

        <Panel title="İlerleme çubuğu">
          <ProgressBar value={0.13} />
          <ProgressBar value={0.4} />
          <ProgressBar value={1} />
          <ProgressBar value={0.6} color={colors.action} height={8} />
          <Caption>6 px · köşe 3 · renk ve yükseklik ayarlanabilir</Caption>
        </Panel>

        <Swatch bg={colors.actionTint}>
          <SectionLabel>Seri ve su</SectionLabel>
          <View style={styles.row}>
            <StreakChip days={12} />
            <DropMeter filled={1} total={3} showLabel />
          </View>
          <View style={styles.row}>
            <DropMeter filled={2} total={3} size="small" />
            <DropMeter filled={3} total={3} size="small" />
          </View>
        </Swatch>

        {/* SAYFA VE BALON */}
      </ScrollView>
      <ToastHost toast={toast} />
    </View>
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

/** Renkli zemin örneği (kutlama yeşili, koyu ekran, renkli hero, izin ekranı) */
function Swatch({
  bg,
  bordered,
  style,
  children,
}: {
  bg: string;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.swatch,
        { backgroundColor: bg },
        bordered && { borderWidth: borderWidth.thin, borderColor: colors.border },
        style,
      ]}>
      {children}
    </View>
  );
}

function Caption({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[typography.meta, { color: colors.textSecondary }]}>{children}</Text>;
}

/** Radio ve Checkbox yalnızca görünüm; dokunma alanı 44 */
function Pressed({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.pressed}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: layout.screenPadding,
    paddingBottom: layout.screenPadding * 4,
    gap: spacing.md,
  },
  panel: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
  },
  swatch: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.card,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  half: {
    flexGrow: 1,
    flexBasis: '40%',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  controls: {
    gap: spacing.sm,
  },
  pressed: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
