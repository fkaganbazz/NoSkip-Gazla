import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraIcon, ChevronRightIcon, LockIcon, SendIcon } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, TextField } from '@/components/ui';
import { useCheckinMutation, useToday } from '@/data';
import GroupSheet from '@/features/checkin/GroupSheet';
import { formatClock } from '@/features/checkin/logic';
import { componentMetrics, layout, radius, typography } from '@/theme';
import { photoProofColors as c, photoProofMetrics as m, photoProofTypography as t } from '@/theme/checkin';

type Picked = { uri: string; fromCamera: boolean; takenAt: Date };
type CameraBlock = null | 'denied' | 'blocked';

// Web'de kamera yok: yalnızca galeriden seçilir.
const CAN_USE_CAMERA = Platform.OS !== 'web';

// Fotoğraf kanıtı — design/PhotoProof.dc.html (yalnızca koyu çizilmiş; açık modda da koyu).
// Seçilen dosya useCheckinMutation'a verilir; veri katmanı önce Storage'a yükler, sonra checkin çağırır.
export default function PhotoProofScreen() {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const router = useRouter();
  const today = useToday();
  const checkin = useCheckinMutation();

  const task = useMemo(
    () => today.data?.find((x) => x.challengeId === id && (!date || x.localDate === date)),
    [today.data, id, date],
  );
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [note, setNote] = useState('');
  const [cameraBlock, setCameraBlock] = useState<CameraBlock>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);

  const takePhoto = async () => {
    setPickError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setCameraBlock(permission.canAskAgain ? 'denied' : 'blocked');
        return;
      }
      setCameraBlock(null);
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: m.pickQuality });
      if (!result.canceled && result.assets[0]) {
        setPhoto({ uri: result.assets[0].uri, fromCamera: true, takenAt: new Date() });
      }
    } catch {
      setPickError('Kamera açılamadı. Galeriden seçebilirsin.');
    }
  };

  const pickFromLibrary = async () => {
    setPickError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: m.pickQuality });
      if (!result.canceled && result.assets[0]) {
        setPhoto({ uri: result.assets[0].uri, fromCamera: false, takenAt: new Date() });
      }
    } catch {
      setPickError('Galeri açılamadı. Tekrar dene.');
    }
  };

  const primaryPick = CAN_USE_CAMERA ? takePhoto : pickFromLibrary;

  const send = () => {
    if (!task || !photo) return;
    checkin.mutate(
      { challengeId: task.challengeId, localDate: task.localDate, photoFileUri: photo.uri, note: note.trim() || undefined },
      { onSuccess: () => router.back() },
    );
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Ekran iki modda koyu: ortak durumlar koyu temayla (scheme="dark")
  if (today.isPending || !task) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        {today.isPending ? (
          <LoadingState scheme="dark" />
        ) : today.isError ? (
          <ErrorState scheme="dark" onRetry={() => today.refetch()} />
        ) : (
          <ErrorState scheme="dark" message="Bu görev bugün işaretlenemiyor." actionLabel="Kapat" onRetry={close} />
        )}
      </SafeAreaView>
    );
  }

  const leftTitle = photo
    ? photo.fromCamera
      ? 'Tekrar çek'
      : 'Başka seç'
    : CAN_USE_CAMERA
      ? 'Galeriden seç'
      : 'Fotoğraf seç';
  const leftAction = photo ? (photo.fromCamera ? takePhoto : pickFromLibrary) : pickFromLibrary;
  const error = pickError ?? (checkin.isError ? checkin.error.message : null);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <IconButton icon="close" tone="onDark" accessibilityLabel="Kapat" onPress={close} />
            <View style={styles.headerTexts}>
              <Text accessibilityRole="header" numberOfLines={1} style={[t.title, { color: c.text }]}>
                {task.title}
              </Text>
              <Text style={[typography.meta, { color: c.textSecondary }]}>{`${task.dayIndex}. gün · Fotoğraf kanıtı`}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {photo ? (
            <View style={[styles.frame, { backgroundColor: c.frameBg }]}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photo}
                resizeMode="cover"
                accessible
                accessibilityLabel="Seçtiğin fotoğraf"
              />
              {photo.fromCamera && (
                <View style={[styles.stamp, { backgroundColor: c.stampBg }]}>
                  <Text style={[t.stamp, { color: c.text }]}>{`Bugün · ${formatClock(photo.takenAt)}`}</Text>
                </View>
              )}
            </View>
          ) : (
            <Pressable
              onPress={primaryPick}
              accessibilityRole="button"
              accessibilityLabel={CAN_USE_CAMERA ? 'Fotoğraf çek' : 'Fotoğraf seç'}
              style={[styles.frame, styles.emptyFrame, { backgroundColor: c.emptyFrameBg, borderColor: c.emptyFrameBorder }]}>
              <CameraIcon color={c.textSecondary} size={m.emptyIconSize} strokeWidth={m.emptyIconStrokeWidth} />
              <Text style={[t.emptyLabel, { color: c.text }]}>{CAN_USE_CAMERA ? 'Fotoğraf çek' : 'Fotoğraf seç'}</Text>
              {cameraBlock && (
                <Text style={[t.row, styles.centerText, { color: c.textSecondary }]}>
                  {cameraBlock === 'blocked'
                    ? 'Kamera izni kapalı. Ayarlar’dan açabilir ya da galeriden seçebilirsin.'
                    : 'Fotoğraf çekmek için kamera izni gerekiyor. Galeriden de seçebilirsin.'}
                </Text>
              )}
              {cameraBlock === 'blocked' && (
                <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8} style={styles.link}>
                  <Text style={[t.rowStrong, { color: c.action }]}>Ayarları aç</Text>
                </Pressable>
              )}
            </Pressable>
          )}

          <TextField
            scheme="dark"
            size="sm"
            label="Not ekle (isteğe bağlı)"
            value={note}
            onChangeText={setNote}
            maxLength={m.noteMaxLength}
            returnKeyType="done"
            style={styles.field}
          />

          {/* Fotoğraf grubun tüm üyelerine görünür; ayrı bir görünürlük ayarı yok. Dokununca üyeler (alt sayfa). */}
          <Pressable
            onPress={() => setGroupOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Kimler görecek: Grup, ${task.memberCount} kişi`}
            accessibilityHint="Grubun üyelerini gösterir"
            style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.rowPressedBg : c.rowBg }]}>
            <LockIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />
            <Text style={[t.row, styles.rowText, { color: c.text }]}>
              {'Kimler görecek: '}
              <Text style={t.rowStrong}>{`Grup (${task.memberCount} kişi)`}</Text>
            </Text>
            <ChevronRightIcon color={c.rowIcon} size={m.chevronSize} strokeWidth={m.chevronStrokeWidth} />
          </Pressable>

          <View style={styles.footer}>
            {error && (
              <Text accessibilityLiveRegion="polite" style={[t.row, styles.centerText, { color: c.error }]}>
                {error}
              </Text>
            )}
            {/* Ekran iki modda koyu: butonlar koyu temayla (scheme="dark"); tasarımda 56 yükseklik, 16 yazı */}
            <View style={styles.buttons}>
              <Button scheme="dark" variant="onDark" size="md" title={leftTitle} onPress={leftAction} style={styles.button} />
              <Button
                scheme="dark"
                size="md"
                title="Gönder"
                onPress={send}
                disabled={!photo}
                loading={checkin.isPending}
                icon={(color) => (
                  <SendIcon color={color} size={componentMetrics.buttonIconSize} strokeWidth={componentMetrics.buttonIconStroke} />
                )}
                style={styles.button}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <GroupSheet visible={groupOpen} challengeId={task.challengeId} onClose={() => setGroupOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: m.paddingBottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headerGap,
  },
  headerTexts: {
    flex: 1,
    alignItems: 'center',
  },
  // Başlık ortada kalsın diye kapat butonu genişliğinde boşluk
  headerSpacer: {
    width: componentMetrics.iconButton,
  },
  frame: {
    marginTop: m.frameMarginTop,
    height: m.frameHeight,
    borderRadius: m.frameRadius,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  stamp: {
    position: 'absolute',
    left: m.stampInset,
    top: m.stampInset,
    paddingVertical: m.stampPaddingY,
    paddingHorizontal: m.stampPaddingX,
    borderRadius: radius.full,
  },
  emptyFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.emptyGap,
    paddingHorizontal: layout.screenPadding,
    borderWidth: m.emptyBorder,
    borderStyle: 'dashed',
  },
  link: {
    minHeight: layout.minTouchTarget,
    justifyContent: 'center',
  },
  field: {
    marginTop: m.fieldMarginTop,
  },
  row: {
    marginTop: m.rowMarginTop,
    minHeight: m.rowMinHeight,
    paddingHorizontal: m.rowPaddingX,
    borderRadius: m.rowRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  rowText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.buttonsMarginTop,
    gap: m.emptyGap,
  },
  buttons: {
    flexDirection: 'row',
    gap: m.buttonsGap,
  },
  button: {
    flex: 1,
    height: m.buttonHeight,
  },
});
