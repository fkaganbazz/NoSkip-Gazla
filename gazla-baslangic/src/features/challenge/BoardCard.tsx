import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card } from '@/components/ui';
import type { BoardMember } from '@/data';
import { challengeColors, challengeMetrics as m, challengeTypography as t } from '@/theme/challenge';
import { borderWidth, useTheme } from '@/theme';

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
    <Card style={styles.card}>
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
    </Card>
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
      <Avatar name={member.displayName} tint={member.avatarTint} self={isMe} url={member.avatarUrl} size={m.avatar} decorative />
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
        <Button
          title="Dürt"
          variant="orange"
          size="sm"
          accessibilityLabel={`${accusative(member.displayName)} dürt`}
          onPress={() => onPoke(member.id)}
          style={styles.poke}
        />
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
  names: {
    flex: 1,
    minWidth: 0,
  },
  // Detail.dc.html "Dürt": 0 14 iç boşluk (ortak hap butonu 0 16)
  poke: {
    paddingHorizontal: m.pokePaddingX,
  },
});
