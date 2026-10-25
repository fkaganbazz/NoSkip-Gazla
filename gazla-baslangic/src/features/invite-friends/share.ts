import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';

import { ApiError, useInvite } from '@/data';
import { getT } from '@/i18n';

// Paylaşılan metin sözlükte: `invite.friends.shareMessage(başlık, link)`

/**
 * Challenge'ın davet linki (`useInvite().createLink`, create_invite). Aynı kişi için sunucu aynı kodu döner;
 * ekran açılınca bir kez istenir, hatada yeniden denenir.
 */
export function useInviteCode(challengeId: string | null) {
  const { createLink } = useInvite();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  const load = useCallback(() => {
    if (!challengeId) return;
    requested.current = challengeId;
    setError(null);
    createLink(challengeId)
      .then((link) => requested.current === challengeId && setUrl(link))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : getT().invite.friends.linkFailed));
  }, [challengeId, createLink]);

  useEffect(() => {
    if (challengeId && requested.current !== challengeId) {
      setUrl(null);
      load();
    }
  }, [challengeId, load]);

  // https://<alan>/d/<kod> (src/config/links.ts); açan kişi InviteLanding'e düşer
  return { url, error, retry: load };
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
