import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flatShadowStyle } from '@/components/FlatShadow';
import { ChevronRightIcon, challengeIcons } from '@/components/icons';
import { Button, ErrorState, IconButton, LoadingState, Toast } from '@/components/ui';
import { useChallenge, useChallengeBoard } from '@/data';
import StepHeader from '@/features/onboarding/StepHeader';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { borderWidth, challengeTints, componentTypography as ct, layout, radius, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m, onboardingTypography as t } from '@/theme/onboarding';

import { CopyIcon, MessageIcon, ShareIcon, UserSearchIcon } from './icons';
import { copyText, inviteMessage, sendAsMessage, shareText, useInviteCode } from './share';

/** "Kopyalandı" tostunun ekranda kalma süresi */
const TOAST_MS = 2000;

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const onboarding = variant === 'onboarding';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), TOAST_MS);
    return () => clearTimeout(id);
  }, [copied]);

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
          <StepHeader step={3} />
        ) : (
          <View style={styles.modalHeader}>
            <IconButton icon="close" onPress={onClose} />
          </View>
        )}
        <StepIntro
          title="Tek başına sıkıcı. Arkadaşlarını çağır."
          body="Katılan her arkadaşın seni gazlar. Günü kaçırırsan da laf sokar."
        />

        {challengeId ? (
          <InviteBody challengeId={challengeId} onCopied={() => setCopied(true)} />
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
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinkRow title="Kullanıcı adıyla ara" onPress={onSearchUsername} icon={UserSearchIcon} />
          </View>
        )}
      </StepScreen>

      {copied && (
        <Toast
          message="Davet linki kopyalandı"
          style={[
            styles.toast,
            { bottom: Math.max(insets.bottom, layout.screenPadding) + (onboarding ? m.toastAboveFooter : 0) },
          ]}
        />
      )}
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
  const tint = challengeTints[ch.tint][scheme];
  const Icon = challengeIcons[ch.icon];
  const members = board.data?.length ?? 1;
  const group = members <= 1 ? 'Grupta şimdilik sadece sen' : `Grupta ${members} kişi`;
  const message = invite.url ? inviteMessage(ch.title, invite.url) : null;

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.cardIcon, { backgroundColor: tint.bg }]}>
          <Icon color={tint.ink} size={m.inviteIconSize} strokeWidth={m.inviteIconStroke} />
        </View>
        <View style={styles.cardTexts}>
          <Text numberOfLines={2} style={[typography.cardTitle, { color: colors.text }]}>
            {ch.title}
          </Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>
            {ch.durationDays} gün · {group}
          </Text>
        </View>
      </View>

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
          <ShareButton
            title="Mesajla gönder"
            icon={MessageIcon}
            disabled={!message}
            onPress={() => message && sendAsMessage(message)}
          />
          <ShareButton
            title="Paylaş"
            icon={ShareIcon}
            disabled={!message}
            onPress={() => message && shareText(message)}
          />
        </View>
      </View>
    </>
  );
}

type LineIcon = (props: { color: string; size: number; strokeWidth: number }) => ReactNode;

/** "Mesajla gönder" / "Paylaş": kenarlı, altta 3 px gölge */
function ShareButton({
  title,
  icon: Icon,
  onPress,
  disabled,
}: {
  title: string;
  icon: LineIcon;
  onPress: () => void;
  disabled: boolean;
}) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.share,
        { backgroundColor: c.shareBg, borderColor: c.shareBorder, opacity: disabled ? 0.5 : 1 },
        pressed ? { transform: [{ translateY: m.shareShadow }] } : flatShadowStyle(m.shareShadow, c.shareBorder),
      ]}>
      <Icon color={colors.text} size={m.shareIconSize} strokeWidth={m.shareIconStroke} />
      <Text style={[t.shareButton, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

/** Liste satırı: ikon karosu, ad, sağ ok */
function LinkRow({ title, icon: Icon, onPress }: { title: string; icon: LineIcon; onPress: () => void }) {
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
    borderRadius: radius.card,
    borderWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.inviteCardGap,
  },
  cardIcon: {
    width: m.inviteIconTile,
    height: m.inviteIconTile,
    borderRadius: m.inviteIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
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
  share: {
    flex: 1,
    height: m.shareHeight,
    borderRadius: m.shareRadius,
    borderWidth: borderWidth.thick,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.linkGap,
  },
  list: {
    marginTop: m.listMarginTop,
    borderRadius: m.listRadius,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
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
  toast: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
  },
});
