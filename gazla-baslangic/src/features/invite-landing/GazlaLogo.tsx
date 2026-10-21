import { StyleSheet, Text, View } from 'react-native';

import { DikenFaceIcon } from '@/components/icons';
import { useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Uygulama ikonu (Diken yüzü) + "Gazla" yazısı (InviteLanding.dc.html üst satır).
export default function GazlaLogo() {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Gazla">
      <View style={[styles.icon, { backgroundColor: inviteColors[scheme].logoBg }]}>
        <DikenFaceIcon size={m.logoSize} />
      </View>
      <Text style={[inviteTypography.logo, { color: colors.text }]}>Gazla</Text>
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
