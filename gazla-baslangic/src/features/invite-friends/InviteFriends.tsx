import type { ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { FriendList } from '@/components/FriendRow';
import { ChevronRightIcon, CopyIcon, MessageIcon, ShareIcon, type IconProps } from '@/components/icons';
import OnboardingHeader from '@/components/OnboardingHeader';
import { Button, Card, ErrorState, IconButton, LoadingState, ToastHost, useToast } from '@/components/ui';
import { useChallenge, useChallengeBoard } from '@/data';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { borderWidth, componentTypography as ct, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { UserSearchIcon } from './icons';
import { copyText, inviteMessage, sendAsMessage, shareText, useInviteCode } from './share';

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
  /** Modal: kapat */
  onClose?: () => void;
  /** Modal: "Kullanıcı adıyla ara" */
  onSearchUsername?: () => void;
};

// Arkadaşlarını çağır — design/InviteFriends.dc.html. Onboarding'in 3. adımı ve uygulama içinden
// açılan davet modalı aynı ekranı kullanır. Davet linki create_invite kodundan; paylaşım RN Share.
export default function InviteFriends({
  variant,
  challengeId,
  challengeError,
  onRetryChallenge,
  onContinue,
  onClose,
  onSearchUsername,
}: Props) {
  const onboarding = variant === 'onboarding';
  const toast = useToast();

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
          // Profil tamamlandı; geri dönülecek adım yok
          <OnboardingHeader step={3} />
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
            onCopied={() => toast.show({ message: 'Davet linki kopyalandı', kind: 'success' })}
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

        {!onboarding && onSearchUsername && (
          <FriendList style={styles.list}>
            <LinkRow title="Kullanıcı adıyla ara" onPress={onSearchUsername} icon={UserSearchIcon} />
          </FriendList>
        )}
      </StepScreen>

      {/* Onboarding'de alttaki iki butonun üstünde */}
      <ToastHost toast={toast} offset={onboarding ? m.toastAboveFooter : 0} />
    </View>
  );
}

function InviteBody({ challengeId, onCopied }: { challengeId: string; onCopied: () => void }) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const challenge = useChallenge(challengeId);
  const board = useChallengeBoard(challengeId);
  const invite = useInviteCode(challengeId);

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
  const message = invite.url ? inviteMessage(ch.title, invite.url) : null;

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
              <Text numberOfLines={2} style={[typography.meta, { color: colors.danger }]}>
                {invite.error} Tekrar dene
              </Text>
            </Pressable>
          ) : (
            <View style={styles.linkText}>
              <ActivityIndicator color={colors.textSecondary} />
            </View>
          )}
          <Pressable
            onPress={async () => {
              if (invite.url && (await copyText(invite.url))) onCopied();
            }}
            disabled={!invite.url}
            accessibilityRole="button"
            accessibilityLabel="Davet linkini kopyala"
            accessibilityState={{ disabled: !invite.url }}
            style={({ pressed }) => [
              styles.copy,
              { backgroundColor: c.copyBg, opacity: !invite.url ? 0.5 : pressed ? 0.85 : 1 },
            ]}>
            <CopyIcon color={c.copyText} size={m.copyIconSize} strokeWidth={m.copyIconStroke} />
            <Text style={[typography.captionStrong, { color: c.copyText }]}>Kopyala</Text>
          </Pressable>
        </View>
        <View style={styles.shareRow}>
          <Button
            title="Mesajla gönder"
            variant="secondary"
            size="md"
            icon={(color) => <MessageIcon color={color} size={m.shareIconSize} strokeWidth={m.shareIconStroke} />}
            disabled={!message}
            onPress={() => message && sendAsMessage(message)}
            style={styles.share}
          />
          <Button
            title="Paylaş"
            variant="secondary"
            size="md"
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

/** Liste satırı: ikon karosu, ad, sağ ok */
function LinkRow({
  title,
  icon: Icon,
  onPress,
}: {
  title: string;
  icon: ComponentType<IconProps>;
  onPress: () => void;
}) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceMuted }]}>
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
  copy: {
    height: m.copyHeight,
    paddingHorizontal: m.copyPaddingX,
    borderRadius: m.copyRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.copyGap,
  },
  shareRow: {
    flexDirection: 'row',
    gap: m.shareGap,
  },
  // InviteFriends.dc.html: 50 yükseklik, köşe 16 (ortak md 52 / 18); yarım genişlikte metin sığsın diye iç boşluksuz
  share: {
    flex: 1,
    minHeight: m.shareHeight,
    borderRadius: m.shareRadius,
    paddingHorizontal: 0,
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
