import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Diken from '@/components/Diken';
import { challengeIcons, ShareIcon } from '@/components/icons';
import { IconButton } from '@/components/ui';
import type { ChallengeCategory, ChallengeIconKey } from '@/data';
import { categoryTint, challengeTints, layout, useTheme } from '@/theme';
import { previewMetrics as m } from '@/theme/explore';

import CoffeeIllustration from './CoffeeIllustration';

type Props = {
  icon: ChallengeIconKey;
  category: ChallengeCategory;
  onBack: () => void;
  onShare: () => void;
};

// Önizleme üst alanı: kategori renginde zemin, geri/paylaş, illüstrasyon ve Diken (ChallengePreview.dc.html).
export default function PreviewHero({ icon, category, onBack, onShare }: Props) {
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = challengeTints[categoryTint(category)][scheme];
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
        <IconButton icon="back" tone="onColor" accessibilityLabel="Geri" onPress={onBack} />
        <IconButton
          icon={ShareIcon}
          tone="onColor"
          accessibilityLabel="Paylaş"
          onPress={onShare}
          iconSize={m.shareIconSize}
          iconStrokeWidth={m.shareIconStrokeWidth}
        />
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
