import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FriendRowButton } from '@/components/FriendRow';
import { DikenFaceIcon, MessageIcon, StarIcon } from '@/components/icons';
import SpeechBubble from '@/components/SpeechBubble';
import { useMyMembership, useRespondToInvite, type ActivityItem } from '@/data';
import { useT } from '@/i18n';
import { borderWidth, cardColors, cardTypography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

import { activityText, isPoke, timeLabel } from './logic';

export type ActivityActions = {
  onReply: (userId: string) => void;
  /** Challenge bitirme: hazır gaz mesajını doğrudan gönderir (CONGRATS_POKE) */
  onCongrats: (item: ActivityItem) => void;
  onAccept: (friendshipId: string) => void;
  onDecline: (userId: string) => void;
  onOpenChallenge: (challengeId: string) => void;
  /** Sürmekte olan istek işlemleri (buton dönen gösterge) */
  busyFriendshipId?: string;
  busyUserId?: string;
  /** Tebriği gönderilmekte olan bildirim */
  congratsBusyId?: string;
  /** Tebrik gönderilmiş bildirimler (id → dürtme id); buton "Tebrik edildi" ve pasif */
  congratulatedIds: Record<string, string>;
};

type Props = {
  item: ActivityItem;
  now: Date;
  /** Bugünün satırları: rozet, mesaj balonu ve aksiyon butonu */
  rich: boolean;
  divider: boolean;
  actions: ActivityActions;
};

// Aktivite satırı (Activity.dc.html). Bugünün satırları "zengin": avatar rozeti, mesaj balonu ve
// aksiyon (Karşılık ver, Tebrik et). Arkadaşlık isteği ve açık challenge daveti her zaman butonlu.
export default function ActivityRow({ item, now, rich, divider, actions }: Props) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const a = t.activity.actions;
  const c = socialColors[scheme];
  const actor = item.actor;
  const text = activityText(item, t);
  const poke = isPoke(item);
  // Challenge davetinde üyelik durumu: hâlâ "invited" ise Katıl / Reddet
  const inviteId = item.kind === 'challenge_invite' ? (item.challengeId ?? undefined) : undefined;
  const membership = useMyMembership(inviteId);

  const badge =
    rich && actor && (poke || item.kind === 'friend_finished_challenge') ? (
      <View
        style={[styles.badge, { backgroundColor: poke ? c.pokeBadge : c.finishBadge, borderColor: colors.surface }]}>
        {poke ? (
          <MessageIcon color={c.badgeIcon} size={m.activityBadgeIconSize} strokeWidth={m.activityBadgeChatStroke} />
        ) : (
          <StarIcon color={c.badgeIcon} size={m.activityBadgeIconSize} strokeWidth={m.activityBadgeStarStroke} />
        )}
      </View>
    ) : null;

  // Kişi avatarı (dürtme/bitirme rozeti üstünde) ya da sistem mesajında koyu daire içinde Diken'in yüzü
  const avatar = actor ? (
    <Avatar name={actor.displayName} tint={actor.avatarTint} url={actor.avatarUrl} size={m.activityAvatar} decorative>
      {badge}
    </Avatar>
  ) : (
    <View style={[styles.diken, { backgroundColor: c.dikenAvatarBg }]}>
      <DikenFaceIcon size={m.activityAvatar} />
    </View>
  );

  // Aksiyonlar
  let action: ReactNode = null;
  if (actor && item.kind === 'friend_request' && item.friendshipId) {
    const friendshipId = item.friendshipId;
    action = (
      <View style={styles.buttons}>
        <FriendRowButton
          title={t.common.accept}
          variant="action"
          loading={actions.busyFriendshipId === friendshipId}
          onPress={() => actions.onAccept(friendshipId)}
          accessibilityLabel={a.acceptLabel(actor.displayName)}
          wide
        />
        <FriendRowButton
          title={t.common.delete}
          variant="muted"
          loading={actions.busyUserId === actor.id}
          onPress={() => actions.onDecline(actor.id)}
          accessibilityLabel={a.declineLabel(actor.displayName)}
          wide
        />
      </View>
    );
  } else if (inviteId && membership.data?.status === 'invited') {
    action = <InviteActions challengeId={inviteId} />;
  } else if (rich && actor && poke) {
    action = (
      <FriendRowButton
        title={a.reply}
        variant="ink"
        onPress={() => actions.onReply(actor.id)}
        accessibilityLabel={a.replyLabel(actor.displayName)}
        wide
        style={styles.alignStart}
      />
    );
  } else if (rich && actor && item.kind === 'friend_finished_challenge') {
    const sent = !!actions.congratulatedIds[item.id];
    action = (
      <FriendRowButton
        title={sent ? a.congratsDone : a.congrats}
        variant="hype"
        onPress={() => actions.onCongrats(item)}
        loading={actions.congratsBusyId === item.id}
        disabled={sent}
        accessibilityLabel={sent ? a.congratsDoneLabel(actor.displayName) : a.congratsLabel(actor.displayName)}
        wide
        style={styles.alignStart}
      />
    );
  }

  const showBubble = rich && poke && !!text.sub;
  const expanded = showBubble || !!action;
  const openChallenge = item.kind === 'challenge_invite' && item.challengeId ? item.challengeId : null;

  const content = (
    <View style={[styles.texts, { gap: expanded ? m.activityRichGap : m.activityPlainGap }]}>
      <View style={styles.titleRow}>
        <Text style={[socialTypography.activityTitle, styles.title, { color: colors.text }]}>{text.title}</Text>
        <Text style={[cardTypography.rowSub, styles.time, { color: colors.textSecondary }]}>
          {timeLabel(item.createdAt, now, t)}
        </Text>
      </View>
      {showBubble ? (
        <SpeechBubble variant="quote" style={styles.alignStart}>
          {text.sub}
        </SpeechBubble>
      ) : (
        !!text.sub && <Text style={[socialTypography.activitySub, { color: colors.textBody }]}>{text.sub}</Text>
      )}
      {action}
    </View>
  );

  const rowStyle = [
    styles.row,
    { alignItems: expanded ? ('flex-start' as const) : ('center' as const) },
    divider && { borderBottomWidth: borderWidth.thin, borderBottomColor: cardColors[scheme].rowDivider },
  ];
  const children = (
    <>
      {avatar}
      {content}
      {!item.readAt && <View accessibilityLabel={t.activity.unread} style={[styles.dot, { backgroundColor: c.unreadDot }]} />}
    </>
  );

  // Butonlu satırlar basılamaz (iç içe buton olmasın); davet satırı butonsuzsa challenge'ı açar
  if (openChallenge && !action) {
    return (
      <Pressable
        onPress={() => actions.onOpenChallenge(openChallenge)}
        accessibilityRole="button"
        style={({ pressed }) => [rowStyle, pressed && { backgroundColor: colors.surfaceMuted }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{children}</View>;
}

/** Açık challenge davetine yanıt: Katıl / Reddet (respond_to_invite) */
function InviteActions({ challengeId }: { challengeId: string }) {
  const respond = useRespondToInvite();
  const { colors } = useTheme();
  const t = useT();
  const busy = respond.isPending ? respond.variables?.accept : undefined;
  return (
    <View style={styles.actionColumn}>
      <View style={styles.buttons}>
        <FriendRowButton
          title={t.common.join}
          variant="action"
          wide
          loading={busy === true}
          disabled={respond.isPending && busy !== true}
          onPress={() => respond.mutate({ challengeId, accept: true })}
        />
        <FriendRowButton
          title={t.activity.actions.declineInvite}
          variant="muted"
          wide
          loading={busy === false}
          disabled={respond.isPending && busy !== false}
          onPress={() => respond.mutate({ challengeId, accept: false })}
        />
      </View>
      {respond.error && (
        <Text style={[cardTypography.rowSub, { color: colors.dangerText }]}>{respond.error.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: m.activityRowPaddingY,
    paddingLeft: m.activityRowPaddingLeft,
    paddingRight: m.activityRowPaddingRight,
    flexDirection: 'row',
    gap: m.rowGap,
  },
  badge: {
    position: 'absolute',
    right: m.activityBadgeOffset,
    bottom: m.activityBadgeOffset,
    width: m.activityBadgeSize,
    height: m.activityBadgeSize,
    borderRadius: m.activityBadgeSize / 2,
    borderWidth: m.activityBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m.activityHeaderGap,
  },
  title: {
    flexShrink: 1,
  },
  time: {
    flexShrink: 0,
  },
  diken: {
    width: m.activityAvatar,
    height: m.activityAvatar,
    borderRadius: m.activityAvatar / 2,
    overflow: 'hidden',
  },
  buttons: {
    flexDirection: 'row',
    gap: m.activityButtonsGap,
  },
  actionColumn: {
    gap: m.activityPlainGap,
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  dot: {
    position: 'absolute',
    left: m.unreadDotLeft,
    top: m.unreadDotTop,
    width: m.unreadDotSize,
    height: m.unreadDotSize,
    borderRadius: m.unreadDotSize / 2,
  },
});
