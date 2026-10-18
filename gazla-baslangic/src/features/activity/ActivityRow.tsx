import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyMembership, useRespondToInviteMutation, type ActivityItem } from '@/data';
import { ChatIcon, StarIcon } from '@/features/friends/icons';
import { SmallButton } from '@/features/friends/list';
import PersonAvatar from '@/features/friends/PersonAvatar';
import { borderWidth, todayTypography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

import DikenAvatar from './DikenAvatar';
import { activityText, isPoke, timeLabel } from './logic';

export type ActivityActions = {
  onReply: (userId: string) => void;
  onCongrats: (userId: string) => void;
  onAccept: (friendshipId: string) => void;
  onDecline: (userId: string) => void;
  onOpenChallenge: (challengeId: string) => void;
  /** Sürmekte olan istek işlemleri (buton dönen gösterge) */
  busyFriendshipId?: string;
  busyUserId?: string;
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
  const c = socialColors[scheme];
  const actor = item.actor;
  const text = activityText(item);
  const poke = isPoke(item);
  // Challenge davetinde üyelik durumu: hâlâ "invited" ise Katıl / Reddet
  const inviteId = item.kind === 'challenge_invite' ? (item.challengeId ?? undefined) : undefined;
  const membership = useMyMembership(inviteId);

  const badge =
    rich && actor && (poke || item.kind === 'friend_finished_challenge') ? (
      <View
        style={[styles.badge, { backgroundColor: poke ? c.pokeBadge : c.finishBadge, borderColor: colors.surface }]}>
        {poke ? (
          <ChatIcon color={c.badgeIcon} size={m.activityBadgeIconSize} strokeWidth={m.activityBadgeChatStroke} />
        ) : (
          <StarIcon color={c.badgeIcon} size={m.activityBadgeIconSize} strokeWidth={m.activityBadgeStarStroke} />
        )}
      </View>
    ) : null;

  const avatar = actor ? (
    <View>
      <PersonAvatar person={actor} size={m.activityAvatar} textStyle={todayTypography.avatarInitial} />
      {badge}
    </View>
  ) : (
    <DikenAvatar size={m.activityAvatar} scheme={scheme} />
  );

  // Aksiyonlar
  let action: ReactNode = null;
  if (actor && item.kind === 'friend_request' && item.friendshipId) {
    const friendshipId = item.friendshipId;
    action = (
      <View style={styles.buttons}>
        <SmallButton
          title="Kabul et"
          variant="action"
          paddingX={m.activityButtonPaddingX}
          loading={actions.busyFriendshipId === friendshipId}
          onPress={() => actions.onAccept(friendshipId)}
          accessibilityLabel={`${actor.displayName} isteğini kabul et`}
        />
        <SmallButton
          title="Sil"
          variant="muted"
          paddingX={m.activityButtonPaddingX}
          loading={actions.busyUserId === actor.id}
          onPress={() => actions.onDecline(actor.id)}
          accessibilityLabel={`${actor.displayName} isteğini sil`}
        />
      </View>
    );
  } else if (inviteId && membership.data?.status === 'invited') {
    action = <InviteActions challengeId={inviteId} />;
  } else if (rich && actor && poke) {
    action = (
      <SmallButton
        title="Karşılık ver"
        variant="ink"
        paddingX={m.activityButtonPaddingX}
        onPress={() => actions.onReply(actor.id)}
        accessibilityLabel={`${actor.displayName} kişisine karşılık ver`}
        style={styles.alignStart}
      />
    );
  } else if (rich && actor && item.kind === 'friend_finished_challenge') {
    action = (
      <SmallButton
        title="Tebrik et"
        variant="hype"
        paddingX={m.activityButtonPaddingX}
        onPress={() => actions.onCongrats(actor.id)}
        accessibilityLabel={`${actor.displayName} kişisini tebrik et`}
        style={[styles.alignStart, { borderRadius: m.smallButtonRadius }]}
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
        <Text style={[socialTypography.rowSub, styles.time, { color: colors.textSecondary }]}>
          {timeLabel(item.createdAt, now)}
        </Text>
      </View>
      {showBubble ? (
        <View style={[styles.bubble, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[socialTypography.bubble, { color: colors.textBody }]}>{text.sub}</Text>
        </View>
      ) : (
        !!text.sub && <Text style={[socialTypography.activitySub, { color: colors.textBody }]}>{text.sub}</Text>
      )}
      {action}
    </View>
  );

  const rowStyle = [
    styles.row,
    { alignItems: expanded ? ('flex-start' as const) : ('center' as const) },
    divider && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
  ];
  const children = (
    <>
      {avatar}
      {content}
      {!item.readAt && <View accessibilityLabel="Okunmadı" style={[styles.dot, { backgroundColor: c.unreadDot }]} />}
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
  const respond = useRespondToInviteMutation();
  const { colors } = useTheme();
  const busy = respond.isPending ? respond.variables?.accept : undefined;
  return (
    <View style={styles.actionColumn}>
      <View style={styles.buttons}>
        <SmallButton
          title="Katıl"
          variant="action"
          paddingX={m.activityButtonPaddingX}
          loading={busy === true}
          disabled={respond.isPending && busy !== true}
          onPress={() => respond.mutate({ challengeId, accept: true })}
        />
        <SmallButton
          title="Reddet"
          variant="muted"
          paddingX={m.activityButtonPaddingX}
          loading={busy === false}
          disabled={respond.isPending && busy !== false}
          onPress={() => respond.mutate({ challengeId, accept: false })}
        />
      </View>
      {respond.error && (
        <Text style={[socialTypography.rowSub, { color: colors.danger }]}>{respond.error.message}</Text>
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
  bubble: {
    alignSelf: 'flex-start',
    paddingVertical: m.bubblePaddingY,
    paddingHorizontal: m.bubblePaddingX,
    borderTopLeftRadius: m.bubbleRadiusSmall,
    borderTopRightRadius: m.bubbleRadius,
    borderBottomLeftRadius: m.bubbleRadius,
    borderBottomRightRadius: m.bubbleRadius,
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
