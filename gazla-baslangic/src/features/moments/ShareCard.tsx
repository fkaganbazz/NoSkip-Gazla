import { StyleSheet, Text, View } from 'react-native';

import Diken, { type DikenStage } from '@/components/Diken';
import { DikenFaceIcon } from '@/components/icons';
import { localeTag, useLanguage, useT } from '@/i18n';
import { celebrationColors as c, momentsMetrics as m, momentsTypography as ty } from '@/theme/moments';
import { radius } from '@/theme';

import Confetti from './Confetti';

type Props = {
  durationDays: number;
  title: string;
  name: string;
  username: string;
  stage: DikenStage;
};

// Paylaşım kartı — design/ShareCard.dc.html (360×640, story oranı). Yeşil zemin iki modda aynı.
// Uygulama adı dile göre (Gazla / NoSkip); challenge adı içerik, o dilin kurallarıyla küçük harfe çevrilir.
export default function ShareCard({ durationDays, title, name, username, stage }: Props) {
  const t = useT();
  const lang = useLanguage();
  const ts = t.moments.share;
  return (
    <View
      accessible
      accessibilityLabel={ts.a11y(durationDays, title, name)}
      style={[styles.card, { backgroundColor: c.bg }]}>
      <View style={[styles.ring, styles.ringOuter, { backgroundColor: c.ringOuter }]} />
      <View style={[styles.ring, styles.ringInner, { backgroundColor: c.ringInner }]} />
      <Confetti variant="share" />

      <View style={styles.logoRow}>
        <View style={[styles.logo, { backgroundColor: c.logoBg }]}>
          <DikenFaceIcon size={m.logoSize} />
        </View>
        <Text style={[ty.logo, { color: c.text }]}>{t.common.appName}</Text>
      </View>

      <View style={styles.diken}>
        <Diken mood="gurur" stage={stage} gear="gozluk" size={m.cardDiken} />
      </View>

      <Text style={[ty.bigNumber, styles.bigNumber, { color: c.bigNumber }]}>{ts.bigDays(durationDays)}</Text>
      <Text style={[ty.cardTitle, styles.title, { color: c.text }]}>{title.toLocaleLowerCase(localeTag(lang))}</Text>
      <Text style={[ty.cardSub, styles.sub, { color: c.sub }]}>{ts.sub(name)}</Text>

      <View style={[styles.handle, { backgroundColor: c.handleBg }]}>
        <Text style={[ty.handle, { color: c.handleText }]}>{ts.handle(username)}</Text>
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
