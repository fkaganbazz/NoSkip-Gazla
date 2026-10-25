/**
 * Arkadaşlar davet kartı "Paylaş": sistem paylaşım sayfası (RN Share). Challenge daveti değil, arkadaşlık
 * daveti: uygulamanın linki (`WEB_BASE_URL`) ve kullanıcı adı (Arkadaşlar'da kullanıcı adıyla aranır).
 */
import { Platform, Share } from 'react-native';

import { WEB_BASE_URL } from '@/config/links';
import type { Messages } from '@/i18n';

export const friendInviteMessage = (t: Messages, username: string | null | undefined) =>
  t.friends.invite.message(username, WEB_BASE_URL);

type ClipboardLike = { writeText: (text: string) => Promise<void> };

/**
 * Paylaşım sayfasını açar. Web'de tarayıcı paylaşımı (navigator.share) yoksa metni panoya kopyalar ve
 * 'copied' döner (ekran tost gösterir).
 */
export async function shareFriendInvite(
  t: Messages,
  username: string | null | undefined,
): Promise<'shared' | 'copied' | 'failed'> {
  const message = friendInviteMessage(t, username);
  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    // kullanıcı kapattı ya da platform desteklemiyor
  }
  const nav = (globalThis as { navigator?: { clipboard?: ClipboardLike; share?: unknown } }).navigator;
  // Tarayıcıda paylaşım yoksa (masaüstü) panoya; paylaşım vardı da kullanıcı kapattıysa bir şey yapma
  if (Platform.OS === 'web' && nav?.clipboard && !nav.share) {
    try {
      await nav.clipboard.writeText(message);
      return 'copied';
    } catch {
      // izin yok
    }
  }
  return 'failed';
}
