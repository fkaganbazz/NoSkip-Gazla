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
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraIcon, ChevronRightIcon, LockIcon, SendIcon } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, TextField } from '@/components/ui';
import { useCheckinMutation, useToday, useUndoCheckinMutation } from '@/data';
import CameraPane from '@/features/checkin/CameraPane';
import GroupSheet from '@/features/checkin/GroupSheet';
import { formatClock } from '@/features/checkin/logic';
import { useCameraAccess, type CameraAccessState } from '@/media/camera';
import { compressImage } from '@/media/compressImage';
import { componentMetrics, layout, radius, typography } from '@/theme';
import { photoProofColors as c, photoProofMetrics as m, photoProofTypography as t } from '@/theme/checkin';

type Picked = { uri: string; fromCamera: boolean; takenAt: Date };

const IS_WEB = Platform.OS === 'web';

// Fotoğraf kanıtı — design/PhotoProof.dc.html (yalnızca koyu çizilmiş; açık modda da koyu).
// Önce canlı kamera (expo-camera; çerçevenin içinde deklanşör ve ön/arka geçiş), çekimden sonra tasarımdaki
// önizleme: foto, "Bugün · SS:DD", not, "Kimler görecek", "Tekrar çek" ve "Gönder". Kamera izni istenmediyse
// ekran açılınca istenir; reddedildiyse yeniden isteme ya da Ayarlar bağlantısı; galeriden seçme her zaman açık.
// Kamera yoksa (web'de kamera bulunamadı, simülatör) yalnızca galeri.
// Gönder: görsel küçültülür (uzun kenar 1080, JPEG %80) ve useCheckinMutation'a verilir; veri katmanı önce
// Storage'a yükler, sonra checkin çağırır (çevrimdışıysa dosyayı kuyruğa kopyalar). Küçültme + yükleme
// boyunca buton yükleniyor.
// Gün zaten gönderildiyse çerçevede gönderilen fotoğraf durur ("Tekrar çek" kamerayı açar, "Gönder" değiştirir);
// altta "Bugünü geri al" (tasarımda yok) kaydı siler (Bugün'deki sağ buton fotoğraf tipinde bu ekranı açar).
export default function PhotoProofScreen() {
  // /checkin/photo?challengeId=…&date=YYYY-AA-GG (date: işaretlenecek yerel gün; yoksa my_today'deki ilk satırı)
  const { challengeId, date } = useLocalSearchParams<{ challengeId: string; date?: string }>();
  const router = useRouter();
  const today = useToday();
  const checkin = useCheckinMutation();
  const undo = useUndoCheckinMutation();
  const camera = useCameraAccess();

  const task = useMemo(
    () => today.data?.find((x) => x.challengeId === challengeId && (!date || x.localDate === date)),
    [today.data, challengeId, date],
  );
  const [photo, setPhoto] = useState<Picked | null>(null);
  const [note, setNote] = useState('');
  // Gönderilmiş fotoğrafın yerine kamera açıldı mı
  const [retaking, setRetaking] = useState(false);
  // Kamera açılamadı (CameraView onMountError): galeriye düş
  const [cameraFailed, setCameraFailed] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const pickFromLibrary = async () => {
    setPickError(null);
    try {
      // Tam kalite; küçültme "Gönder"de
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
      if (!result.canceled && result.assets[0]) {
        setPhoto({ uri: result.assets[0].uri, fromCamera: false, takenAt: new Date() });
      }
    } catch {
      setPickError('Galeri açılamadı. Tekrar dene.');
    }
  };

  const send = async () => {
    if (!task || !photo || compressing) return;
    undo.reset();
    setPickError(null);
    setCompressing(true);
    let uri = photo.uri;
    try {
      uri = (await compressImage(photo.uri, { maxEdge: m.uploadMaxEdge, quality: m.uploadQuality })).uri;
    } catch {
      // Küçültülemedi (bozuk/desteklenmeyen dosya): özgün dosya gönderilir
    }
    setCompressing(false);
    checkin.mutate(
      { challengeId: task.challengeId, localDate: task.localDate, photoFileUri: uri, note: note.trim() || undefined },
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

  // Canlı kamera kullanılabilir mi (izin durumu ayrı: çerçeve izin akışını gösterir)
  const cameraCapable = camera.state !== 'unavailable' && !cameraFailed;
  // Bugün gönderilmiş kanıt (yeni fotoğraf çekilene/seçilene kadar çerçevede)
  const sentUri = !photo && !retaking && task.done ? task.photoUrl : null;
  const showCamera = !photo && !sentUri && cameraCapable;

  const retake = () => {
    setPickError(null);
    if (cameraCapable) {
      setPhoto(null);
      setRetaking(true);
    } else {
      pickFromLibrary();
    }
  };

  // Sol buton: önizlemede / gönderilmiş fotoğrafta "Tekrar çek" (kamera yoksa "Başka seç"), kamerada galeri
  const leftTitle =
    photo || sentUri ? (cameraCapable ? 'Tekrar çek' : 'Başka seç') : cameraCapable ? 'Galeriden seç' : 'Fotoğraf seç';
  const leftAction = photo || sentUri ? retake : pickFromLibrary;
  const sending = compressing || checkin.isPending;
  const error = pickError ?? checkin.error?.message ?? undo.error?.message ?? null;
  // Geri alma sürerken de görünür (iyimser güncelleme görevi hemen "yapılmadı" yapar)
  const canUndo = task.done || undo.isPending;
  const undoDay = () => {
    checkin.reset();
    setPickError(null);
    undo.mutate({ challengeId: task.challengeId, localDate: task.localDate }, { onSuccess: () => router.back() });
  };

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
                accessibilityLabel={photo.fromCamera ? 'Çektiğin fotoğraf' : 'Seçtiğin fotoğraf'}
              />
              {photo.fromCamera && (
                <View style={[styles.stamp, { backgroundColor: c.stampBg }]}>
                  <Text style={[t.stamp, { color: c.text }]}>{`Bugün · ${formatClock(photo.takenAt)}`}</Text>
                </View>
              )}
            </View>
          ) : sentUri ? (
            <Pressable
              onPress={retake}
              accessibilityRole="button"
              accessibilityLabel={`Bugün gönderdiğin fotoğraf. ${cameraCapable ? 'Yenisini çek' : 'Yenisini seç'}`}
              style={[styles.frame, { backgroundColor: c.frameBg }]}>
              <Image source={{ uri: sentUri }} style={styles.photo} resizeMode="cover" />
            </Pressable>
          ) : showCamera && camera.state === 'granted' ? (
            <CameraPane
              onCapture={(shot) => {
                setPickError(null);
                setPhoto({ uri: shot.uri, fromCamera: true, takenAt: new Date() });
              }}
              onMountError={() => {
                setCameraFailed(true);
                setPickError('Kamera açılamadı. Galeriden seçebilirsin.');
              }}
              onCaptureError={() => setPickError('Fotoğraf çekilemedi. Tekrar dene.')}
            />
          ) : showCamera ? (
            <PermissionFrame state={camera.state} requesting={camera.requesting} onRequest={camera.request} />
          ) : (
            <Pressable
              onPress={pickFromLibrary}
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf seç"
              style={[styles.frame, styles.emptyFrame, { backgroundColor: c.emptyFrameBg, borderColor: c.emptyFrameBorder }]}>
              <CameraIcon color={c.textSecondary} size={m.emptyIconSize} strokeWidth={m.emptyIconStrokeWidth} />
              <Text style={[t.emptyLabel, { color: c.text }]}>Fotoğraf seç</Text>
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
              <Button
                scheme="dark"
                variant="onDark"
                size="md"
                title={leftTitle}
                onPress={leftAction}
                disabled={sending}
                style={styles.button}
              />
              <Button
                scheme="dark"
                size="md"
                title="Gönder"
                onPress={send}
                disabled={!photo || undo.isPending}
                loading={sending}
                accessibilityLabel={sending ? 'Gönderiliyor' : 'Gönder'}
                icon={(color) => (
                  <SendIcon color={color} size={componentMetrics.buttonIconSize} strokeWidth={componentMetrics.buttonIconStroke} />
                )}
                style={styles.button}
              />
            </View>
            {canUndo && (
              <Button
                scheme="dark"
                variant="text"
                size="md"
                title="Bugünü geri al"
                onPress={undoDay}
                loading={undo.isPending}
                disabled={sending}
                accessibilityHint="Bugünkü fotoğraf kanıtı silinir, görev yapılmadı olur"
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <GroupSheet visible={groupOpen} challengeId={task.challengeId} onClose={() => setGroupOpen(false)} />
    </SafeAreaView>
  );
}

/**
 * Kamera izni çerçevesi: denetlenirken / istenirken (yükleniyor), sorulmadı ya da reddedildi (izin iste),
 * kalıcı reddedildi (Ayarlar; web'de tarayıcı ayarları). Galeri sol butonda her zaman açık.
 */
function PermissionFrame({
  state,
  requesting,
  onRequest,
}: {
  state: CameraAccessState;
  requesting: boolean;
  onRequest: () => void;
}) {
  if (state === 'checking' || requesting) {
    return (
      <View
        accessible
        accessibilityLabel="Kamera hazırlanıyor"
        style={[styles.frame, styles.emptyFrame, { backgroundColor: c.emptyFrameBg, borderColor: c.emptyFrameBorder }]}>
        <ActivityIndicator color={c.text} />
      </View>
    );
  }

  const blocked = state === 'blocked';
  const canOpenSettings = blocked && !IS_WEB;
  const message = blocked
    ? IS_WEB
      ? 'Kamera izni kapalı. Tarayıcı ayarlarından açabilir ya da galeriden seçebilirsin.'
      : 'Kamera izni kapalı. Ayarlar’dan açabilir ya da galeriden seçebilirsin.'
    : 'Fotoğraf çekmek için kamera izni gerekiyor. Galeriden de seçebilirsin.';
  const action = blocked ? (canOpenSettings ? 'Ayarları aç' : null) : 'İzin ver';
  const onPress = blocked ? (canOpenSettings ? () => Linking.openSettings() : undefined) : onRequest;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={action ? `${message} ${action}` : message}
      style={[styles.frame, styles.emptyFrame, { backgroundColor: c.emptyFrameBg, borderColor: c.emptyFrameBorder }]}>
      <CameraIcon color={c.textSecondary} size={m.emptyIconSize} strokeWidth={m.emptyIconStrokeWidth} />
      <Text style={[t.emptyLabel, { color: c.text }]}>Fotoğraf çek</Text>
      <Text style={[t.row, styles.centerText, { color: c.textSecondary }]}>{message}</Text>
      {action && (
        <View style={styles.link}>
          <Text style={[t.rowStrong, { color: c.action }]}>{action}</Text>
        </View>
      )}
    </Pressable>
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
