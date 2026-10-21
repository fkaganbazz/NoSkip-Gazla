/**
 * Oturumsuz açılan davet linki (InviteLanding "Katıl ve başla", docs/EKRANLAR.md 3.6): kod cihazda
 * saklanır, giriş + onboarding bitince ekran `takePendingInvite()` ile alır ve
 * `useJoinByInviteMutation()` ile katılımı tamamlar. Okununca silinir (iki kez katılma denenmez).
 *
 *   // InviteLanding, oturum yok:   await savePendingInvite(code); router.push('/sign-in')
 *   // onboarding bitti:            const code = await takePendingInvite(); if (code) join.mutate(code)
 *
 * Eski bir kod sonsuza kadar beklemesin diye 7 gün sonra yok sayılır.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'gazla.pendingInvite';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Davet kodu biçimi (challenge_invites.code) */
const CODE = /^[A-Za-z0-9]{10}$/;

type Stored = { code: string; savedAt: number };

/** Kodu sakla (öncekinin yerine geçer). Geçersiz biçimli kod saklanmaz. */
export async function savePendingInvite(code: string): Promise<void> {
  const trimmed = code.trim();
  if (!CODE.test(trimmed)) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ code: trimmed, savedAt: Date.now() } satisfies Stored));
  } catch {
    // Saklanamazsa kullanıcı linki yeniden açar; akış durmaz
  }
}

/** Bekleyen kodu okumadan bak (silmez) */
export async function peekPendingInvite(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (!CODE.test(stored.code) || Date.now() - stored.savedAt > MAX_AGE_MS) return null;
    return stored.code;
  } catch {
    return null;
  }
}

/** Bekleyen kodu al ve sil; yoksa (ya da 7 günden eskiyse) null */
export async function takePendingInvite(): Promise<string | null> {
  const code = await peekPendingInvite();
  await clearPendingInvite();
  return code;
}

export async function clearPendingInvite(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // yok say
  }
}
