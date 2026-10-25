import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { FriendRowButton } from '@/components/FriendRow';
import { useT } from '@/i18n';
import { typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

type Props = {
  onShare: () => void;
  /**
   * Hiç arkadaş yokken: kart büyür, ortada selam veren Diken ve "Henüz arkadaşın yok" (tasarlanmadı;
   * aynı yeşil kart, EmptyToday'deki gibi ortalı düzen).
   */
  expanded?: boolean;
};

// "Arkadaşını davet et" yeşil kartı: metin, Paylaş butonu, sağ altta selam veren Diken (Friends.dc.html).
export default function InviteCard({ onShare, expanded = false }: Props) {
  const { scheme } = useTheme();
  const t = useT();
  const c = socialColors[scheme];

  const share = (
    <FriendRowButton
      title={t.common.share}
      variant="ink"
      onPress={onShare}
      accessibilityLabel={t.friends.invite.shareLabel}
      size="lg"
      style={expanded ? styles.shareExpanded : styles.share}
    />
  );

  if (expanded) {
    return (
      <View style={[styles.card, styles.expanded, { backgroundColor: c.inviteCardBg }]}>
        <Diken mood="selam" stage="tam" size={m.inviteEmptyDikenSize} />
        <Text accessibilityRole="header" style={[typography.title2, styles.emptyTitle, { color: c.inviteTitle }]}>
          {t.friends.invite.emptyTitle}
        </Text>
        <Text style={[socialTypography.inviteSub, styles.emptySub, { color: c.inviteSub }]}>
          {t.friends.invite.emptySub}
        </Text>
        {share}
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.compact, { backgroundColor: c.inviteCardBg }]}>
      <View style={styles.texts}>
        <Text style={[typography.cardTitle, { color: c.inviteTitle }]}>{t.friends.invite.title}</Text>
        <Text style={[socialTypography.inviteSub, { color: c.inviteSub }]}>{t.friends.invite.sub}</Text>
      </View>
      {share}
      <View style={styles.diken}>
        <Diken mood="selam" stage="tam" size={m.inviteDikenSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.inviteMarginTop,
    paddingHorizontal: m.invitePaddingX,
    borderRadius: m.inviteRadius,
    overflow: 'hidden',
  },
  compact: {
    height: m.inviteHeight,
    paddingVertical: m.invitePaddingY,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expanded: {
    paddingTop: m.inviteEmptyPaddingTop,
    paddingBottom: m.inviteEmptyPaddingBottom,
    alignItems: 'center',
  },
  texts: {
    width: m.inviteTextWidth,
    flexShrink: 1,
    gap: m.inviteTextGap,
  },
  share: {
    marginLeft: 'auto',
    marginRight: m.shareMarginRight,
  },
  shareExpanded: {
    marginTop: m.inviteEmptyButtonMarginTop,
  },
  emptyTitle: {
    marginTop: m.inviteEmptyTitleMarginTop,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: m.inviteEmptySubMarginTop,
    maxWidth: m.inviteEmptySubMaxWidth,
    textAlign: 'center',
  },
  diken: {
    position: 'absolute',
    right: m.inviteDikenRight,
    bottom: m.inviteDikenBottom,
    pointerEvents: 'none',
  },
});
