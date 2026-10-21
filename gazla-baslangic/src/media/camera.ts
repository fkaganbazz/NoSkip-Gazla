/**
 * Kamera erişimi (expo-camera): cihazda kamera var mı, izin durumu, izni isteme.
 *
 * Akış: izin hiç istenmediyse ekran açılınca bir kez istenir; reddedilip yeniden sorulabiliyorsa
 * ("denied") ekran tekrar istemeyi önerir; sorulamıyorsa ("blocked") Ayarlar bağlantısı gösterilir.
 * Her durumda galeriden seçme açık kalır.
 *
 * Web: expo-camera tarayıcı kamerasını (getUserMedia) kullanır. Kamera yoksa ya da tarayıcı
 * desteklemiyorsa "unavailable" (ekran yalnızca galeriden seçer). Tarayıcıda reddedilen izin
 * uygulamadan yeniden sorulamaz: "blocked" (Ayarlar bağlantısı yok, ekran tarayıcı ayarlarını söyler).
 */
import { Camera, CameraView, PermissionStatus, type PermissionResponse } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

export type CameraAccessState = 'checking' | 'unavailable' | 'prompt' | 'denied' | 'blocked' | 'granted';

type PermissionLike = Pick<PermissionResponse, 'status' | 'granted' | 'canAskAgain'>;

/** Kamera var mı + izin yanıtı → ekranın göstereceği durum (saf; birim testli) */
export function cameraAccessState(
  available: boolean | null,
  permission: PermissionLike | null,
  platform: string = Platform.OS,
): CameraAccessState {
  if (available === null) return 'checking';
  if (!available) return 'unavailable';
  if (!permission) return 'checking';
  if (permission.granted) return 'granted';
  if (permission.status === PermissionStatus.UNDETERMINED) return 'prompt';
  // Tarayıcı reddedilen izni yeniden sormaz (canAskAgain her zaman true döner)
  if (platform === 'web') return 'blocked';
  return permission.canAskAgain ? 'denied' : 'blocked';
}

async function isCameraAvailable(): Promise<boolean> {
  // Native'de her telefonda kamera var (simülatörde CameraView onMountError verir)
  if (Platform.OS !== 'web') return true;
  try {
    return await CameraView.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Kamera durumu ve izin isteme. `autoRequest`: izin hiç istenmediyse bir kez kendiliğinden ister
 * (ekran açılır açılmaz kamera görünsün); o istek bitene kadar durum "checking" görünür. İzin
 * Ayarlar'dan değiştirilip uygulamaya dönülünce durum yeniden okunur.
 */
export function useCameraAccess({ autoRequest = true }: { autoRequest?: boolean } = {}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<PermissionLike | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [autoAsked, setAutoAsked] = useState(false);
  const alive = useRef(true);

  const readPermission = useCallback(async () => {
    try {
      const current = await Camera.getCameraPermissionsAsync();
      if (alive.current) setPermission(current);
    } catch {
      // Durum okunamadı (eski tarayıcı): sorulmamış say, istenince öğrenilir
      if (alive.current) setPermission({ status: PermissionStatus.UNDETERMINED, granted: false, canAskAgain: true });
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    (async () => {
      const ok = await isCameraAvailable();
      if (!alive.current) return;
      setAvailable(ok);
      if (ok) await readPermission();
    })();
    return () => {
      alive.current = false;
    };
  }, [readPermission]);

  // Ayarlar'dan dönünce (izin açılmış olabilir) yeniden oku
  useEffect(() => {
    if (!available) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') readPermission();
    });
    return () => sub.remove();
  }, [available, readPermission]);

  const request = useCallback(async () => {
    setRequesting(true);
    try {
      const next = await Camera.requestCameraPermissionsAsync();
      if (alive.current) setPermission(next);
    } catch {
      if (alive.current) setPermission({ status: PermissionStatus.DENIED, granted: false, canAskAgain: false });
    } finally {
      if (alive.current) setRequesting(false);
    }
  }, []);

  const state = cameraAccessState(available, permission);

  useEffect(() => {
    if (autoRequest && state === 'prompt' && !autoAsked) {
      setAutoAsked(true);
      request();
    }
  }, [autoRequest, state, autoAsked, request]);

  return {
    state: autoRequest && state === 'prompt' && !autoAsked ? ('checking' as const) : state,
    requesting,
    request,
  };
}
