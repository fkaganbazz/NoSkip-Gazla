import { StyleSheet, Text, View } from 'react-native';

import Diken from '@/components/Diken';
import { FriendRowButton } from '@/components/FriendRow';
import { typography, useTheme } from '@/theme';
import { socialColors, socialMetrics as m, socialTypography } from '@/theme/social';

// "Arkadaşını davet et" yeşil kartı: metin, Paylaş butonu, sağ altta selam veren Diken (Friends.dc.html).
export default function InviteCard({ onShare }: { onShare: () => void }) {
  const { scheme } = useTheme();
  const c = socialColors[scheme];

  return (
    <View style={[styles.card, { backgroundColor: c.inviteCardBg }]}>
      <View style={styles.texts}>
        <Text style={[typography.cardTitle, { color: c.inviteTitle }]}>Arkadaşını davet et</Text>
        <Text style={[socialTypography.inviteSub, { color: c.inviteSub }]}>
          Linkle gelen, doğrudan grubuna katılır.
        </Text>
      </View>
      <FriendRowButton
        title="Paylaş"
        variant="ink"
        onPress={onShare}
        accessibilityLabel="Davet linkini paylaş"
        size="lg"
        style={styles.share}
      />
      <View style={styles.diken}>
        <Diken mood="selam" stage="tam" size={m.inviteDikenSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.inviteMarginTop,
    height: m.inviteHeight,
    paddingVertical: m.invitePaddingY,
    paddingHorizontal: m.invitePaddingX,
    borderRadius: m.inviteRadius,
    overflow: 'hidden',
    flexDirection: 'row',
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
  diken: {
    position: 'absolute',
    right: m.inviteDikenRight,
    bottom: m.inviteDikenBottom,
    pointerEvents: 'none',
  },
});
