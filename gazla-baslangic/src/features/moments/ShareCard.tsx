import { StyleSheet, Text, View } from 'react-native';

import Diken, { type DikenStage } from '@/components/Diken';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as t } from '@/theme/moments';
import { radius } from '@/theme';

import Confetti from './Confetti';
import { GazlaMark } from './icons';

type Props = {
  durationDays: number;
  title: string;
  name: string;
  username: string;
  stage: DikenStage;
};

// Paylaşım kartı — design/ShareCard.dc.html (360×640, story oranı). Yeşil zemin iki modda aynı.
export default function ShareCard({ durationDays, title, name, username, stage }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={`${durationDays} gün, ${title}. ${name} başardı. Sıra sende.`}
      style={[styles.card, { backgroundColor: c.bg }]}>
      <View style={[styles.ring, styles.ringOuter, { backgroundColor: c.ringOuter }]} />
      <View style={[styles.ring, styles.ringInner, { backgroundColor: c.ringInner }]} />
      <Confetti variant="share" />

      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <GazlaMark size={m.logoSize} />
        </View>
        <Text style={[t.logo, { color: c.text }]}>Gazla</Text>
      </View>

      <View style={styles.diken}>
        <Diken mood="gurur" stage={stage} gear="gozluk" size={m.cardDiken} />
      </View>

      <Text style={[t.bigNumber, styles.bigNumber, { color: c.bigNumber }]}>{`${durationDays} GÜN`}</Text>
      <Text style={[t.cardTitle, styles.title, { color: c.text }]}>{title.toLocaleLowerCase('tr-TR')}</Text>
      <Text style={[t.cardSub, styles.sub, { color: c.sub }]}>{`${name} başardı. Sıra sende.`}</Text>

      <View style={[styles.handle, { backgroundColor: c.handleBg }]}>
        <Text style={[t.handle, { color: c.handleText }]}>{`Gazla'da beni bul · @${username}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: m.cardWidth,
    height: m.cardHeight,
    paddingTop: m.cardPaddingTop,
    paddingHorizontal: m.cardPaddingX,
    paddingBottom: m.cardPaddingBottom,
    alignItems: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
  },
  ringOuter: {
    borderRadius: m.cardRingOuter / 2,
    left: m.cardRingOuterLeft,
    top: m.cardRingOuterTop,
    width: m.cardRingOuter,
    height: m.cardRingOuter,
  },
  ringInner: {
    borderRadius: m.cardRingInner / 2,
    left: m.cardRingInnerLeft,
    top: m.cardRingInnerTop,
    width: m.cardRingInner,
    height: m.cardRingInner,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.logoGap,
  },
  logo: {
    width: m.logoSize,
    height: m.logoSize,
    borderRadius: m.logoRadius,
    overflow: 'hidden',
  },
  diken: {
    marginTop: m.cardDikenTop,
  },
  bigNumber: {
    marginTop: m.bigNumberTop,
  },
  title: {
    marginTop: m.cardTitleTop,
    textAlign: 'center',
  },
  sub: {
    marginTop: m.cardSubTop,
  },
  handle: {
    marginTop: 'auto',
    paddingVertical: m.handlePaddingY,
    paddingHorizontal: m.handlePaddingX,
    borderRadius: radius.full,
  },
});
