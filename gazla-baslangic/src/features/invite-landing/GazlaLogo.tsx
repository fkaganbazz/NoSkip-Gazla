import { StyleSheet, Text, View } from 'react-native';

import { DikenFaceIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Uygulama ikonu (Diken yüzü) + uygulama adı ("Gazla" / "NoSkip"; InviteLanding.dc.html üst satır).
export default function GazlaLogo() {
  const { colors, scheme } = useTheme();
  const t = useT();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={t.common.appName}>
      <View style={[styles.icon, { backgroundColor: inviteColors[scheme].logoBg }]}>
        <DikenFaceIcon size={m.logoSize} />
      </View>
      <Text style={[inviteTypography.logo, { color: colors.text }]}>{t.common.appName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: m.logoGap,
  },
  icon: {
    width: m.logoSize,
    height: m.logoSize,
    borderRadius: m.logoRadius,
    overflow: 'hidden',
  },
});
