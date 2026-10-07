import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FlatShadowUnderlay, flatShadowStyle } from '@/components/FlatShadow';
import { AddIcon, CameraIcon, CheckIcon, challengeIcons } from '@/components/icons';
import {
  borderWidth,
  challengeTints,
  todayColors,
  todayMetrics as m,
  todayTypography,
  typography,
  useTheme,
} from '@/theme';

import type { TodayTask } from './types';

type Props = {
  task: TodayTask;
  done: boolean;
  onToggle: (id: string) => void;
};

// Bugünkü görev satırı ve işaretleme butonu (Today.dc.html).
function TaskCard({ task, done, onToggle }: Props) {
  const { colors, scheme } = useTheme();
  const c = todayColors[scheme];
  const tint = challengeTints[task.tint][scheme];
  const Icon = challengeIcons[task.icon];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: c.taskCardShadow
            ? `0 ${m.taskShadowY}px ${m.taskShadowBlur}px ${c.taskCardShadow}`
            : undefined,
        },
      ]}>
      {/* Detay / kanıt ekranları gelince bağlanacak */}
      <View style={styles.body}>
        <View style={[styles.iconTile, { backgroundColor: tint.bg }]}>
          <Icon color={tint.ink} size={m.taskIconSize} strokeWidth={m.taskIconStrokeWidth} />
        </View>
        <View style={styles.texts}>
          <Text
            numberOfLines={1}
            style={[todayTypography.taskTitle, { color: done ? c.taskTitleDone : colors.text }]}>
            {task.title}
          </Text>
          <Text style={[typography.meta, { color: colors.textSecondary }]}>{task.meta}</Text>
          <View style={[styles.track, { backgroundColor: c.progressTrack }]}>
            <View
              style={[
                styles.fill,
                { width: `${task.progress}%`, backgroundColor: c.progressFill },
              ]}
            />
          </View>
        </View>
      </View>

      <CheckButton task={task} done={done} onToggle={onToggle} />
    </View>
  );
}

function CheckButton({ task, done, onToggle }: Props) {
  const { colors, scheme } = useTheme();
  const c = todayColors[scheme];
  const shadowColor = done ? colors.actionShadow : c.todoShadow;

  return (
    <View style={styles.buttonFrame}>
      <FlatShadowUnderlay
        offset={m.checkButtonShadow}
        color={shadowColor}
        size={m.checkButtonSize}
        radius={m.checkButtonSize / 2}
      />
      <Pressable
        onPress={() => onToggle(task.id)}
        accessibilityRole="button"
        accessibilityLabel={done ? `${task.title}: tamamlandı, geri al` : `${task.title}: bugünü tamamla`}
        style={[
          styles.button,
          done
            ? { backgroundColor: colors.action }
            : { backgroundColor: c.todoBg, borderWidth: m.checkButtonBorder, borderColor: colors.action },
          flatShadowStyle(m.checkButtonShadow, shadowColor),
        ]}>
        {done ? (
          <CheckIcon color={colors.onAction} size={m.doneIconSize} strokeWidth={m.doneIconStrokeWidth} />
        ) : task.type === 'photo' ? (
          <CameraIcon color={colors.actionText} size={m.todoIconSize} strokeWidth={m.todoCameraStrokeWidth} />
        ) : task.type === 'number' ? (
          <AddIcon color={colors.actionText} size={m.todoIconSize} strokeWidth={m.todoPlusStrokeWidth} />
        ) : (
          <CheckIcon color={c.todoCheckIcon} size={m.todoIconSize} strokeWidth={m.todoCheckStrokeWidth} />
        )}
      </Pressable>
    </View>
  );
}

export default memo(TaskCard);

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.taskInnerGap,
  },
  iconTile: {
    width: m.taskIconTile,
    height: m.taskIconTile,
    borderRadius: m.taskIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: m.taskTextGap,
  },
  track: {
    height: m.progressHeight,
    borderRadius: m.progressHeight / 2,
    overflow: 'hidden',
  },
  fill: {
    height: m.progressHeight,
    borderRadius: m.progressHeight / 2,
  },
  buttonFrame: {
    width: m.checkButtonSize,
    height: m.checkButtonSize,
  },
  button: {
    width: m.checkButtonSize,
    height: m.checkButtonSize,
    borderRadius: m.checkButtonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
