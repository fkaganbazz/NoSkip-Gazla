import { StyleSheet, Text, View } from 'react-native';

import { Avatar, AvatarStack } from '@/components/Avatar';
import { CategoryTile } from '@/components/CategoryTile';
import SpeechBubble from '@/components/SpeechBubble';
import type { InvitePreview } from '@/data';
import { borderWidth, typography, useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Davet edenin avatarı ve mesaj balonu (InviteLanding.dc.html).
export function InviterMessage({ inviter, message }: { inviter: InvitePreview['inviter']; message: string | null }) {
  const { scheme } = useTheme();

  return (
    <View style={styles.messageRow}>
      <Avatar
        name={inviter.displayName}
        tint={inviter.avatarTint}
        url={inviter.avatarUrl}
        size={m.inviterAvatar}
        outlineColor={inviteColors[scheme].avatarRing}
        outlineWidth={m.inviterAvatarBorder}
        initialStyle={inviteTypography.inviterInitial}
      />
      {message ? (
        <SpeechBubble variant="message" style={styles.bubble}>
          {message}
        </SpeechBubble>
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
  const people = preview.members.map((mem) => ({ name: mem.initial, tint: mem.avatarTint }));

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: c.cardBorder }]}>
      <View style={styles.head}>
        <CategoryTile icon={preview.challenge.icon} tint={preview.challenge.tint} size={m.cardIconTile} />
        <View style={styles.headTexts}>
          <Text style={[inviteTypography.challengeTitle, { color: colors.text }]}>{preview.challenge.title}</Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>{meta}</Text>
        </View>
      </View>

      <View style={[styles.members, { borderTopColor: c.cardDivider }]}>
        <View style={styles.membersLeft}>
          {people.length > 0 && <AvatarStack people={people} size={m.memberAvatar} outlineColor={colors.surface} />}
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
  bubble: {
    flexShrink: 1,
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
