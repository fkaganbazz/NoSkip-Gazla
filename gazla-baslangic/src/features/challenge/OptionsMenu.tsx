import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { challengeColors, challengeMetrics as m } from '@/theme/challenge';
import { borderWidth, componentTypography, layout, spacing, typography, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onInvite?: () => void;
  onReport: () => void;
  /** Verilmezse "Ayrıl" seçeneği görünmez (bitmiş challenge, aktif olmayan üye) */
  onLeave?: () => void;
  leaving: boolean;
  leaveError: string | null;
};

// "Challenge seçenekleri" menüsü. Tasarımda yalnızca üç nokta butonu var; menü Components.dc.html
// kart/buton kurallarıyla çizildi. Ayrılmadan önce aynı pencerede onay istenir.
export default function OptionsMenu({ visible, onClose, onInvite, onReport, onLeave, leaving, leaveError }: Props) {
  const { colors, scheme } = useTheme();
  const c = challengeColors[scheme];
  const insets = useSafeAreaInsets();
  const [confirm, setConfirm] = useState(false);

  const close = () => {
    if (leaving) return;
    setConfirm(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable accessibilityLabel="Menüyü kapat" onPress={close} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} />
      {confirm ? (
        <View style={styles.center}>
          <View style={[styles.confirm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[typography.title2, { color: colors.text }]}>
              Challenge'dan ayrıl?
            </Text>
            <Text style={[typography.body, { color: colors.textBody }]}>
              Bu challenge artık Bugün listende görünmez ve grup sıralamasından çıkarsın.
            </Text>
            {leaveError && (
              <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, { color: colors.danger }]}>
                {leaveError}
              </Text>
            )}
            <Button title="Ayrıl" variant="danger" loading={leaving} onPress={onLeave} />
            <Button title="Vazgeç" variant="text" disabled={leaving} onPress={close} />
          </View>
        </View>
      ) : (
        <View
          accessibilityRole="menu"
          style={[
            styles.menu,
            { top: insets.top + layout.screenTopGap + m.menuTop, backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {onInvite && <Item label="Arkadaş davet et" onPress={onInvite} />}
          <Item label="Şikayet et" onPress={onReport} />
          {onLeave && <Item label="Challenge'dan ayrıl" danger onPress={() => setConfirm(true)} />}
        </View>
      )}
    </Modal>
  );
}

function Item({ label, danger, onPress }: { label: string; danger?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <Text style={[typography.cardTitle, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: layout.screenPadding,
    padding: m.menuPadding,
    borderRadius: m.menuRadius,
    borderWidth: borderWidth.thin,
    minWidth: m.menuMinWidth,
  },
  item: {
    minHeight: m.menuRowHeight,
    paddingHorizontal: m.menuRowPaddingX,
    borderRadius: m.menuRadius - m.menuPadding,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    pointerEvents: 'box-none',
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  confirm: {
    padding: layout.screenPadding,
    borderRadius: m.menuRadius,
    borderWidth: borderWidth.thin,
    gap: spacing.sm,
  },
});
