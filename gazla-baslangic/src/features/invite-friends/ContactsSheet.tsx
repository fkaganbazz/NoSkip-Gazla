import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import Sheet from '@/components/Sheet';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { ApiError, hashContactEmails, useFindContacts, type SearchResult } from '@/data';
import { spacing, typography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

import { pickMoreContacts, readContactEmails } from './contacts';
import PersonResults from './PersonResults';
import { shareText } from './share';

type Phase =
  | { kind: 'loading' }
  | { kind: 'denied'; canAskAgain: boolean }
  /** `noEmails`: rehberde e-postası olan kişi yok; değilse eşleşen yok */
  | { kind: 'empty'; noEmails: boolean; limited: boolean }
  | { kind: 'results'; people: SearchResult[]; limited: boolean }
  | { kind: 'error'; message: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Boş durumda "Davet linkini paylaş" metni (link hazır değilse null) */
  shareMessage: string | null;
};

/**
 * "Rehberden bul" — davet ekranında (onboarding ve modal) alt sayfa. Açılınca Kişiler izni istenir, rehberdeki
 * e-postalar okunur ve yalnızca SHA-256 özetleri `find_contacts`'a gider (adresler cihazdan çıkmaz). Eşleşen
 * keşfedilebilir kullanıcılar "Kullanıcı adıyla ara"daki satırlarla listelenir ("Ekle" → arkadaşlık isteği).
 * Kimse yoksa davet linkini paylaşma önerilir; izin reddedildiyse açıklama ve Ayarlar bağlantısı.
 * Tasarımı yok: ortak Sheet, FriendRow, Button ile kuruldu. Web'de satır gösterilmez.
 */
export default function ContactsSheet({ visible, onClose, shareMessage }: Props) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const { mutateAsync: findContacts } = useFindContacts();
  const run = useRef(0);

  const load = useCallback(async () => {
    const id = ++run.current;
    const current = () => id === run.current;
    setPhase({ kind: 'loading' });
    try {
      const read = await readContactEmails();
      if (!current()) return;
      if (read.status === 'denied') {
        setPhase({ kind: 'denied', canAskAgain: read.canAskAgain });
        return;
      }
      const hashes = await hashContactEmails(read.emails);
      if (!current()) return;
      if (hashes.length === 0) {
        setPhase({ kind: 'empty', noEmails: true, limited: read.limited });
        return;
      }
      const people = await findContacts(hashes);
      if (!current()) return;
      setPhase(
        people.length
          ? { kind: 'results', people, limited: read.limited }
          : { kind: 'empty', noEmails: false, limited: read.limited },
      );
    } catch (e) {
      if (current()) {
        setPhase({
          kind: 'error',
          message: e instanceof ApiError ? e.message : 'Rehberine şu an bakamadık. Tekrar dener misin?',
        });
      }
    }
  }, [findContacts]);

  // Açılınca bak; kapanınca süren iş sonuçsuz kalır
  useEffect(() => {
    if (visible) load();
    else run.current++;
  }, [visible, load]);

  // İzin Ayarlar'dan açılıp dönülürse yeniden bak (yalnızca artık sorulamayan izinde; yoksa pencere döngüye girer)
  const waitingForSettings = visible && phase.kind === 'denied' && !phase.canAskAgain;
  useEffect(() => {
    if (!waitingForSettings) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => subscription.remove();
  }, [waitingForSettings, load]);

  const limitedNote = (phase.kind === 'results' || phase.kind === 'empty') && phase.limited && (
    <View style={styles.limited}>
      <Text style={[typography.meta, styles.center, { color: colors.textSecondary }]}>
        Yalnızca paylaşmayı seçtiğin kişilere baktık.
      </Text>
      <Button
        title="Kişi seç"
        variant="text"
        size="md"
        onPress={async () => {
          await pickMoreContacts();
          load();
        }}
      />
    </View>
  );

  const body = () => {
    switch (phase.kind) {
      case 'loading':
        return (
          <View style={styles.status}>
            <LoadingState />
          </View>
        );
      case 'denied':
        return (
          <View style={styles.state}>
            <Text style={[typography.body, styles.center, { color: colors.textBody }]}>
              {phase.canAskAgain
                ? 'Arkadaşlarını bulmak için rehberine bakmamız gerekiyor. İzin verirsen yalnızca e-posta adreslerinin özetlerini karşılaştırırız.'
                : 'Rehber izni kapalı. Arkadaşlarını bulmak için Ayarlar’dan Kişiler iznini açabilirsin.'}
            </Text>
            {phase.canAskAgain ? (
              <Button title="İzin ver" onPress={load} />
            ) : (
              <Button title="Ayarları aç" onPress={() => Linking.openSettings().catch(() => {})} />
            )}
          </View>
        );
      case 'error':
        return <ErrorState message={phase.message} onRetry={load} />;
      case 'empty':
        return (
          <View style={styles.state}>
            <Text style={[typography.cardTitle, styles.center, { color: colors.text }]}>
              {phase.noEmails ? 'Rehberinde e-posta adresi olan kimse yok' : 'Rehberinden henüz kimse Gazla’da değil'}
            </Text>
            <Text style={[typography.body, styles.center, { color: colors.textBody }]}>
              Davet linkini gönder, katılınca birlikte başlarsınız.
            </Text>
            <Button
              title="Davet linkini paylaş"
              variant="secondary"
              disabled={!shareMessage}
              icon={(color) => <ShareIcon color={color} size={m.shareIconSize} strokeWidth={m.shareIconStroke} />}
              onPress={() => shareMessage && shareText(shareMessage)}
            />
            {limitedNote}
          </View>
        );
      case 'results':
        return (
          <>
            <PersonResults people={phase.people} />
            {limitedNote}
          </>
        );
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Rehberden bul" scrollable contentStyle={styles.body}>
      <Text style={[typography.meta, { color: colors.textSecondary }]}>
        E-posta adresleri telefonundan çıkmaz; eşleştirmek için yalnızca özetleri gönderilir.
      </Text>
      {body()}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: m.listMarginTop,
  },
  status: {
    alignItems: 'center',
  },
  state: {
    gap: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  limited: {
    alignItems: 'center',
  },
});
