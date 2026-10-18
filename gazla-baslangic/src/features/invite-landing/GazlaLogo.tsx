import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { dikenColors as d, useTheme } from '@/theme';
import { inviteColors, inviteMetrics as m, inviteTypography } from '@/theme/explore';

// Uygulama ikonu (Diken yüzü) + "Gazla" yazısı (InviteLanding.dc.html üst satır).
export default function GazlaLogo() {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Gazla">
      <View style={[styles.icon, { backgroundColor: inviteColors[scheme].logoBg }]}>
        <Svg width={m.logoSize} height={m.logoSize} viewBox="0 0 100 100">
          <Path d="M16 110 V58 C16 36 31 20 50 20 C69 20 84 36 84 58 V110 Z" fill={d.body} />
          <Path d="M58 21.5 C73 25 84 40 84 58 V110 H72 V60 C72 44 67 30 58 21.5 Z" fill={d.bodyShade} />
          <Path
            d="M50 20.5 L44 10 M50 20 L50 7 M50 20.5 L56 10"
            fill="none"
            stroke={d.body}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
          <Ellipse cx={38} cy={61} rx={8.5} ry={10} fill={d.eyeWhite} stroke={d.outline} strokeWidth={3} />
          <Circle cx={41} cy={64} r={4.5} fill={d.outline} />
          <Path d="M27.5 61 A10.5 12 0 0 1 48.5 61 Z" fill={d.body} />
          <Path d="M29 61 H47" fill="none" stroke={d.outline} strokeWidth={3.5} strokeLinecap="round" />
          <Ellipse cx={62} cy={60} rx={9} ry={10.5} fill={d.eyeWhite} stroke={d.outline} strokeWidth={3} />
          <Circle cx={65} cy={62} r={4.8} fill={d.outline} />
          <Circle cx={66.7} cy={60} r={1.6} fill={d.eyeWhite} />
          <Path
            d="M29 49.5 L46 52 M54 45 Q62 36 71 42 M41 79 Q52 82 61 73"
            fill="none"
            stroke={d.outline}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </Svg>
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
