import { Pressable, StyleSheet, Text, View } from 'react-native';

import { flatShadowStyle } from '@/components/FlatShadow';
import { upperTr } from '@/components/ui';
import type { BoardMember } from '@/data';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { avatarTints, borderWidth, useTheme } from '@/theme';

import { accusative, boardRowInfo } from './logic';

type Props = {
  members: BoardMember[];
  meId: string | undefined;
  /** Bugün bekleyen arkadaşı dürt */
  onPoke: (userId: string) => void;
};

// Grup listesi: seriye göre sıra, bugün bekleyene "Dürt" (Detail.dc.html).
export default function BoardCard({ members, meId, onPoke }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[t.boardTitle, { color: colors.text }]}>
          Grup
        </Text>
        <Text style={[t.detail, { color: colors.textSecondary }]}>Seriye göre</Text>
      </View>
      {members.map((member, i) => (
        <Row
          key={member.id}
          member={member}
          isMe={member.id === meId}
          last={i === members.length - 1}
          onPoke={onPoke}
        />
      ))}
    </View>
  );
}

function Row({
  member,
  isMe,
  last,
  onPoke,
}: {
  member: BoardMember;
  isMe: boolean;
  last: boolean;
  onPoke: (userId: string) => void;
}) {
  const { colors, scheme } = useTheme();
  const c = challengeColors[scheme];
  const tint = avatarTints[member.avatarTint][scheme];
  const info = boardRowInfo(member);
  const name = isMe ? 'Sen' : member.displayName;
  const canPoke = !isMe && info.tone === 'waiting';

  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
      ]}>
      <Text style={[t.rowStrong, styles.rank, { color: member.rank === 1 ? c.rankFirst : colors.textSecondary }]}>
        {member.rank}
      </Text>
      <View style={[styles.avatar, { backgroundColor: tint.bg }]}>
        <Text style={[t.avatar, { color: tint.ink }]}>{upperTr(member.displayName.charAt(0))}</Text>
      </View>
      <View style={styles.names}>
        <Text numberOfLines={1} style={[t.name, { color: colors.text }]}>
          {name}
        </Text>
        {info.sub && (
          <Text
            numberOfLines={1}
            style={[t.rowSub, { color: info.tone === 'waiting' ? c.waitingText : colors.textSecondary }]}>
            {info.sub}
          </Text>
        )}
      </View>
      {canPoke ? (
        <Pressable
          onPress={() => onPoke(member.id)}
          accessibilityRole="button"
          accessibilityLabel={`${accusative(member.displayName)} dürt`}
          hitSlop={4}
          style={({ pressed }) => [
            styles.poke,
            { backgroundColor: colors.accent },
            pressed ? { transform: [{ translateY: m.pokeShadow }] } : flatShadowStyle(m.pokeShadow, c.pokeShadow),
          ]}>
          <Text style={[t.rowStrong, { color: colors.onAccent }]}>Dürt</Text>
        </Pressable>
      ) : (
        <Text style={[t.rowStrong, { color: info.tone === 'broken' ? colors.textSecondary : c.streakText }]}>
          {`${member.streak} gün`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: m.boardMarginTop,
    borderRadius: m.cardRadius,
    borderWidth: borderWidth.thin,
    overflow: 'hidden',
  },
  header: {
    paddingTop: m.boardHeaderPaddingTop,
    paddingHorizontal: m.boardHeaderPaddingX,
    paddingBottom: m.boardHeaderPaddingBottom,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  row: {
    minHeight: m.rowHeight,
    paddingHorizontal: m.rowPaddingX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
  },
  rank: {
    width: m.rankWidth,
  },
  avatar: {
    width: m.avatar,
    height: m.avatar,
    borderRadius: m.avatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  names: {
    flex: 1,
    minWidth: 0,
  },
  poke: {
    height: m.pokeHeight,
    paddingHorizontal: m.pokePaddingX,
    borderRadius: m.pokeHeight / 2,
    justifyContent: 'center',
  },
});
