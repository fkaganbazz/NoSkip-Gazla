import { StyleSheet, Text, View } from 'react-native';

import { FriendRow } from '@/components/FriendRow';
import Sheet from '@/components/Sheet';
import { ErrorState, LoadingState } from '@/components/ui';
import { ApiError, useAuth, useChallengeBoard } from '@/data';
import { typography, useTheme } from '@/theme';
import { photoProofMetrics as m } from '@/theme/checkin';

type Props = {
  visible: boolean;
  challengeId: string;
  onClose: () => void;
};

/**
 * PhotoProof "Kimler görecek: Grup (n kişi) ›" → grubun üyeleri (ortak Sheet + FriendRow). Tasarımda sayfası
 * çizilmedi; fotoğraf ve not challenge'ın bütün üyelerine görünür, ayrı bir ayar yok.
 */
export default function GroupSheet({ visible, challengeId, onClose }: Props) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const board = useChallengeBoard(challengeId);
  const members = board.data ?? [];

  return (
    <Sheet visible={visible} onClose={onClose} title="Kimler görecek" surface scrollable>
      <Text style={[typography.caption, styles.lead, { color: colors.textBody }]}>
        Fotoğrafını ve notunu bu challenge&apos;daki herkes görür.
      </Text>
      {board.isPending ? (
        <View style={styles.state}>
          <LoadingState />
        </View>
      ) : board.isError ? (
        <View style={styles.state}>
          <ErrorState
            message={board.error instanceof ApiError ? board.error.message : undefined}
            onRetry={() => board.refetch()}
          />
        </View>
      ) : (
        <View accessibilityRole="list">
          {members.map((p, i) => (
            <FriendRow
              key={p.id}
              person={p}
              sub={p.id === session?.userId ? `Sen · @${p.username}` : `@${p.username}`}
              divider={i < members.length - 1}
              style={styles.row}
            />
          ))}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginBottom: m.sheetLeadGap,
  },
  state: {
    minHeight: m.sheetStateMinHeight,
  },
  // Sayfanın kendi kenar boşluğu var: satır içeriği açıklamayla aynı hizada
  row: {
    paddingLeft: 0,
    paddingRight: 0,
  },
});
