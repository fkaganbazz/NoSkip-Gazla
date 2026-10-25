import { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CategoryTile } from '@/components/CategoryTile';
import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import { AddIcon, CameraIcon, CheckIcon } from '@/components/icons';
import { ProgressBar } from '@/components/ProgressBar';
import type { ChallengeCategory, ChallengeIconKey, ChallengeTintKey, TaskType } from '@/data/types';
import { useT, type Messages } from '@/i18n';
import { borderWidth, cardColors, cardMetrics as m, cardTypography, useTheme } from '@/theme';

/** Görev kartının gösterdiği veri (Bugün: `toTaskRow`) */
export type TaskCardTask = {
  title: string;
  /** Alt satır: "Gün 12/30 · Grup 4 kişi" */
  meta: string;
  /** Challenge ilerlemesi, 0–1 */
  progress: number;
  /** check: tek dokunuşla işaretle · photo: fotoğraf kanıtı · number: sayı girişi */
  taskType: TaskType;
  /** Bugün tamamlandı */
  done: boolean;
  icon: ChallengeIconKey;
  tint?: ChallengeTintKey;
  category?: ChallengeCategory | null;
};

type Props = {
  task: TaskCardTask;
  /** Kart gövdesi (karo + metin): challenge detayı ya da ilgili işaretleme ekranı */
  onPressBody?: () => void;
  /** Sağdaki aksiyon butonu: işaretle / geri al (işaretle tipi), fotoğraf ekranı, sayı ekranı */
  onPressAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Bugünkü görev kartı (Today.dc.html, TodayDark.dc.html): 44 px kategori karosu, başlık, alt bilgi,
// ilerleme çubuğu ve sağda 52 px aksiyon butonu.
function TaskCardBase({ task, onPressBody, onPressAction, style }: Props) {
  const { colors, scheme } = useTheme();
  const c = cardColors[scheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: c.taskCardShadow ? `0 ${m.taskShadowY}px ${m.taskShadowBlur}px ${c.taskCardShadow}` : undefined,
        },
        style,
      ]}>
      <Pressable
        onPress={onPressBody}
        disabled={!onPressBody}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}, ${task.meta}`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        <CategoryTile icon={task.icon} tint={task.tint} category={task.category} size={m.taskTile} />
        <View style={styles.texts}>
          <Text numberOfLines={1} style={[cardTypography.taskTitle, { color: task.done ? c.taskTitleDone : colors.text }]}>
            {task.title}
          </Text>
          <Text numberOfLines={1} style={[cardTypography.taskMeta, { color: colors.textSecondary }]}>
            {task.meta}
          </Text>
          <ProgressBar value={task.progress} />
        </View>
      </Pressable>

      <ActionButton task={task} onPress={onPressAction} />
    </View>
  );
}

/** Sağ butonun ekran okuyucu metni: işaretle tipi geri alır; sayı ve fotoğraf tipi ekranını açar */
function actionLabel(task: TaskCardTask, t: Messages) {
  const l = t.components.taskCard;
  if (task.taskType === 'number') return task.done ? l.numberDone : l.numberTodo;
  if (task.taskType === 'photo') return task.done ? l.photoDone : l.photoTodo;
  return task.done ? l.checkDone : l.checkTodo;
}

/** Sağdaki 52 px buton: yapıldı (dolu yeşil + tik), işaretle (yeşil kenar + soluk tik), fotoğraf, sayı */
function ActionButton({ task, onPress }: { task: TaskCardTask; onPress?: () => void }) {
  const { colors, scheme } = useTheme();
  const t = useT();
  const c = cardColors[scheme];
  const shadow = task.done ? colors.actionShadow : c.todoShadow;

  return (
    <View style={styles.actionFrame}>
      <FlatShadowUnderlay offset={m.actionShadow} color={shadow} size={m.actionSize} radius={m.actionSize / 2} />
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}: ${actionLabel(task, t)}`}
        accessibilityState={{ checked: task.done, disabled: !onPress }}
        style={({ pressed }) => [
          styles.action,
          task.done
            ? { backgroundColor: colors.action }
            : { backgroundColor: c.todoBg, borderWidth: m.actionBorder, borderColor: colors.action },
          // Basılınca tok butonlar gibi aşağı iner, gölge o kadar kısalır
          pressed
            ? [{ transform: [{ translateY: m.actionPressOffset }] }, flatShadowStyle(m.actionShadow - m.actionPressOffset, shadow)]
            : flatShadowStyle(m.actionShadow, shadow),
        ]}>
        {task.done ? (
          <CheckIcon color={colors.onAction} size={m.doneIconSize} strokeWidth={m.doneIconStrokeWidth} />
        ) : task.taskType === 'photo' ? (
          <CameraIcon color={colors.actionText} size={m.todoIconSize} strokeWidth={m.todoCameraStrokeWidth} />
        ) : task.taskType === 'number' ? (
          <AddIcon color={colors.actionText} size={m.todoIconSize} strokeWidth={m.todoPlusStrokeWidth} />
        ) : (
          <CheckIcon color={c.todoCheckIcon} size={m.todoIconSize} strokeWidth={m.todoCheckStrokeWidth} />
        )}
      </Pressable>
    </View>
  );
}

export const TaskCard = memo(TaskCardBase);

const styles = StyleSheet.create({
  card: {
    minHeight: m.taskHeight,
    paddingLeft: m.taskPaddingLeft,
    paddingRight: m.taskPaddingRight,
    borderRadius: m.taskRadius,
    borderWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.taskInnerGap,
  },
  body: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.taskInnerGap,
  },
  pressed: {
    opacity: m.pressedOpacity,
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: m.taskTextGap,
  },
  actionFrame: {
    width: m.actionSize,
    height: m.actionSize,
  },
  action: {
    width: m.actionSize,
    height: m.actionSize,
    borderRadius: m.actionSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
