/**
 * Diken — maskot. Kaynak: design/Diken.dc.html (viewBox 240×300).
 *
 * Tasarımdaki `display` ile gizlenen grupların her biri burada sabit bir parça;
 * hangi parçanın çizileceği koşullu render ile seçiliyor. Çizim sırası
 * tasarımdakiyle aynı (kavuşturulmuş kollar gövdenin önünde, saksı yüzün önünde).
 */
import { memo, type ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { dikenColors as c } from '@/theme';

export const DIKEN_MOODS = [
  'mutlu',
  'selam',
  'laf',
  'cosku',
  'gurur',
  'endise',
  'saskin',
  'uykulu',
  'solgun',
] as const;
export const DIKEN_STAGES = ['filiz', 'genc', 'tam', 'cicek'] as const;
export const DIKEN_GEARS = ['yok', 'bant', 'gozluk'] as const;
export const DIKEN_POSES = ['relaxed', 'akimbo', 'cross', 'up', 'droop', 'wave'] as const;

export type DikenMood = (typeof DIKEN_MOODS)[number];
export type DikenStage = (typeof DIKEN_STAGES)[number];
export type DikenGear = (typeof DIKEN_GEARS)[number];
export type DikenPose = (typeof DIKEN_POSES)[number];

export type DikenProps = {
  /** İfade. Varsayılan `mutlu`. `solgun` aşamayı ve aksesuarı yok sayar. */
  mood?: DikenMood;
  /** Seri aşaması. Varsayılan `tam`. */
  stage?: DikenStage;
  /** Aksesuar; sadece `tam` ve `cicek` aşamasında görünür. Varsayılan `yok`. */
  gear?: DikenGear;
  /** Genişlik (px). Yükseklik genişliğin 1,25 katı. Varsayılan 240. */
  size?: number;
  /** Kol duruşunu ifadeden bağımsız seçer. Verilmezse ifadeye göre seçilir. */
  pose?: DikenPose;
};

const DEFAULT_SIZE = 240;
const VIEW_BOX = '0 0 240 300';
const ASPECT = 1.25;

const POSE_BY_MOOD: Record<DikenMood, DikenPose> = {
  mutlu: 'relaxed',
  selam: 'wave',
  laf: 'cross',
  cosku: 'up',
  gurur: 'up',
  endise: 'droop',
  saskin: 'up',
  uykulu: 'droop',
  solgun: 'relaxed',
};

const LABELS: Record<DikenMood, string> = {
  mutlu: 'mutlu',
  selam: 'el sallıyor',
  laf: 'laf sokuyor',
  cosku: 'coşkulu',
  gurur: 'gururlu',
  endise: 'endişeli',
  saskin: 'şaşkın',
  uykulu: 'uykulu',
  solgun: 'solmuş',
};

// Yüz ve efekt katmanlarının aşamaya göre yeri (tasarımdaki CSS transform'ların SVG karşılığı).
// Tasarımdaki `none` için undefined değil birim dönüşüm verilir: react-native-svg, transform
// kaldırıldığında native düğümün (iOS ve Android) eski matrisini sıfırlamıyor.
const IDENTITY_TRANSFORM = 'translate(0 0)';
const SPROUT_TRANSFORM = 'translate(120 204) scale(0.62) translate(-120 -122)';
const FACE_TRANSFORM = {
  none: IDENTITY_TRANSFORM,
  wilted: 'translate(126 126) rotate(12) translate(-120 -122)',
  young: 'translate(0 34)',
  sprout: SPROUT_TRANSFORM,
} as const;
const FX_TRANSFORM = {
  none: IDENTITY_TRANSFORM,
  young: 'translate(-8 40)',
  sprout: SPROUT_TRANSFORM,
} as const;

// Zemin gölgesi
const SHADOW = (
  <Ellipse cx={120} cy={294} rx={66} ry={5} fill={c.outline} opacity={0.1} />
);

// Kollar: rahat
const ARMS_RELAXED = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M88 172 H56 C47 172 42 166 42 157 V122" stroke={c.outline} strokeWidth={36} />
    <Path d="M152 152 H184 C193 152 198 146 198 137 V102" stroke={c.outline} strokeWidth={36} />
    <Path d="M88 172 H56 C47 172 42 166 42 157 V122" stroke={c.body} strokeWidth={24} />
    <Path d="M152 152 H184 C193 152 198 146 198 137 V102" stroke={c.body} strokeWidth={24} />
    <Path d="M36 150 V126" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
    <Path d="M192 130 V106" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
  </G>
);

// Kollar: belde
const ARMS_AKIMBO = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M84 162 L56 170 C47 173 45 183 52 188 L80 206" stroke={c.outline} strokeWidth={36} />
    <Path d="M152 152 H184 C193 152 198 146 198 137 V102" stroke={c.outline} strokeWidth={36} />
    <Path d="M84 162 L56 170 C47 173 45 183 52 188 L80 206" stroke={c.body} strokeWidth={24} />
    <Path d="M152 152 H184 C193 152 198 146 198 137 V102" stroke={c.body} strokeWidth={24} />
    <Path d="M192 130 V106" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
  </G>
);

// Kollar: havada
const ARMS_UP = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M86 158 H60 C51 158 46 152 46 143 V62" stroke={c.outline} strokeWidth={36} />
    <Path d="M154 158 H180 C189 158 194 152 194 143 V62" stroke={c.outline} strokeWidth={36} />
    <Path d="M86 158 H60 C51 158 46 152 46 143 V62" stroke={c.body} strokeWidth={24} />
    <Path d="M154 158 H180 C189 158 194 152 194 143 V62" stroke={c.body} strokeWidth={24} />
    <Path d="M40 132 V68" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
    <Path d="M188 132 V68" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
  </G>
);

// Kollar: sarkık
const ARMS_DROOP = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M86 142 H60 C51 142 46 148 46 157 V198" stroke={c.outline} strokeWidth={36} />
    <Path d="M154 142 H180 C189 142 194 148 194 157 V198" stroke={c.outline} strokeWidth={36} />
    <Path d="M86 142 H60 C51 142 46 148 46 157 V198" stroke={c.body} strokeWidth={24} />
    <Path d="M154 142 H180 C189 142 194 148 194 157 V198" stroke={c.body} strokeWidth={24} />
  </G>
);

// Kollar: el sallama
const ARMS_WAVE = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M88 172 H56 C47 172 42 166 42 157 V122" stroke={c.outline} strokeWidth={36} />
    <Path d="M152 150 H180 C190 150 196 144 198 134 L210 70" stroke={c.outline} strokeWidth={36} />
    <Path d="M88 172 H56 C47 172 42 166 42 157 V122" stroke={c.body} strokeWidth={24} />
    <Path d="M152 150 H180 C190 150 196 144 198 134 L210 70" stroke={c.body} strokeWidth={24} />
    <Path d="M36 150 V126" stroke={c.bodyHighlight} strokeWidth={4} opacity={0.9} />
  </G>
);

// Kollar: kavuşturulmuş (gövdenin önünde çizilir)
const ARMS_CROSS = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M171 166 C152 176 122 186 94 186" stroke={c.outline} strokeWidth={34} />
    <Path d="M171 166 C152 176 122 186 94 186" stroke={c.bodyShade} strokeWidth={22} />
    <Path d="M69 170 C90 182 122 190 148 184" stroke={c.outline} strokeWidth={34} />
    <Path d="M69 170 C90 182 122 190 148 184" stroke={c.body} strokeWidth={22} />
    <Path d="M92 179 C106 184 122 186 136 184" stroke={c.bodyHighlight} strokeWidth={3.5} opacity={0.9} />
  </G>
);

// Kollar: genç aşamanın kısa kolları
const ARMS_NUBS = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M94 190 H80 C75 190 72 187 72 182 V172" stroke={c.outline} strokeWidth={30} />
    <Path d="M146 178 H160 C165 178 168 175 168 170 V160" stroke={c.outline} strokeWidth={30} />
    <Path d="M94 190 H80 C75 190 72 187 72 182 V172" stroke={c.body} strokeWidth={19} />
    <Path d="M146 178 H160 C165 178 168 175 168 170 V160" stroke={c.body} strokeWidth={19} />
  </G>
);

// Kollar: solgun
const ARMS_WILTED = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M88 178 H66 C57 178 52 184 52 193 V218" stroke={c.outline} strokeWidth={34} />
    <Path d="M152 184 H172 C181 184 186 190 186 199 V220" stroke={c.outline} strokeWidth={34} />
    <Path d="M88 178 H66 C57 178 52 184 52 193 V218" stroke={c.wiltedBody} strokeWidth={22} />
    <Path d="M152 184 H172 C181 184 186 190 186 199 V220" stroke={c.wiltedBody} strokeWidth={22} />
  </G>
);

// Gövde: tam ve çiçek aşaması
const BODY_FULL = (
  <>
    <Path d="M74 240 C66 198 63 152 66 112 C69 68 92 40 120 40 C148 40 171 68 174 112 C177 152 174 198 166 240 Z" fill={c.body} />
    <Path d="M131 42 C154 48 171 72 174 112 C177 152 174 198 166 240 L150 240 C156 200 158 156 155 116 C152 82 144 58 131 42 Z" fill={c.bodyShade} />
    <Path d="M97 47 C89 100 87 170 92 238" fill="none" stroke={c.ribLeft} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <Path d="M143 47 C151 100 153 170 148 238" fill="none" stroke={c.ribRight} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
    <Path d="M79 104 C81 80 93 60 109 51" fill="none" stroke={c.bodyHighlight} strokeWidth={6} strokeLinecap="round" />
    <Circle cx={77} cy={122} r={3.2} fill={c.bodyHighlight} />
    <G fill={c.spine}>
      <Circle cx={93} cy={166} r={2.2} />
      <Circle cx={91} cy={204} r={2.2} />
      <Circle cx={148} cy={166} r={2.2} />
      <Circle cx={149} cy={204} r={2.2} />
      <Circle cx={99} cy={66} r={2.2} />
      <Circle cx={141} cy={66} r={2.2} />
      <Circle cx={80} cy={176} r={1.8} />
      <Circle cx={160} cy={150} r={1.8} opacity={0.7} />
    </G>
    <Path d="M67.5 100 L58 96 M173 100 L182 96 M69 214 L60 216 M171 214 L180 216" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" />
    <Path d="M74 240 C66 198 63 152 66 112 C69 68 92 40 120 40 C148 40 171 68 174 112 C177 152 174 198 166 240 Z" fill="none" stroke={c.outline} strokeWidth={6} strokeLinejoin="round" />
  </>
);

// Gövde: genç
const BODY_YOUNG = (
  <>
    <Path d="M80 240 C74 208 71 176 73 148 C75 110 95 86 120 86 C145 86 165 110 167 148 C169 176 166 208 160 240 Z" fill={c.body} />
    <Path d="M129 88 C148 94 164 116 167 148 C169 176 166 208 160 240 L147 240 C152 208 154 180 152 152 C150 122 142 102 129 88 Z" fill={c.bodyShade} />
    <Path d="M100 92 C93 136 92 190 96 238" fill="none" stroke={c.ribLeft} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
    <Path d="M140 92 C147 136 148 190 144 238" fill="none" stroke={c.ribRight} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
    <Path d="M85 142 C87 122 97 106 110 98" fill="none" stroke={c.bodyHighlight} strokeWidth={5.5} strokeLinecap="round" />
    <G fill={c.spine}>
      <Circle cx={96} cy={212} r={2.2} />
      <Circle cx={144} cy={212} r={2.2} />
      <Circle cx={101} cy={104} r={2} />
      <Circle cx={139} cy={104} r={2} />
    </G>
    <Path d="M80 240 C74 208 71 176 73 148 C75 110 95 86 120 86 C145 86 165 110 167 148 C169 176 166 208 160 240 Z" fill="none" stroke={c.outline} strokeWidth={6} strokeLinejoin="round" />
  </>
);

// Gövde: filiz
const BODY_SPROUT = (
  <>
    <Path d="M88 240 C84 220 84 198 90 184 C97 168 108 160 120 160 C132 160 143 168 150 184 C156 198 156 220 152 240 Z" fill={c.body} />
    <Path d="M127 161 C141 165 151 178 153 196 C155 214 154 230 152 240 L141 240 C144 224 144 208 142 196 C140 182 135 168 127 161 Z" fill={c.bodyShade} />
    <Path d="M95 200 C96 186 102 176 110 170" fill="none" stroke={c.bodyHighlight} strokeWidth={4.5} strokeLinecap="round" />
    <Path d="M88 240 C84 220 84 198 90 184 C97 168 108 160 120 160 C132 160 143 168 150 184 C156 198 156 220 152 240 Z" fill="none" stroke={c.outline} strokeWidth={5.5} strokeLinejoin="round" />
  </>
);

// Gövde: solgun
const BODY_WILTED = (
  <>
    <Path d="M76 240 C69 208 66 178 70 152 C74 122 92 98 118 88 C142 79 166 84 178 100 C189 114 186 134 172 142 C164 147 160 156 160 172 C160 198 163 222 164 240 Z" fill={c.wiltedBody} />
    <Path d="M172 142 C164 147 160 156 160 172 C160 198 163 222 164 240 L150 240 C149 212 148 184 150 164 C152 152 160 144 172 142 Z" fill={c.wiltedShade} />
    <Path d="M82 156 C84 132 96 112 114 102" fill="none" stroke={c.wiltedHighlight} strokeWidth={5.5} strokeLinecap="round" />
    <G fill={c.wiltedSpine}>
      <Circle cx={96} cy={200} r={2.2} />
      <Circle cx={146} cy={206} r={2.2} />
    </G>
    <Path d="M70 186 L61 186 M179 101 L187 95 M150 86 L152 78" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" />
    <Path d="M76 240 C69 208 66 178 70 152 C74 122 92 98 118 88 C142 79 166 84 178 100 C189 114 186 134 172 142 C164 147 160 156 160 172 C160 198 163 222 164 240 Z" fill="none" stroke={c.outline} strokeWidth={6} strokeLinejoin="round" />
  </>
);

// Tepe dikenleri: tam
const TUFT_FULL = (
  <G fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round">
    <Path d="M120 41 L110 26 M120 40 L120 21 M120 41 L130 26" />
  </G>
);

// Tepe dikenleri: genç
const TUFT_YOUNG = (
  <G fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round">
    <Path d="M120 87 L112 74 M120 86 L120 70 M120 87 L128 74" />
  </G>
);

// Tepe dikenleri: filiz
const TUFT_SPROUT = (
  <G fill="none" stroke={c.outline} strokeWidth={4} strokeLinecap="round">
    <Path d="M120 161 L114 150 M120 160 L120 147 M120 161 L126 150" />
  </G>
);

// Çiçek (çiçek aşaması)
const FLOWER = (
  <G stroke={c.outline} strokeWidth={3.5} strokeLinejoin="round">
    <Circle cx={120} cy={15.5} r={11} fill={c.petal} />
    <Circle cx={131.9} cy={24.1} r={11} fill={c.petal} />
    <Circle cx={127.3} cy={38.1} r={11} fill={c.petal} />
    <Circle cx={112.7} cy={38.1} r={11} fill={c.petal} />
    <Circle cx={108.1} cy={24.1} r={11} fill={c.petal} />
    <Circle cx={120} cy={28} r={8.5} fill={c.flowerCenter} />
    <Path d="M116 24.5 Q118 22.5 121 23" fill="none" stroke={c.flowerShine} strokeWidth={2.5} strokeLinecap="round" />
  </G>
);

// Aksesuar: kafa bandı
const BAND = (
  <G fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M170 72 L190 62 M170 75 L188 88" stroke={c.outline} strokeWidth={13} />
    <Path d="M170 72 L190 62 M170 75 L188 88" stroke={c.band} strokeWidth={6} />
    <Path d="M66 74 Q120 56 174 74" stroke={c.outline} strokeWidth={21} />
    <Path d="M66 74 Q120 56 174 74" stroke={c.band} strokeWidth={13} />
    <Path d="M84 66 Q104 60 116 59" stroke={c.bandShine} strokeWidth={3.5} />
  </G>
);

// Aksesuar: güneş gözlüğü
const GLASSES = (
  <>
    <Path d="M84 106 L68 101 M156 106 L172 101" fill="none" stroke={c.outline} strokeWidth={4} strokeLinecap="round" />
    <Path d="M116 109 Q120 105.5 124 109" fill="none" stroke={c.outline} strokeWidth={4} strokeLinecap="round" />
    <Path d="M83 103 H117 V115 C117 124 111 129 102 129 H98 C89 129 83 124 83 115 Z" fill={c.outline} />
    <Path d="M123 103 H157 V115 C157 124 151 129 142 129 H138 C129 129 123 124 123 115 Z" fill={c.outline} />
    <Path d="M89 110 L97 110 M129 110 L137 110" fill="none" stroke={c.eyeWhite} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
    <Path d="M89 116 L92 116 M129 116 L132 116" fill="none" stroke={c.eyeWhite} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
  </>
);

// Saksı
const POT = (
  <>
    <Path d="M66 250 H174 L166 288 C165 292 162 294 158 294 H82 C78 294 75 292 74 288 Z" fill={c.pot} />
    <Path d="M150 250 H174 L166 288 C165 292 162 294 158 294 H144 Z" fill={c.potShade} />
    <Path d="M66 250 H174 L166 288 C165 292 162 294 158 294 H82 C78 294 75 292 74 288 Z" fill="none" stroke={c.outline} strokeWidth={6} strokeLinejoin="round" />
    <Path d="M71 255.5 H169" fill="none" stroke={c.potLine} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
    <Rect x={58} y={226} width={124} height={25} rx={10} fill={c.potRim} stroke={c.outline} strokeWidth={6} />
    <Path d="M71 233.5 H138" fill="none" stroke={c.potRimShine} strokeWidth={4} strokeLinecap="round" />
  </>
);

// Saksı çatlağı (solgun)
const CRACK = (
  <>
    <Path d="M104 253 L111 263 L105 273 L112 286" fill="none" stroke={c.outline} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

// Efekt: parıltı (gurur, coşku)
const FX_SPARKLE = (
  <G stroke={c.outline} strokeWidth={2.5} strokeLinejoin="round">
    <Path d="M204 34 L207.4 44.6 L218 48 L207.4 51.4 L204 62 L200.6 51.4 L190 48 L200.6 44.6 Z" fill={c.sparkle} />
    <Path d="M34 52 L36.5 59.5 L44 62 L36.5 64.5 L34 72 L31.5 64.5 L24 62 L31.5 59.5 Z" fill={c.sparkle} />
    <Path d="M214 114 L216 120 L222 122 L216 124 L214 130 L212 124 L206 122 L212 120 Z" fill={c.sparkle} />
  </G>
);

// Efekt: ter damlası (endişe)
const FX_SWEAT = (
  <>
    <Path d="M168 56 C173 64 176 69 176 73.5 C176 78.5 172.4 82 168 82 C163.6 82 160 78.5 160 73.5 C160 69 163 64 168 56 Z" fill={c.drop} stroke={c.outline} strokeWidth={3} strokeLinejoin="round" />
  </>
);

// Efekt: Zzz (uykulu)
const FX_ZZZ = (
  <G fill="none" stroke={c.outline} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M160 62 H171 L160 74 H171" strokeWidth={3.5} />
    <Path d="M180 34 H195 L180 51 H195" strokeWidth={4} />
  </G>
);

// Efekt: el sallama çizgileri (selam)
const FX_WAVE = (
  <G fill="none" stroke={c.outline} strokeWidth={4} strokeLinecap="round">
    <Path d="M222 60 Q229 70 224 82" />
    <Path d="M228 46 Q238 62 233 80" />
  </G>
);

// Efekt: şaşkınlık çizgileri (şaşkın)
const FX_SHOCK = (
  <G fill="none" stroke={c.outline} strokeWidth={4} strokeLinecap="round">
    <Path d="M72 50 L62 40 M62 68 L50 64 M168 50 L178 40 M178 68 L190 64" />
  </G>
);

const FACES: Record<DikenMood, ReactElement> = {
  mutlu: (
    <>
      <Ellipse cx={84} cy={134} rx={7} ry={4.2} fill={c.cheek} opacity={0.6} />
      <Ellipse cx={156} cy={134} rx={7} ry={4.2} fill={c.cheek} opacity={0.6} />
      <Ellipse cx={101} cy={114} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Ellipse cx={139} cy={114} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={102} cy={116} r={6.5} fill={c.outline} />
      <Circle cx={140} cy={116} r={6.5} fill={c.outline} />
      <Circle cx={104.3} cy={113.3} r={2.4} fill={c.eyeWhite} />
      <Circle cx={142.3} cy={113.3} r={2.4} fill={c.eyeWhite} />
      <Path d="M90 94 Q100 88 111 92 M129 92 Q140 88 150 94" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M106 134 C109 148 131 148 134 134 Z" fill={c.outline} stroke={c.outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M113 142 C116 139.6 124 139.6 127 142 C124 144.2 116 144.2 113 142 Z" fill={c.tongue} />
    </>
  ),
  selam: (
    <>
      <Ellipse cx={84} cy={134} rx={7} ry={4.2} fill={c.cheek} opacity={0.6} />
      <Ellipse cx={156} cy={134} rx={7} ry={4.2} fill={c.cheek} opacity={0.6} />
      <Ellipse cx={101} cy={114} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={102} cy={116} r={6.5} fill={c.outline} />
      <Circle cx={104.3} cy={113.3} r={2.4} fill={c.eyeWhite} />
      <Path d="M128 117 Q139 105 150 117" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M90 94 Q100 88 111 92 M129 96 Q140 90 150 96" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M106 134 C109 148 131 148 134 134 Z" fill={c.outline} stroke={c.outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M113 142 C116 139.6 124 139.6 127 142 C124 144.2 116 144.2 113 142 Z" fill={c.tongue} />
    </>
  ),
  laf: (
    <>
      <Ellipse cx={101} cy={115} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={105} cy={119} r={6} fill={c.outline} />
      <Circle cx={107} cy={116.6} r={2.1} fill={c.eyeWhite} />
      <Path d="M87 115 A14 16 0 0 1 115 115 Z" fill={c.body} />
      <Path d="M87.5 115 L114.5 115" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" />
      <Ellipse cx={139} cy={114} rx={12.5} ry={14.5} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={143} cy={117} r={6.5} fill={c.outline} />
      <Circle cx={145.3} cy={114.3} r={2.4} fill={c.eyeWhite} />
      <Path d="M89 101 L112 104" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M128 91 Q139 78 152 86" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M108 140 Q123 145 135 133" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M134 131 Q138.5 131.5 139 136" fill="none" stroke={c.outline} strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  cosku: (
    <>
      <Ellipse cx={84} cy={136} rx={7} ry={4.2} fill={c.cheek} opacity={0.65} />
      <Ellipse cx={156} cy={136} rx={7} ry={4.2} fill={c.cheek} opacity={0.65} />
      <Ellipse cx={101} cy={113} rx={12.5} ry={15} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Ellipse cx={139} cy={113} rx={12.5} ry={15} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={102} cy={112} r={7} fill={c.outline} />
      <Circle cx={140} cy={112} r={7} fill={c.outline} />
      <Circle cx={104.6} cy={109} r={2.8} fill={c.eyeWhite} />
      <Circle cx={142.6} cy={109} r={2.8} fill={c.eyeWhite} />
      <Circle cx={99.6} cy={115.4} r={1.3} fill={c.eyeWhite} />
      <Circle cx={137.6} cy={115.4} r={1.3} fill={c.eyeWhite} />
      <Path d="M90 90 Q100 83 111 88 M129 88 Q140 83 150 90" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M102 131 C104 154 136 154 138 131 Z" fill={c.outline} stroke={c.outline} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M110 144 C114 139.5 126 139.5 130 144 C126 147.2 114 147.2 110 144 Z" fill={c.tongue} />
    </>
  ),
  gurur: (
    <>
      <Ellipse cx={84} cy={132} rx={7.5} ry={4.5} fill={c.cheek} opacity={0.75} />
      <Ellipse cx={156} cy={132} rx={7.5} ry={4.5} fill={c.cheek} opacity={0.75} />
      <Path d="M90 117 Q101 104 112 117 M128 117 Q139 104 150 117" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M91 95 Q100 90 110 93 M130 93 Q140 90 149 95" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M104 134 Q120 149 136 134" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
    </>
  ),
  endise: (
    <>
      <Ellipse cx={101} cy={116} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Ellipse cx={139} cy={116} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={100} cy={111} r={6} fill={c.outline} />
      <Circle cx={138} cy={111} r={6} fill={c.outline} />
      <Circle cx={102.2} cy={108.6} r={2.2} fill={c.eyeWhite} />
      <Circle cx={140.2} cy={108.6} r={2.2} fill={c.eyeWhite} />
      <Path d="M89 102 Q100 100 110 94 M130 94 Q140 100 151 102" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M110 143 Q115 137.5 120 141 Q125 144.5 130 139" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  saskin: (
    <>
      <Ellipse cx={101} cy={112} rx={13.5} ry={16} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Ellipse cx={139} cy={112} rx={13.5} ry={16} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={101} cy={113} r={4.4} fill={c.outline} />
      <Circle cx={139} cy={113} r={4.4} fill={c.outline} />
      <Path d="M88 88 Q100 80 112 85 M128 85 Q140 80 152 88" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Ellipse cx={120} cy={141} rx={7.5} ry={9.5} fill={c.outline} />
    </>
  ),
  uykulu: (
    <>
      <Ellipse cx={84} cy={132} rx={7} ry={4.2} fill={c.cheek} opacity={0.45} />
      <Ellipse cx={156} cy={132} rx={7} ry={4.2} fill={c.cheek} opacity={0.45} />
      <Path d="M90 114 Q101 122 112 114 M128 114 Q139 122 150 114" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M91 101 Q100 98 109 100 M131 100 Q140 98 149 101" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Ellipse cx={120} cy={139} rx={4.5} ry={3.8} fill={c.outline} />
    </>
  ),
  solgun: (
    <>
      <Ellipse cx={101} cy={116} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Ellipse cx={139} cy={116} rx={12} ry={14} fill={c.eyeWhite} stroke={c.outline} strokeWidth={4} />
      <Circle cx={100} cy={121} r={6.5} fill={c.outline} />
      <Circle cx={138} cy={121} r={6.5} fill={c.outline} />
      <Circle cx={102.2} cy={118.3} r={2.3} fill={c.eyeWhite} />
      <Circle cx={140.2} cy={118.3} r={2.3} fill={c.eyeWhite} />
      <Circle cx={97.8} cy={124} r={1.2} fill={c.eyeWhite} />
      <Circle cx={135.8} cy={124} r={1.2} fill={c.eyeWhite} />
      <Path d="M89 102 Q100 100 110 94 M130 94 Q140 100 151 102" fill="none" stroke={c.outline} strokeWidth={5} strokeLinecap="round" />
      <Path d="M110 146 Q120 137 130 146" fill="none" stroke={c.outline} strokeWidth={4.5} strokeLinecap="round" />
      <Path d="M87 133 C90.5 138.5 91.5 141 91.5 143 C91.5 145.5 89.5 147.5 87 147.5 C84.5 147.5 82.5 145.5 82.5 143 C82.5 141 83.5 138.5 87 133 Z" fill={c.drop} stroke={c.outline} strokeWidth={2.5} strokeLinejoin="round" />
    </>
  ),
};

const ARMS: Record<Exclude<DikenPose, 'cross'>, ReactElement> = {
  relaxed: ARMS_RELAXED,
  akimbo: ARMS_AKIMBO,
  up: ARMS_UP,
  droop: ARMS_DROOP,
  wave: ARMS_WAVE,
};

function Diken({
  mood = 'mutlu',
  stage = 'tam',
  gear = 'yok',
  size = DEFAULT_SIZE,
  pose,
}: DikenProps) {
  // react-native-svg genişliği parseInt ile keser; yükseklikle aynı tam sayı tabanını kullan.
  const width = Math.round(size || DEFAULT_SIZE);
  const height = Math.round(width * ASPECT);

  const wilted = mood === 'solgun';
  const full = !wilted && (stage === 'tam' || stage === 'cicek');
  const young = !wilted && stage === 'genc';
  const sprout = !wilted && stage === 'filiz';
  // Tasarımdaki geri dönüşler: tipler dışından gelen değerlerde (ör. sunucu verisi) de çizim bozulmasın.
  const armPose = pose || POSE_BY_MOOD[mood] || 'relaxed';

  const faceTransform = wilted
    ? FACE_TRANSFORM.wilted
    : young
      ? FACE_TRANSFORM.young
      : sprout
        ? FACE_TRANSFORM.sprout
        : FACE_TRANSFORM.none;
  const fxTransform = young ? FX_TRANSFORM.young : sprout ? FX_TRANSFORM.sprout : FX_TRANSFORM.none;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={VIEW_BOX}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Diken, ${LABELS[mood] ?? LABELS.mutlu}`}>
      {SHADOW}

      {full && armPose !== 'cross' && ARMS[armPose]}
      {young && ARMS_NUBS}
      {wilted && ARMS_WILTED}

      {full && BODY_FULL}
      {full && armPose === 'cross' && ARMS_CROSS}
      {young && BODY_YOUNG}
      {sprout && BODY_SPROUT}
      {wilted && BODY_WILTED}

      {full && stage === 'tam' && TUFT_FULL}
      {young && TUFT_YOUNG}
      {sprout && TUFT_SPROUT}
      {full && stage === 'cicek' && FLOWER}
      {full && gear === 'bant' && BAND}

      <G transform={faceTransform}>{FACES[mood]}</G>

      {full && gear === 'gozluk' && GLASSES}

      {POT}
      {wilted && CRACK}

      <G transform={fxTransform}>
        {(mood === 'gurur' || mood === 'cosku') && FX_SPARKLE}
        {mood === 'endise' && FX_SWEAT}
        {mood === 'uykulu' && FX_ZZZ}
        {mood === 'selam' && full && FX_WAVE}
        {mood === 'saskin' && FX_SHOCK}
      </G>
    </Svg>
  );
}

export default memo(Diken);
