import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

import { inviteLink } from '@/config/links';
import { ApiError, useCreateInviteCodeMutation } from '@/data';

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

  // https://<alan>/d/<kod> (src/config/links.ts); açan kişi InviteLanding'e düşer
  return { code, url: code ? inviteLink(code) : null, error, retry: load };
}

export type InviteCode = ReturnType<typeof useInviteCode>;

/**
 * Panoya kopyalar (expo-clipboard; web'de tarayıcı panosu); başarılıysa true. Web'de tarayıcı izin vermezse false.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
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
