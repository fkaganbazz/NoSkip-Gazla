/**
 * Arkadaş satırı ve şerit öğesi — Friends.dc.html (liste kartı, 62 px satır, Dürt / Gaz ver / Kabul et + sil),
 * Components.dc.html ("Arkadaş satırı"), Today.dc.html ve TodayDark.dc.html (yatay arkadaş şeridi).
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AddAvatar, Avatar } from '@/components/Avatar';
import { flatShadowStyle } from '@/components/FlatShadow';
import { CloseIcon } from '@/components/icons';
import type { AvatarTintKey } from '@/data/types';
import { borderWidth, cardColors, cardMetrics as m, cardTypography, layout, useTheme } from '@/theme';

/** Satırda gösterilen kişi (PersonLite, FriendToday, FriendRequest.person … hepsi uyar) */
export type FriendRowPerson = {
  displayName: string;
  avatarTint: AvatarTintKey;
  avatarUrl?: string | null;
};

// Satır butonu ---------------------------------------------------------------------------------------

export type FriendRowButtonVariant = 'action' | 'muted' | 'hype' | 'poke' | 'ink';

type FriendRowButtonProps = {
  title: string;
  onPress?: () => void;
  /** action: Kabul et / Ekle · muted: sil, Gönderildi · hype: Gaz ver · poke: Dürt · ink: Paylaş, Karşılık ver */
  variant: FriendRowButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  /** Metin yerine ikon (sil) — kare buton olur */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** 36 px satır butonu; dokunma alanı 44'e tamamlanır */
export function FriendRowButton({ title, onPress, variant, loading, disabled, accessibilityLabel, icon, style }: FriendRowButtonProps) {
  const { colors, scheme } = useTheme();
  const c = cardColors[scheme];
  const look = {
    action: { bg: colors.action, fg: colors.onAction, radius: m.rowButtonRadius, paddingX: m.rowButtonPaddingX, shadow: undefined },
    muted: { bg: colors.surfaceMuted, fg: colors.textBody, radius: m.rowButtonRadius, paddingX: m.rowButtonPaddingX, shadow: undefined },
    hype: { bg: c.hypeBg, fg: c.hypeText, radius: m.pillRadius, paddingX: m.rowButtonPaddingX, shadow: undefined },
    poke: { bg: colors.accent, fg: colors.onAccent, radius: m.pillRadius, paddingX: m.pokePaddingX, shadow: c.pokeShadow },
    ink: { bg: c.inkButtonBg, fg: c.inkButtonText, radius: m.rowButtonRadius, paddingX: m.rowButtonPaddingX, shadow: undefined },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      hitSlop={(layout.minTouchTarget - m.rowButtonHeight) / 2}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.bg,
          borderRadius: look.radius,
          paddingHorizontal: icon ? 0 : look.paddingX,
          width: icon ? m.rowButtonHeight : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        // Dürt hapı: tok gölge, basılınca aşağı iner; diğerleri basılınca solar
        look.shadow
          ? pressed
            ? { transform: [{ translateY: m.pokeShadow }] }
            : flatShadowStyle(m.pokeShadow, look.shadow)
          : pressed && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={look.fg} />
      ) : (
        (icon ?? <Text style={[cardTypography.rowButton, { color: look.fg }]}>{title}</Text>)
      )}
    </Pressable>
  );
}

// Satır ve liste kartı -------------------------------------------------------------------------------

/** Satırın sağındaki hazır aksiyonlar */
export type FriendRowAction =
  | { type: 'poke'; onPress: () => void; disabled?: boolean }
  | { type: 'hype'; onPress: () => void }
  /** Gelen istek: Kabul et + sil; onAccept yoksa giden istek (yalnızca geri çek) */
  | { type: 'request'; onAccept?: () => void; onDismiss: () => void; accepting?: boolean; dismissing?: boolean }
  | { type: 'add'; onPress: () => void; loading?: boolean }
  | { type: 'sent' };

type FriendRowProps = {
  person: FriendRowPerson;
  /** Bugünkü durum: pending → kesikli turuncu halka, done → tik rozeti; yoksa düz avatar */
  status?: 'pending' | 'done' | null;
  /** Alt satır: "@kullanıcı · 3 ortak", "11 gün seri · telefonsuz sabah" */
  sub?: string;
  /** Avatar + ad alanına basınca (profil) */
  onPress?: () => void;
  accessibilityLabel?: string;
  action?: FriendRowAction;
  /** Hazır aksiyonlar yetmezse sağ taraf (action yerine) */
  trailing?: ReactNode;
  /** Altında ayraç çizgisi (listede son satır hariç) */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 62 px kişi satırı: halkalı avatar, ad + alt bilgi, sağda aksiyon */
export function FriendRow({ person, status, sub, onPress, accessibilityLabel, action, trailing, divider, style }: FriendRowProps) {
  const { colors, scheme } = useTheme();
  const body = (
    <>
      <Avatar
        name={person.displayName}
        tint={person.avatarTint}
        url={person.avatarUrl}
        size={m.rowAvatar}
        ring={status === 'pending' ? 'pending' : null}
        badge={status === 'done'}
        initialStyle={cardTypography.rowAvatarInitial}
        decorative
      />
      <View style={styles.texts}>
        <Text numberOfLines={1} style={[cardTypography.rowTitle, { color: colors.text }]}>
          {person.displayName}
        </Text>
        {!!sub && (
          <Text numberOfLines={1} style={[cardTypography.rowSub, { color: colors.textSecondary }]}>
            {sub}
          </Text>
        )}
      </View>
    </>
  );
  const label = accessibilityLabel ?? (sub ? `${person.displayName}, ${sub}` : person.displayName);

  return (
    <View
      style={[
        styles.row,
        divider && { borderBottomWidth: borderWidth.thin, borderBottomColor: cardColors[scheme].rowDivider },
        style,
      ]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}>
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label} style={styles.main}>
          {body}
        </View>
      )}
      {action ? <RowAction action={action} name={person.displayName} /> : trailing}
    </View>
  );
}

function RowAction({ action, name }: { action: FriendRowAction; name: string }) {
  const { colors } = useTheme();
  switch (action.type) {
    case 'poke':
      return (
        <FriendRowButton
          title="Dürt"
          variant="poke"
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={`${name} kişisini dürt`}
        />
      );
    case 'hype':
      return (
        <FriendRowButton title="Gaz ver" variant="hype" onPress={action.onPress} accessibilityLabel={`${name} kişisine gaz ver`} />
      );
    case 'request':
      return (
        <>
          {action.onAccept && (
            <FriendRowButton
              title="Kabul et"
              variant="action"
              onPress={action.onAccept}
              loading={action.accepting}
              accessibilityLabel={`${name} isteğini kabul et`}
            />
          )}
          <FriendRowButton
            title=""
            variant="muted"
            icon={<CloseIcon color={colors.textBody} size={m.dismissIconSize} strokeWidth={m.dismissIconStrokeWidth} />}
            onPress={action.onDismiss}
            loading={action.dismissing}
            accessibilityLabel={action.onAccept ? 'İsteği sil' : 'İsteği geri çek'}
          />
        </>
      );
    case 'add':
      return (
        <FriendRowButton
          title="Ekle"
          variant="action"
          onPress={action.onPress}
          loading={action.loading}
          accessibilityLabel={`${name} kişisine arkadaşlık isteği gönder`}
        />
      );
    case 'sent':
      return <FriendRowButton title="Gönderildi" variant="muted" disabled />;
  }
}

/** Satırları saran kart: yüzey, 1 px kenar, köşe 20 */
export function FriendList({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

// Şerit öğesi (Bugün) --------------------------------------------------------------------------------

type FriendBubbleProps = {
  person: FriendRowPerson;
  /** Bugünü tamamladı: yeşil halka + tik ve ad; değilse kesikli turuncu halka + "Dürt" hapı */
  done: boolean;
  /** Bekleyen arkadaşa dokununca (Dürt) */
  onPoke?: () => void;
  /** Tamamlayan arkadaşa dokununca (ör. profil); verilmezse dokunulmaz */
  onPress?: () => void;
};

/** Yatay arkadaş şeridindeki öğe: 54 px halkalı avatar, altında ad ya da "Dürt" */
export function FriendBubble({ person, done, onPoke, onPress }: FriendBubbleProps) {
  const { colors } = useTheme();
  const handler = done ? onPress : onPoke;
  return (
    <Pressable
      onPress={handler}
      disabled={!handler}
      accessibilityRole={handler ? 'button' : undefined}
      accessibilityLabel={done ? `${person.displayName}, bugün tamam` : `${person.displayName}, bekliyor, dürt`}
      style={({ pressed }) => [styles.bubble, pressed && styles.pressed]}>
      <Avatar
        name={person.displayName}
        tint={person.avatarTint}
        url={person.avatarUrl}
        size={m.bubbleAvatar}
        ring={done ? 'done' : 'pending'}
        badge={done}
        badgeBorderColor={colors.background}
        decorative
      />
      {done ? (
        <Text numberOfLines={1} style={[cardTypography.bubbleName, { color: colors.text }]}>
          {person.displayName}
        </Text>
      ) : (
        <View style={[styles.poke, { backgroundColor: colors.accent }]}>
          <Text style={[cardTypography.bubblePoke, { color: colors.onAccent }]}>Dürt</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Şeridin sonundaki "Davet et": kesikli gri halka ve artı */
export function InviteBubble({ onPress, label = 'Davet et' }: { onPress?: () => void; label?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.bubble, pressed && styles.pressed]}>
      <AddAvatar size={m.bubbleAvatar} />
      <Text numberOfLines={1} style={[cardTypography.bubbleName, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: m.listRadius,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
  row: {
    minHeight: m.rowHeight,
    paddingLeft: m.rowPaddingLeft,
    paddingRight: m.rowPaddingRight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  main: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: m.pressedOpacity,
  },
  button: {
    height: m.rowButtonHeight,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: m.bubbleWidth,
    alignItems: 'center',
    gap: m.bubbleGap,
  },
  poke: {
    paddingVertical: m.bubblePokePaddingY,
    paddingHorizontal: m.bubblePokePaddingX,
    borderRadius: m.bubblePokeRadius,
  },
});
