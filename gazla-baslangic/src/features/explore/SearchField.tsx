import { StyleSheet, TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { borderWidth, componentColors, useTheme } from '@/theme';
import { exploreMetrics as m, exploreTypography } from '@/theme/explore';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

// "Challenge ara" alanı, solda büyüteç (Explore.dc.html).
export default function SearchField({ value, onChangeText }: Props) {
  const { colors, scheme } = useTheme();

  return (
    <View style={styles.wrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Challenge ara"
        placeholderTextColor={componentColors[scheme].placeholder}
        accessibilityLabel="Challenge ara"
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={[
          styles.input,
          exploreTypography.search,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
      <View style={styles.icon} pointerEvents="none">
        <SearchIcon color={colors.textSecondary} size={m.searchIconSize} strokeWidth={m.searchIconStrokeWidth} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: m.searchMarginTop,
  },
  input: {
    height: m.searchHeight,
    paddingLeft: m.searchPaddingLeft,
    paddingRight: m.searchPaddingRight,
    borderRadius: m.searchRadius,
    borderWidth: borderWidth.thin,
  },
  icon: {
    position: 'absolute',
    left: m.searchIconLeft,
    top: m.searchIconTop,
  },
});
