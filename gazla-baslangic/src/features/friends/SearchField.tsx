import { forwardRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { borderWidth, componentColors, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
};

// Kullanıcı adıyla arama alanı: 48 px, solda büyüteç (Friends.dc.html).
const SearchField = forwardRef<TextInput, Props>(function SearchField({ value, onChangeText }, ref) {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.wrap}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder="Kullanıcı adıyla ara"
        placeholderTextColor={componentColors[scheme].placeholder}
        accessibilityLabel="Kullanıcı adıyla ara"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[
          styles.input,
          socialTypography.search,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
      <View style={styles.icon}>
        <SearchIcon color={colors.textSecondary} size={m.searchIconSize} strokeWidth={m.searchIconStrokeWidth} />
      </View>
    </View>
  );
});

export default SearchField;

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
    pointerEvents: 'none',
  },
});
