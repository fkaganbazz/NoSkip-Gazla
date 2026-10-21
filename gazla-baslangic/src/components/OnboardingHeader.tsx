/**
 * Onboarding adım başlığı — PickChallenge, SignIn, Profile, InviteFriends, NotifPermission (dc.html):
 * 44 px geri butonu + 4 parçalı ilerleme (8 yükseklik, köşe 4, dolu #1F7A45, boş #E3D8CC) + "n/4".
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconButton } from '@/components/ui';
import { componentColors, componentMetrics as cm, componentTypography as ct, useTheme } from '@/theme';

type Props = {
  /** 1–4 */
  step: number;
  /** Bulunulan adımın yarısı dolu (SignIn 2/4) */
  half?: boolean;
  /** Yoksa geri butonunun yeri boş kalır (ör. profil tamamlandıktan sonra geri dönülmez) */
  onBack?: () => void;
  /** permission: yeşil zeminli bildirim izni ekranı (geri kenarı #D5EBDD, etiket #3F3358) */
  tone?: 'default' | 'permission';
  style?: StyleProp<ViewStyle>;
};

export default function OnboardingHeader({ step, half = false, onBack, tone = 'default', style }: Props) {
  const { scheme } = useTheme();
  const c = componentColors[scheme];
  const permission = tone === 'permission';

  return (
    <View style={[styles.row, style]}>
      {onBack ? (
        <IconButton
          icon="back"
          accessibilityLabel="Geri"
          onPress={onBack}
          style={permission && { borderColor: c.permissionBackBorder }}
        />
      ) : (
        <View style={styles.backSpace} />
      )}

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Adım ${step} / ${cm.stepCount}`}
        accessibilityValue={{ min: 1, max: cm.stepCount, now: step }}
        style={styles.steps}>
        {Array.from({ length: cm.stepCount }, (_, i) => {
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
        importantForAccessibility="no"
        accessibilityElementsHidden
        style={[ct.stepLabel, styles.label, { color: permission ? c.stepLabelPermission : c.stepLabel }]}>
        {step}/{cm.stepCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.headerGap,
  },
  backSpace: {
    width: cm.iconButton,
    height: cm.iconButton,
  },
  steps: {
    flex: 1,
    flexDirection: 'row',
    gap: cm.stepGap,
  },
  step: {
    flex: 1,
    height: cm.stepHeight,
    borderRadius: cm.stepRadius,
    overflow: 'hidden',
  },
  halfFill: {
    width: '50%',
    height: '100%',
  },
  label: {
    width: cm.stepLabelWidth,
    textAlign: 'right',
  },
});
