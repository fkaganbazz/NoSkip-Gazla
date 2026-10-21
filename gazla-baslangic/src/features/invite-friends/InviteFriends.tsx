import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { FriendList, FriendRowButton } from '@/components/FriendRow';
import { ChevronRightIcon, CopyIcon, MessageIcon, ShareIcon, type IconProps } from '@/components/icons';
import OnboardingHeader from '@/components/OnboardingHeader';
import { Button, Card, ErrorState, IconButton, LoadingState, ToastHost, useToast } from '@/components/ui';
import { useChallenge, useChallengeBoard } from '@/data';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { borderWidth, cardColors, componentMetrics, componentTypography as ct, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { CONTACTS_SUPPORTED } from './contacts';
import ContactsSheet from './ContactsSheet';
import { ContactsIcon, UserSearchIcon } from './icons';
import { copyText, inviteMessage, sendAsMessage, shareText, useInviteCode, type InviteCode } from './share';
import UsernameSearchSheet from './UsernameSearchSheet';

type Props = {
  /** Onboarding adımı (3/4, altta Devam) ya da uygulama içi modal (kapat butonu) */
  variant: 'onboarding' | 'modal';
  /** Davet edilen challenge; null = hazırlanıyor */
  challengeId: string | null;
  /** Challenge hazırlanamadıysa mesaj ve yeniden dene */
  challengeError?: string | null;
  onRetryChallenge?: () => void;
  /** Onboarding: "Devam" ve "Şimdilik atla" */
  onContinue?: () => void;
  /** Onboarding: geri (challenge seçimine) */
  onBack?: () => void;
  /** Modal: kapat */
  onClose?: () => void;
  /** Açılınca bir kez tost olarak gösterilecek bilgi (ör. bekleyen davete katılılamadı); gösterilince `onNoticeShown` */
  notice?: string | null;
  onNoticeShown?: () => void;
};

// Arkadaşlarını çağır — design/InviteFriends.dc.html. Onboarding'in 3. adımı ve uygulama içinden
// açılan davet modalı aynı ekranı kullanır. Davet linki create_invite kodundan (`inviteLink`, https://<alan>/d/<kod>);
// "Kopyala" expo-clipboard, paylaşım RN Share. "Rehberden bul" (iOS/Android; web'de yok) ve "Kullanıcı adıyla ara"
// iki halde de aynı alt sayfaları açar.
export default function InviteFriends({
  variant,
  challengeId,
  challengeError,
  onRetryChallenge,
  onContinue,
  onBack,
  onClose,
  notice,
  onNoticeShown,
}: Props) {
  const onboarding = variant === 'onboarding';
  const toast = useToast();
  const { show } = toast;
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  // Davet kodu ve challenge burada: link kutusu ve "Rehberden bul"un boş durumu aynı paylaşım metnini kullanır
  const invite = useInviteCode(challengeId);
  const challenge = useChallenge(challengeId ?? undefined);
  const message = invite.url && challenge.data ? inviteMessage(challenge.data.title, invite.url) : null;

  useEffect(() => {
    if (!notice) return;
    show({ message: notice, durationMs: componentMetrics.toastActionDurationMs });
    onNoticeShown?.();
  }, [notice, onNoticeShown, show]);

  return (
    <View style={styles.root}>
      <StepScreen
        footer={
          onboarding && onContinue ? (
            <>
              <Button title="Devam" onPress={onContinue} />
              <Button title="Şimdilik atla" variant="text" onPress={onContinue} />
            </>
          ) : undefined
        }>
        {onboarding ? (
          <OnboardingHeader step={3} onBack={onBack} />
        ) : (
          <View style={styles.modalHeader}>
            <IconButton icon="close" accessibilityLabel="Kapat" onPress={onClose} />
          </View>
        )}
        <StepIntro
          title="Tek başına sıkıcı. Arkadaşlarını çağır."
          body="Katılan her arkadaşın seni gazlar. Günü kaçırırsan da laf sokar."
        />

        {challengeId ? (
          <InviteBody
            challengeId={challengeId}
            invite={invite}
            message={message}
            onCopy={async (url) => {
              if (await copyText(url)) toast.show({ message: 'Davet linki kopyalandı', kind: 'success' });
              else toast.show({ message: 'Link kopyalanamadı. Paylaş ile gönderebilirsin.' });
            }}
          />
        ) : challengeError ? (
          <View style={styles.state}>
            <ErrorState message={challengeError} onRetry={onRetryChallenge} />
          </View>
        ) : (
          <View style={styles.state}>
            <LoadingState />
          </View>
        )}

        <FriendList style={styles.list}>
          {CONTACTS_SUPPORTED && (
            <LinkRow title="Rehberden bul" onPress={() => setContactsOpen(true)} icon={ContactsIcon} divider />
          )}
          <LinkRow title="Kullanıcı adıyla ara" onPress={() => setSearchOpen(true)} icon={UserSearchIcon} />
        </FriendList>
      </StepScreen>

      {/* Onboarding'de alttaki iki butonun üstünde */}
      <ToastHost toast={toast} offset={onboarding ? m.toastAboveFooter : 0} />
      <UsernameSearchSheet visible={searchOpen} onClose={() => setSearchOpen(false)} />
      {CONTACTS_SUPPORTED && (
        <ContactsSheet visible={contactsOpen} onClose={() => setContactsOpen(false)} shareMessage={message} />
      )}
    </View>
  );
}

function InviteBody({
  challengeId,
  invite,
  message,
  onCopy,
}: {
  challengeId: string;
  invite: InviteCode;
  /** Paylaşılan metin (link ve challenge hazırsa) */
  message: string | null;
  onCopy: (url: string) => void;
}) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const challenge = useChallenge(challengeId);
  const board = useChallengeBoard(challengeId);

  if (challenge.isPending) {
    return (
      <View style={styles.state}>
        <LoadingState />
      </View>
    );
  }
  if (challenge.isError) {
    return (
      <View style={styles.state}>
        <ErrorState onRetry={() => challenge.refetch()} />
      </View>
    );
  }

  const ch = challenge.data;
  const members = board.data?.length ?? 1;
  const group = members <= 1 ? 'Grupta şimdilik sadece sen' : `Grupta ${members} kişi`;

  return (
    <>
      <Card style={styles.card}>
        <CategoryTile icon={ch.icon} tint={ch.tint} size={44} />
        <View style={styles.cardTexts}>
          <Text numberOfLines={2} style={[typography.cardTitle, { color: colors.text }]}>
            {ch.title}
          </Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>
            {ch.durationDays} gün · {group}
          </Text>
        </View>
      </Card>

      <View style={styles.linkSection}>
        <Text style={[ct.inputLabel, { color: colors.text }]}>Davet linkin</Text>
        <View style={[styles.linkBox, { backgroundColor: c.fieldBg, borderColor: c.linkBorder }]}>
          {invite.url ? (
            <Text
              numberOfLines={1}
              ellipsizeMode="middle"
              selectable
              style={[t.link, styles.linkText, { color: c.linkText }]}>
              {invite.url}
            </Text>
          ) : invite.error ? (
            <Pressable onPress={invite.retry} accessibilityRole="button" style={styles.linkText}>
              <Text numberOfLines={2} style={[typography.meta, { color: colors.dangerText }]}>
                {invite.error} Tekrar dene
              </Text>
            </Pressable>
          ) : (
            <View style={styles.linkText}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          )}
          {/* InviteFriends.dc.html: 40, 0 14, köşe 12, gece moru (koyuda kum) */}
          <FriendRowButton
            title="Kopyala"
            variant="ink"
            size="lg"
            wide
            icon={CopyIcon}
            disabled={!invite.url}
            accessibilityLabel="Davet linkini kopyala"
            onPress={() => invite.url && onCopy(invite.url)}
          />
        </View>
        <View style={styles.shareRow}>
          <Button
            title="Mesajla gönder"
            variant="secondary"
            size="mdCompact"
            icon={(color) => <MessageIcon color={color} size={m.shareIconSize} strokeWidth={m.shareIconStroke} />}
            disabled={!message}
            onPress={() => message && sendAsMessage(message)}
            style={styles.share}
          />
          <Button
            title="Paylaş"
            variant="secondary"
            size="mdCompact"
            icon={(color) => <ShareIcon color={color} size={m.shareIconSize} strokeWidth={m.shareIconStroke} />}
            disabled={!message}
            onPress={() => message && shareText(message)}
            style={styles.share}
          />
        </View>
      </View>
    </>
  );
}

/** Liste satırı: ikon karosu, ad, sağ ok; `divider`: altında ayraç (listede son satır hariç) */
function LinkRow({
  title,
  icon: Icon,
  onPress,
  divider,
}: {
  title: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
  divider?: boolean;
}) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        divider && { borderBottomWidth: borderWidth.thin, borderBottomColor: cardColors[scheme].rowDivider },
        pressed && { backgroundColor: colors.surfaceMuted },
      ]}>
      <View style={[styles.rowIcon, { backgroundColor: c.rowIconBg }]}>
        <Icon color={colors.text} size={m.rowIconSize} strokeWidth={m.rowIconStroke} />
      </View>
      <Text style={[typography.cardTitle, styles.rowTitle, { color: colors.text }]}>{title}</Text>
      <ChevronRightIcon color={colors.textSecondary} size={m.rowIconSize} strokeWidth={m.rowChevronStroke} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
  },
  state: {
    marginTop: m.inviteCardMarginTop,
    minHeight: m.tileHeight * 2,
  },
  card: {
    marginTop: m.inviteCardMarginTop,
    padding: m.inviteCardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.inviteCardGap,
  },
  cardTexts: {
    flex: 1,
    gap: m.inviteTextGap,
  },
  linkSection: {
    marginTop: m.linkSectionMarginTop,
    gap: m.linkSectionGap,
  },
  linkBox: {
    height: m.linkHeight,
    paddingLeft: m.linkPaddingLeft,
    paddingRight: m.linkPaddingRight,
    borderRadius: m.linkRadius,
    borderWidth: borderWidth.thick,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.linkGap,
  },
  linkText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  shareRow: {
    flexDirection: 'row',
    gap: m.shareGap,
  },
  share: {
    flex: 1,
  },
  list: {
    marginTop: m.listMarginTop,
  },
  row: {
    minHeight: m.rowMinHeight,
    paddingHorizontal: m.rowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  rowIcon: {
    width: m.rowIconTile,
    height: m.rowIconTile,
    borderRadius: m.rowIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
  },
});
