import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { BackIcon, challengeIcons } from '@/components/icons';
import type { ChallengeIconKey, ChallengeTintKey } from '@/data';
import { challengeTints, layout, useTheme } from '@/theme';
import { previewColors, previewMetrics as m } from '@/theme/explore';

import CoffeeIllustration from './CoffeeIllustration';
import { ShareIcon } from './icons';

type Props = {
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  onBack: () => void;
  onShare: () => void;
};

// Önizleme üst alanı: şablon renginde zemin, geri/paylaş, illüstrasyon ve Diken (ChallengePreview.dc.html).
export default function PreviewHero({ icon, tint, onBack, onShare }: Props) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = challengeTints[tint][scheme];
  const top = insets.top + layout.screenTopGap;
  const Icon = challengeIcons[icon];

  return (
    <View style={[styles.hero, { height: top + m.heroBelowTop, backgroundColor: t.bg }]}>
      {/* Tasarımda yalnızca kahve illüstrasyonu var; diğer şablonlarda büyük çizgi ikon */}
      <View style={[styles.illustration, { top: top + m.illustrationTopFromButtons }]} pointerEvents="none">
        {icon === 'coffee' ? (
          <CoffeeIllustration />
        ) : (
          <Icon color={t.ink} size={m.fallbackIconSize} strokeWidth={m.fallbackIconStrokeWidth} />
        )}
      </View>
      <View style={styles.diken} pointerEvents="none">
        <Diken mood="saskin" stage="tam" size={m.dikenSize} />
      </View>

      <View style={[styles.buttons, { top }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          style={[styles.button, { backgroundColor: previewColors[scheme].headerButtonBg }]}>
          <BackIcon color={colors.text} size={m.headerIconSize} strokeWidth={m.backIconStrokeWidth} />
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Paylaş"
          style={[styles.button, { backgroundColor: previewColors[scheme].headerButtonBg }]}>
          <ShareIcon color={colors.text} size={m.headerIconSize} strokeWidth={m.shareIconStrokeWidth} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomLeftRadius: m.heroRadius,
    borderBottomRightRadius: m.heroRadius,
    overflow: 'hidden',
  },
  buttons: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: m.headerButton,
    height: m.headerButton,
    borderRadius: m.headerButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    position: 'absolute',
    left: m.illustrationLeft,
    width: m.illustrationWidth,
    height: m.illustrationHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diken: {
    position: 'absolute',
    right: m.dikenRight,
    bottom: m.dikenBottom,
  },
});
