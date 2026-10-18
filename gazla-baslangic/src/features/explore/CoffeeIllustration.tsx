import Svg, { Ellipse, Path } from 'react-native-svg';

import { coffeeIllustrationColors as c, previewMetrics as m } from '@/theme/explore';

// Üstü çizili kahve fincanı (ChallengePreview.dc.html, 170×150).
export default function CoffeeIllustration() {
  return (
    <Svg width={m.illustrationWidth} height={m.illustrationHeight} viewBox="0 0 170 150">
      <Ellipse cx={80} cy={140} rx={64} ry={7} fill={c.shadow} opacity={0.7} />
      <Path d="M60 20 C54 12 64 6 58 -2" transform="translate(0 20)" fill="none" stroke={c.steam} strokeWidth={5} strokeLinecap="round" />
      <Path d="M84 20 C78 12 88 6 82 -2" transform="translate(0 20)" fill="none" stroke={c.steam} strokeWidth={5} strokeLinecap="round" />
      <Path
        d="M30 56 H122 V104 C122 122 108 136 90 136 H62 C44 136 30 122 30 104 Z"
        fill={c.cup}
        stroke={c.outline}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <Path d="M122 68 H132 C143 68 150 76 150 86 C150 96 143 104 132 104 H121" fill="none" stroke={c.outline} strokeWidth={5} />
      <Ellipse cx={76} cy={57} rx={46} ry={8} fill={c.coffee} stroke={c.outline} strokeWidth={4} />
      <Path d="M44 84 H70" stroke={c.shine} strokeWidth={5} strokeLinecap="round" />
      <Path d="M18 24 L140 146" stroke={c.outline} strokeWidth={11} strokeLinecap="round" />
      <Path d="M18 24 L140 146" stroke={c.strike} strokeWidth={5} strokeLinecap="round" />
    </Svg>
  );
}
