import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

import { ApiError, useCreateInviteCodeMutation } from '@/data';

/** Davet linki: gazla://invite/KOD (web'de site adresi). Açan kişi InviteLanding'e düşer. */
export const inviteUrl = (code: string) => Linking.createURL(`invite/${code}`);

/** Paylaşılan metin */
export const inviteMessage = (title: string, url: string) =>
  `Gazla'da "${title}" challenge'ına katıl, birlikte gazlayalım: ${url}`;

/**
 * Challenge'ın davet kodu (create_invite). Aynı kişi için sunucu aynı kodu döner; ekran açılınca
 * bir kez istenir, hatada yeniden denenir.
 */
export function useInviteCode(challengeId: string | null) {
  const { mutateAsync } = useCreateInviteCodeMutation();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  const load = useCallback(() => {
    if (!challengeId) return;
    requested.current = challengeId;
    setError(null);
    mutateAsync(challengeId)
      .then((c) => requested.current === challengeId && setCode(c))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'Davet linki şu an oluşturulamadı.'));
  }, [challengeId, mutateAsync]);

  useEffect(() => {
    if (challengeId && requested.current !== challengeId) {
      setCode(null);
      load();
    }
  }, [challengeId, load]);

  return { code, url: code ? inviteUrl(code) : null, error, retry: load };
}

type ClipboardLike = { writeText: (text: string) => Promise<void> };

/**
 * Panoya kopyalar; başarılıysa true. Yerel panoya erişim paketi (expo-clipboard) kurulu değil:
 * web'de tarayıcı panosu, telefonda paylaşım sayfası açılır (orada "Kopyala" seçeneği var).
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = (globalThis as { navigator?: { clipboard?: ClipboardLike } }).navigator?.clipboard;
  if (Platform.OS === 'web' && clipboard) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // izin yoksa paylaşım sayfasına düş
    }
  }
  await shareText(text);
  return false;
}

/** Sistem paylaşım sayfası */
export async function shareText(message: string) {
  try {
    await Share.share({ message });
  } catch {
    // kullanıcı kapattı ya da platform desteklemiyor
  }
}

/** Mesaj uygulamasını metinle açar; açılamazsa paylaşım sayfası */
export async function sendAsMessage(message: string) {
  const body = encodeURIComponent(message);
  const url = Platform.OS === 'ios' ? `sms:&body=${body}` : `sms:?body=${body}`;
  try {
    if (Platform.OS !== 'web') {
      await Linking.openURL(url);
      return;
    }
  } catch {
    // paylaşım sayfasına düş
  }
  await shareText(message);
}
