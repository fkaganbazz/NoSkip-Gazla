import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, Text, View } from 'react-native';

import { ShareIcon } from '@/components/icons';
import Sheet from '@/components/Sheet';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { ApiError, hashContactEmails, useFindContacts, type SearchResult } from '@/data';
import { useT } from '@/i18n';
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
  /** `message`: veri katmanının metni; yoksa genel metin */
  | { kind: 'error'; message: string | null };

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
  const t = useT();
  const tx = t.invite.contacts;
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
          message: e instanceof ApiError ? e.message : null,
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
        {tx.limited}
      </Text>
      <Button
        title={tx.pickMore}
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
              {phase.canAskAgain ? tx.askBody : tx.deniedBody}
            </Text>
            {phase.canAskAgain ? (
              <Button title={tx.allow} onPress={load} />
            ) : (
              <Button title={t.common.openSettings} onPress={() => Linking.openSettings().catch(() => {})} />
            )}
          </View>
        );
      case 'error':
        return <ErrorState message={phase.message ?? tx.readFailed} onRetry={load} />;
      case 'empty':
        return (
          <View style={styles.state}>
            <Text style={[typography.cardTitle, styles.center, { color: colors.text }]}>
              {phase.noEmails ? tx.noEmails : tx.noMatches}
            </Text>
            <Text style={[typography.body, styles.center, { color: colors.textBody }]}>
              {tx.emptyBody}
            </Text>
            <Button
              title={tx.shareLink}
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
    <Sheet visible={visible} onClose={onClose} title={tx.title} scrollable contentStyle={styles.body}>
      <Text style={[typography.meta, { color: colors.textSecondary }]}>{tx.privacy}</Text>
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
