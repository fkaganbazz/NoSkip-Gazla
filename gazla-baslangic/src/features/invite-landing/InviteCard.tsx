import { StyleSheet, Text, View } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { challengeIcons } from '@/components/icons';
import { upperTr } from '@/components/ui';
import type { InvitePreview } from '@/data';
import FaceStack from '@/features/explore/FaceStack';
import { avatarTints, borderWidth, challengeTints, typography, useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography, previewTypography } from '@/theme/explore';

// Davet edenin avatarı ve mesaj balonu (InviteLanding.dc.html).
export function InviterMessage({ inviter, message }: { inviter: InvitePreview['inviter']; message: string | null }) {
  const { colors, scheme } = useTheme();
  const c = inviteColors[scheme];
  const t = avatarTints[inviter.avatarTint][scheme];

  return (
    <View style={styles.messageRow}>
      <View
        accessible
        accessibilityLabel={inviter.displayName}
        style={[styles.inviterAvatar, { backgroundColor: t.bg, borderColor: c.avatarRing }]}>
        <Text style={[inviteTypography.inviterInitial, { color: t.ink }]}>{upperTr(inviter.displayName.charAt(0))}</Text>
      </View>
      {message ? (
        <View style={[styles.bubble, { backgroundColor: c.bubbleBg }, flatShadowStyle(m.bubbleShadow, c.bubbleShadow)]}>
          <Text style={[inviteTypography.message, { color: colors.text }]}>{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

type CardProps = {
  preview: InvitePreview;
  meta: string;
};

// Challenge kartı: ikon, ad, alt bilgi ve katılanlar (InviteLanding.dc.html).
export function InviteChallengeCard({ preview, meta }: CardProps) {
  const { colors, scheme } = useTheme();
  const c = inviteColors[scheme];
  const tint = challengeTints[preview.challenge.tint][scheme];
  const Icon = challengeIcons[preview.challenge.icon];
  const faces = preview.members.map((mem) => ({ name: mem.initial, tint: mem.avatarTint }));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: c.cardBorder }]}>
      <View style={styles.head}>
        <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
          <Icon color={tint.ink} size={m.cardIconSize} strokeWidth={m.cardIconStrokeWidth} />
        </View>
        <View style={styles.headTexts}>
          <Text style={[inviteTypography.challengeTitle, { color: colors.text }]}>{preview.challenge.title}</Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>{meta}</Text>
        </View>
      </View>

      <View style={[styles.members, { borderTopColor: c.cardDivider }]}>
        <View style={styles.membersLeft}>
          {faces.length > 0 && (
            <FaceStack
              faces={faces}
              size={m.memberAvatar}
              border={m.memberAvatarBorder}
              ringColor={colors.surface}
              overlap={m.memberOverlap}
              textStyle={previewTypography.faceInitial}
            />
          )}
          <Text style={[typography.captionStrong, { color: colors.textBody }]}>{`${preview.memberCount} kişi katıldı`}</Text>
        </View>
        {!preview.alreadyMember && (
          <Text style={[typography.metaStrong, { color: colors.actionText }]}>Sıra sende</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    marginTop: m.messageMarginTop,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: m.messageGap,
  },
  inviterAvatar: {
    width: m.inviterAvatar,
    height: m.inviterAvatar,
    borderRadius: m.inviterAvatar / 2,
    borderWidth: m.inviterAvatarBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexShrink: 1,
    paddingVertical: m.bubblePaddingY,
    paddingHorizontal: m.bubblePaddingX,
    borderRadius: m.bubbleRadius,
    borderBottomLeftRadius: m.bubbleTailRadius,
  },
  card: {
    marginTop: m.cardMarginTop,
    padding: m.cardPadding,
    borderRadius: m.cardRadius,
    borderWidth: borderWidth.thin,
    gap: m.cardGap,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.cardInnerGap,
  },
  iconTile: {
    width: m.cardIconTile,
    height: m.cardIconTile,
    borderRadius: m.cardIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headTexts: {
    flex: 1,
    gap: m.cardTextGap,
  },
  members: {
    paddingTop: m.membersPaddingTop,
    borderTopWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.membersGap,
  },
});
