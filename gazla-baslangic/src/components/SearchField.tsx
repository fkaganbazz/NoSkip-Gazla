import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { borderWidth, componentColors, componentMetrics as cm, componentTypography as ct, useTheme } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** Yer tutucu; ekran okuyucu etiketi de bu (ör. "Kullanıcı adıyla ara", "Challenge ara") */
  placeholder: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Kenar boşluğu, konum */
  style?: StyleProp<ViewStyle>;
};

/**
 * Arama alanı: 48 px, köşe 16, 1 px kart kenarı, solda büyüteç — Friends.dc.html ("Kullanıcı adıyla ara"),
 * Explore.dc.html ("Challenge ara").
 */
const SearchField = forwardRef<TextInput, Props>(function SearchField(
  { value, onChangeText, placeholder, autoCapitalize, style },
  ref,
) {
  const { colors, scheme } = useTheme();
  return (
    <View style={style}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={componentColors[scheme].placeholder}
        accessibilityLabel={placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[
          styles.input,
          ct.search,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
      <View style={styles.icon}>
        <SearchIcon color={colors.textSecondary} size={cm.searchIconSize} strokeWidth={cm.searchIconStroke} />
      </View>
    </View>
  );
});

export default SearchField;

const styles = StyleSheet.create({
  input: {
    height: cm.searchHeight,
    paddingLeft: cm.searchPaddingLeft,
    paddingRight: cm.searchPaddingRight,
    borderRadius: cm.searchRadius,
    borderWidth: borderWidth.thin,
  },
  icon: {
    position: 'absolute',
    left: cm.searchIconLeft,
    top: cm.searchIconTop,
    pointerEvents: 'none',
  },
});
