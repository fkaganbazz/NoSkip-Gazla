import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon } from '@/components/icons';
import { componentMetrics as cm, borderWidth, typography, useTheme } from '@/theme';
import { onboardingColors, onboardingMetrics as m } from '@/theme/onboarding';

export const STEP_COUNT = 4;

type Props = {
  /** 1–4 */
  step: number;
  /** SignIn: bulunulan adımın yarısı dolu */
  half?: boolean;
  /** Yoksa geri butonunun yeri boş kalır (profil tamamlandıktan sonra geri dönülmez) */
  onBack?: () => void;
  /** NotifPermission: yeşil zemin tonu */
  tone?: 'default' | 'permission';
};

// Adım başlığı: geri butonu + 4 parçalı ilerleme + "1/4" (PickChallenge, SignIn, Profile,
// InviteFriends, NotifPermission).
export default function StepHeader({ step, half = false, onBack, tone = 'default' }: Props) {
  const { colors, scheme } = useTheme();
  const c = onboardingColors[scheme];
  const permission = tone === 'permission';

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={4}
          style={({ pressed }) => [
            styles.back,
            {
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderColor: permission ? c.permissionBackBorder : colors.border,
            },
          ]}>
          <BackIcon color={colors.text} size={cm.backIconSize} strokeWidth={cm.backIconStroke} />
        </Pressable>
      ) : (
        <View style={styles.backSpace} />
      )}

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Adım ${step} / ${STEP_COUNT}`}
        accessibilityValue={{ min: 1, max: STEP_COUNT, now: step }}
        style={styles.steps}>
        {Array.from({ length: STEP_COUNT }, (_, i) => {
          const current = i === step - 1;
          const filled = i < step - 1 || (current && !half);
          return (
            <View key={i} style={[styles.step, { backgroundColor: filled ? c.stepFilled : c.stepEmpty }]}>
              {current && half && <View style={[styles.halfFill, { backgroundColor: c.stepFilled }]} />}
            </View>
          );
        })}
      </View>

      <Text
        style={[typography.captionStrong, styles.label, { color: permission ? c.permissionStepLabel : c.stepLabel }]}>
        {step}/{STEP_COUNT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.stepHeaderGap,
  },
  back: {
    width: cm.iconButton,
    height: cm.iconButton,
    borderRadius: cm.iconButton / 2,
    borderWidth: borderWidth.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpace: {
    width: cm.iconButton,
    height: cm.iconButton,
  },
  steps: {
    flex: 1,
    flexDirection: 'row',
    gap: m.stepGap,
  },
  step: {
    flex: 1,
    height: m.stepHeight,
    borderRadius: m.stepRadius,
    overflow: 'hidden',
  },
  halfFill: {
    width: '50%',
    height: '100%',
  },
  label: {
    width: m.stepLabelWidth,
    textAlign: 'right',
  },
});
