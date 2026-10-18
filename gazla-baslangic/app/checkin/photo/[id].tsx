import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraIcon, CloseIcon, LockIcon } from '@/components/icons';
import { useCheckinMutation, useToday } from '@/data';
import { SendIcon } from '@/features/checkin/icons';
import { formatClock } from '@/features/checkin/logic';
import PhotoButton from '@/features/checkin/PhotoButton';
import { iconMetrics, layout, radius, typography } from '@/theme';
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

  if (today.isPending || !task) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <StatusBar style="light" />
        {today.isPending ? (
          <ActivityIndicator color={c.sendBg} />
        ) : (
          <View style={styles.stateBox}>
            <Text style={[t.row, styles.centerText, { color: c.text }]}>
              {today.isError ? 'Şu an yüklenemedi. Bağlantını kontrol edip tekrar dene.' : 'Bu görev bugün işaretlenemiyor.'}
            </Text>
            <View style={styles.stateButton}>
              <PhotoButton
                variant="retake"
                title={today.isError ? 'Tekrar dene' : 'Kapat'}
                onPress={today.isError ? () => today.refetch() : close}
              />
            </View>
          </View>
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
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={[styles.close, { backgroundColor: c.closeBg }]}>
              <CloseIcon color={c.text} size={iconMetrics.closeSize} strokeWidth={iconMetrics.closeStrokeWidth} />
            </Pressable>
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
              <Text style={[t.button, { color: c.text }]}>{CAN_USE_CAMERA ? 'Fotoğraf çek' : 'Fotoğraf seç'}</Text>
              {cameraBlock && (
                <Text style={[t.row, styles.centerText, { color: c.textSecondary }]}>
                  {cameraBlock === 'blocked'
                    ? 'Kamera izni kapalı. Ayarlar’dan açabilir ya da galeriden seçebilirsin.'
                    : 'Fotoğraf çekmek için kamera izni gerekiyor. Galeriden de seçebilirsin.'}
                </Text>
              )}
              {cameraBlock === 'blocked' && (
                <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button" hitSlop={8} style={styles.link}>
                  <Text style={[t.rowStrong, { color: c.sendBg }]}>Ayarları aç</Text>
                </Pressable>
              )}
            </Pressable>
          )}

          <View style={styles.field}>
            <Text nativeID="photo-note" style={[t.label, { color: c.label }]}>
              Not ekle (isteğe bağlı)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              maxLength={m.noteMaxLength}
              accessibilityLabel="Not ekle (isteğe bağlı)"
              accessibilityLabelledBy="photo-note"
              placeholderTextColor={c.placeholder}
              returnKeyType="done"
              style={[styles.input, t.input, { color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder }]}
            />
          </View>

          {/* Fotoğraf grubun tüm üyelerine görünür; ayrı bir görünürlük ayarı yok (yalnızca bilgi). */}
          <View style={[styles.row, { backgroundColor: c.rowBg }]}>
            <LockIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />
            <Text style={[t.row, styles.rowText, { color: c.text }]}>
              {'Kimler görecek: '}
              <Text style={t.rowStrong}>{`Grup (${task.memberCount} kişi)`}</Text>
            </Text>
          </View>

          <View style={styles.footer}>
            {error && (
              <Text accessibilityLiveRegion="polite" style={[t.row, styles.centerText, { color: c.error }]}>
                {error}
              </Text>
            )}
            <View style={styles.buttons}>
              <PhotoButton variant="retake" title={leftTitle} onPress={leftAction} />
              <PhotoButton
                variant="send"
                title="Gönder"
                onPress={send}
                disabled={!photo}
                loading={checkin.isPending}
                icon={<SendIcon color={photo ? c.sendText : c.disabledText} size={m.sendIconSize} strokeWidth={m.sendIconStrokeWidth} />}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBox: {
    alignSelf: 'stretch',
    paddingHorizontal: layout.screenPadding,
    gap: m.emptyGap,
  },
  stateButton: {
    flexDirection: 'row',
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
  close: {
    width: m.closeSize,
    height: m.closeSize,
    borderRadius: m.closeSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: m.closeSize,
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
    gap: m.fieldGap,
  },
  input: {
    height: m.inputHeight,
    paddingHorizontal: m.inputPaddingX,
    borderRadius: m.inputRadius,
    borderWidth: m.inputBorder,
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
});
