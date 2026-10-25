import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card } from '@/components/ui';
import type { BoardMember } from '@/data';
import { useT } from '@/i18n';
import { challengeColors, challengeMetrics as m, challengeTypography as typo } from '@/theme/challenge';
import { borderWidth, useTheme } from '@/theme';

import { boardRowInfo } from './logic';

type Props = {
  members: BoardMember[];
  meId: string | undefined;
  /** Challenge sürüyor: bekleyen gösterilir ve dürtülebilir (başlamamış / bitmişte "bugün bekliyor" yok) */
  running: boolean;
  /** Bugün bekleyen arkadaşı dürt */
  onPoke: (userId: string) => void;
};

// Grup listesi: seriye göre sıra, bugün bekleyene "Dürt" (Detail.dc.html).
export default function BoardCard({ members, meId, running, onPoke }: Props) {
  const { colors } = useTheme();
  const t = useT();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typo.boardTitle, { color: colors.text }]}>
          {t.challenge.board.title}
        </Text>
        <Text style={[typo.detail, { color: colors.textSecondary }]}>{t.challenge.board.byStreak}</Text>
      </View>
      {members.map((member, i) => (
        <Row
          key={member.id}
          member={member}
          isMe={member.id === meId}
          last={i === members.length - 1}
          running={running}
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
  running,
  onPoke,
}: {
  member: BoardMember;
  isMe: boolean;
  last: boolean;
  running: boolean;
  onPoke: (userId: string) => void;
}) {
  const { colors, scheme } = useTheme();
  const c = challengeColors[scheme];
  const t = useT();
  const info = boardRowInfo(member, running, t);
  const name = isMe ? t.challenge.board.you : member.displayName;
  const canPoke = !isMe && info.tone === 'waiting';

  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: borderWidth.thin, borderBottomColor: c.rowDivider },
      ]}>
      <Text style={[typo.rowStrong, styles.rank, { color: member.rank === 1 ? c.rankFirst : colors.textSecondary }]}>
        {member.rank}
      </Text>
      <Avatar name={member.displayName} tint={member.avatarTint} self={isMe} url={member.avatarUrl} size={m.avatar} decorative />
      <View style={styles.names}>
        <Text numberOfLines={1} style={[typo.name, { color: colors.text }]}>
          {name}
        </Text>
        {info.sub && (
          <Text
            numberOfLines={1}
            style={[typo.rowSub, { color: info.tone === 'waiting' ? c.waitingText : colors.textSecondary }]}>
            {info.sub}
          </Text>
        )}
      </View>
      {canPoke ? (
        <Button
          title={t.common.poke}
          variant="orange"
          size="sm"
          accessibilityLabel={t.challenge.detail.pokeName(member.displayName)}
          onPress={() => onPoke(member.id)}
          style={styles.poke}
        />
      ) : (
        <Text style={[typo.rowStrong, { color: info.tone === 'broken' ? colors.textSecondary : c.streakText }]}>
          {t.common.days(member.streak)}
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
