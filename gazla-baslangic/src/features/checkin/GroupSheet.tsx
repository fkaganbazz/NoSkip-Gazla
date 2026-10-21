import { StyleSheet, Text, View } from 'react-native';

import { FriendRow } from '@/components/FriendRow';
import Sheet from '@/components/Sheet';
import { ErrorState, LoadingState } from '@/components/ui';
import { ApiError, useAuth, useChallengeMembers } from '@/data';
import { typography, useTheme } from '@/theme';
import { photoProofMetrics as m } from '@/theme/checkin';

type Props = {
  visible: boolean;
  challengeId: string;
  onClose: () => void;
};

/**
 * PhotoProof "Kimler görecek: Grup (n kişi) ›" → grubun üyeleri (ortak Sheet + FriendRow). Tasarımda sayfası
 * çizilmedi; fotoğraf ve not challenge'ın bütün üyelerine görünür, ayrı bir ayar yok. PhotoProof iki modda koyu:
 * sayfa da `scheme="dark"` (içerik `GroupSheetBody`, koyu temayla).
 */
export default function GroupSheet({ visible, challengeId, onClose }: Props) {
  const { session } = useAuth();
  // Sayfa açılmadan yüklenir (açılınca liste hazır)
  const board = useChallengeMembers(challengeId);
  return (
    <Sheet visible={visible} onClose={onClose} title="Kimler görecek" surface scrollable scheme="dark">
      <GroupSheetBody board={board} meId={session?.userId} />
    </Sheet>
  );
}

/** Sayfanın içeriği: Sheet'in koyu modu altında çizilir (useTheme koyu döner) */
function GroupSheetBody({ board, meId }: { board: ReturnType<typeof useChallengeMembers>; meId?: string }) {
  const { colors } = useTheme();
  const members = board.data ?? [];

  return (
    <>
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
              sub={p.id === meId ? `Sen · @${p.username}` : `@${p.username}`}
              divider={i < members.length - 1}
              style={styles.row}
            />
          ))}
        </View>
      )}
    </>
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
