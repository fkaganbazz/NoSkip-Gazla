import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddAvatar } from '@/components/Avatar';
import { AddIcon, CalendarIcon, ClockIcon, LockIcon, MinusIcon } from '@/components/icons';
import { Avatar, Button, Card, Chip, IconButton, ScreenHeader, TextField, Toggle } from '@/components/ui';
import { useCreateChallengeMutation, useFriendsToday, useTemplates } from '@/data';
import {
  DURATION_OPTIONS,
  TASK_OPTIONS,
  formFromTemplate,
  inviteSummary,
  shiftTime,
  startChipLabel,
  toCreateInput,
  type CreateForm,
} from '@/features/create/logic';
import { DurationCell, SettingRow, TaskOption } from '@/features/create/parts';
import { formatDayLabel } from '@/features/today/logic';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { createColors, createMetrics as m, createTypography as t } from '@/theme/create';

const INITIAL: CreateForm = {
  templateId: null,
  title: '',
  taskType: 'check',
  duration: 10,
  customDays: m.customDefault,
  unit: '',
  target: '',
  increment: '',
  startOffset: 0,
  reminder: m.reminderDefault,
  invitees: [],
};

type Panel = 'reminder' | 'start' | 'friends' | null;

// Yeni challenge — design/Create.dc.html (tam ekran modal). Tasarımda olmayan ama create_challenge'ın
// istediği alanlar (şablon, özel süre, sayı ayarları, başlangıç günü) aynı bileşenlerle eklendi.
// Explore/şablon ekranı `?templateId=&durationDays=` ile açarsa form o şablon ve süreyle dolu gelir.
export default function CreateScreen() {
  const { templateId: templateParam, durationDays: durationParam } = useLocalSearchParams<{
    templateId?: string;
    durationDays?: string;
  }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = createColors[scheme];

  const templates = useTemplates();
  const friends = useFriendsToday();
  const create = useCreateChallengeMutation();

  const [form, setForm] = useState<CreateForm>(INITIAL);
  const [panel, setPanel] = useState<Panel>(null);
  const now = useMemo(() => new Date(), []);
  const update = (patch: Partial<CreateForm>) => setForm((f) => ({ ...f, ...patch }));
  // Şablondan gelen ad/tür/sayı değişirse artık özel challenge
  const edit = (patch: Partial<CreateForm>) => update({ ...patch, templateId: null });
  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const template = templates.data?.find((x) => x.id === form.templateId);

  // Parametreyle gelen şablonu bir kez uygula
  const appliedParam = useRef(false);
  useEffect(() => {
    if (appliedParam.current || !templateParam || !templates.data) return;
    const tp = templates.data.find((x) => x.id === templateParam);
    appliedParam.current = true;
    if (!tp) return;
    const days = Number(durationParam);
    const duration = days === 7 || days === 10 || days === 30 ? days : undefined;
    setForm((f) => ({ ...formFromTemplate(f, tp), ...(duration ? { duration } : {}) }));
  }, [templateParam, durationParam, templates.data]);

  const friendList = friends.data ?? [];
  // Seçim sırasıyla ("Mert ve Ece davet edilecek")
  const invited = form.invitees.flatMap((id) => friendList.filter((f) => f.id === id));
  const input = toCreateInput(form, template);

  const submit = () => {
    if (!input) return;
    create.mutate(input, {
      onSuccess: (challenge) => router.replace({ pathname: '/challenge/[id]', params: { id: challenge.id } }),
    });
  };

  const toggleInvitee = (id: string) =>
    update({
      invitees: form.invitees.includes(id) ? form.invitees.filter((x) => x !== id) : [...form.invitees, id],
    });

  const startValue = form.startOffset === 0 ? 'Bugün' : form.startOffset === 1 ? 'Yarın' : formatDayLabel(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + form.startOffset),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Yeni challenge" leading="close" />

          <TextField
            label="Challenge adı"
            value={form.title}
            onChangeText={(title) => edit({ title })}
            maxLength={m.titleMaxLength}
            placeholder="Akşam 20 dakika yürüyüş"
            returnKeyType="done"
            style={styles.section}
          />

          {/* Şablonlar (tasarımda yok): dokununca form şablonla dolar */}
          {!!templates.data?.length && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templates}
              contentContainerStyle={styles.templatesContent}>
              {templates.data.map((tp) => (
                <Chip
                  key={tp.id}
                  label={tp.title}
                  selected={form.templateId === tp.id}
                  onPress={() => (form.templateId === tp.id ? update({ templateId: null }) : setForm((f) => formFromTemplate(f, tp)))}
                />
              ))}
            </ScrollView>
          )}

          <Text nativeID="create-duration" style={[componentTypography.inputLabel, styles.section, { color: colors.text }]}>
            Süre
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabelledBy="create-duration" style={styles.durations}>
            {DURATION_OPTIONS.map((d) => (
              <DurationCell
                key={d.label}
                label={d.label}
                selected={form.duration === d.value}
                onPress={() => update({ duration: d.value })}
              />
            ))}
          </View>
          {form.duration === 'custom' && (
            <View style={styles.custom}>
              <IconButton
                icon={MinusIcon}
                iconSize={m.stepIconSize}
                iconStrokeWidth={m.stepIconStrokeWidth}
                accessibilityLabel="Bir gün azalt"
                onPress={() => update({ customDays: Math.max(m.customMin, form.customDays - 1) })}
              />
              <Text accessibilityLiveRegion="polite" style={[t.panelValue, styles.panelValueText, { color: colors.text }]}>
                {`${form.customDays} gün`}
              </Text>
              <IconButton
                icon={AddIcon}
                iconSize={m.stepIconSize}
                iconStrokeWidth={m.stepIconStrokeWidth}
                accessibilityLabel="Bir gün artır"
                onPress={() => update({ customDays: Math.min(m.customMax, form.customDays + 1) })}
              />
            </View>
          )}

          <Text nativeID="create-type" style={[componentTypography.inputLabel, styles.section, { color: colors.text }]}>
            Nasıl tamamlanır?
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabelledBy="create-type" style={styles.options}>
            {TASK_OPTIONS.map((o) => (
              <TaskOption
                key={o.value}
                title={o.title}
                desc={o.desc}
                selected={form.taskType === o.value}
                onPress={() => form.taskType !== o.value && edit({ taskType: o.value })}>
                {o.value === 'number' && form.taskType === 'number' && (
                  <View style={styles.numberFields}>
                    <TextField
                      label="Birim"
                      value={form.unit}
                      onChangeText={(unit) => edit({ unit })}
                      maxLength={m.unitMaxLength}
                      placeholder="dk"
                      autoCapitalize="none"
                      style={styles.numberField}
                    />
                    <TextField
                      label="Hedef"
                      value={form.target}
                      onChangeText={(target) => edit({ target })}
                      keyboardType="decimal-pad"
                      placeholder="20"
                      style={styles.numberField}
                    />
                    <TextField
                      label="Her gün +"
                      value={form.increment}
                      onChangeText={(increment) => edit({ increment })}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      style={styles.numberField}
                    />
                  </View>
                )}
              </TaskOption>
            ))}
          </View>

          <Card style={styles.card}>
            <SettingRow
              icon={<ClockIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />}
              label="Hatırlatma"
              value={form.reminder ? `Her gün ${form.reminder}` : 'Kapalı'}
              onPress={() => togglePanel('reminder')}
              expanded={panel === 'reminder'}
            />
            {panel === 'reminder' && (
              <View style={styles.panel}>
                {form.reminder ? (
                  <View style={styles.panelSteps}>
                    <IconButton
                      icon={MinusIcon}
                      iconSize={m.stepIconSize}
                      iconStrokeWidth={m.stepIconStrokeWidth}
                      accessibilityLabel={`${m.reminderStepMinutes} dakika erken`}
                      onPress={() => form.reminder && update({ reminder: shiftTime(form.reminder, -m.reminderStepMinutes) })}
                    />
                    <Text accessibilityLiveRegion="polite" style={[t.panelValue, styles.panelValueText, { color: colors.text }]}>
                      {form.reminder}
                    </Text>
                    <IconButton
                      icon={AddIcon}
                      iconSize={m.stepIconSize}
                      iconStrokeWidth={m.stepIconStrokeWidth}
                      accessibilityLabel={`${m.reminderStepMinutes} dakika geç`}
                      onPress={() => form.reminder && update({ reminder: shiftTime(form.reminder, m.reminderStepMinutes) })}
                    />
                  </View>
                ) : (
                  <Text style={[t.rowValue, { color: c.rowValue }]}>Hatırlatma kapalı</Text>
                )}
                <Toggle
                  value={!!form.reminder}
                  onChange={(on) => update({ reminder: on ? m.reminderDefault : null })}
                  accessibilityLabel="Hatırlatma"
                />
              </View>
            )}

            <SettingRow
              divider
              icon={<CalendarIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />}
              label="Başlangıç"
              value={startValue}
              onPress={() => togglePanel('start')}
              expanded={panel === 'start'}
            />
            {panel === 'start' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.startChips}>
                {Array.from({ length: m.startMaxOffset + 1 }, (_, i) => (
                  <Chip
                    key={i}
                    label={startChipLabel(i, now)}
                    selected={form.startOffset === i}
                    onPress={() => update({ startOffset: i })}
                  />
                ))}
              </ScrollView>
            )}

            {/* Challenge'ı yalnızca davet edilenler görür; ayrı bir görünürlük ayarı yok (yalnızca bilgi). */}
            <SettingRow
              divider
              icon={<LockIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />}
              label="Kimler görebilir"
              value="Davetliler"
            />
          </Card>

          <View style={styles.invite}>
            {invited.map((f) => (
              <Avatar
                key={f.id}
                name={f.displayName}
                tint={f.avatarTint}
                url={f.avatarUrl}
                size={m.avatarSize}
                outlineColor={c.inviteRing}
                outlineWidth={m.avatarRing}
              />
            ))}
            {friendList.length > 0 && (
              <Pressable
                onPress={() => togglePanel('friends')}
                accessibilityRole="button"
                accessibilityLabel="Arkadaş ekle"
                accessibilityState={{ expanded: panel === 'friends' }}
                hitSlop={(layout.minTouchTarget - m.avatarSize) / 2}>
                <AddAvatar size={m.avatarSize} />
              </Pressable>
            )}
            <Text style={[typography.caption, styles.inviteText, { color: colors.textBody }]}>
              {friendList.length > 0 || invited.length > 0
                ? inviteSummary(invited)
                : 'Davet linkini challenge açılınca paylaşabilirsin'}
            </Text>
          </View>
          {panel === 'friends' && (
            <View style={styles.friends}>
              {friendList.map((f) => (
                <Chip
                  key={f.id}
                  label={f.displayName}
                  selected={form.invitees.includes(f.id)}
                  onPress={() => toggleInvitee(f.id)}
                  icon={<Avatar name={f.displayName} tint={f.avatarTint} url={f.avatarUrl} size={m.friendChipAvatar} />}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {create.isError && (
            <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, styles.error, { color: colors.danger }]}>
              {create.error.message}
            </Text>
          )}
          <Button title="Challenge'ı başlat" onPress={submit} disabled={!input} loading={create.isPending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.screenPadding,
  },
  section: {
    marginTop: m.sectionMarginTop,
  },
  templates: {
    marginTop: m.templatesMarginTop,
    marginHorizontal: -layout.screenPadding,
  },
  templatesContent: {
    paddingHorizontal: layout.screenPadding,
    gap: m.templatesGap,
  },
  durations: {
    marginTop: m.labelGap,
    flexDirection: 'row',
    gap: m.durationGap,
  },
  custom: {
    marginTop: m.durationGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.panelGap,
  },
  panelValueText: {
    minWidth: m.panelValueMinWidth,
    textAlign: 'center',
  },
  options: {
    marginTop: m.labelGap,
    gap: m.optionGap,
  },
  numberFields: {
    flexDirection: 'row',
    gap: m.numberGap,
    paddingHorizontal: m.optionPaddingX,
    paddingBottom: m.optionPaddingX,
  },
  numberField: {
    flex: 1,
  },
  // Ortak kart (yüzey, 1 px kenar); köşe tasarımda 18
  card: {
    marginTop: m.cardMarginTop,
    borderRadius: m.cardRadius,
    overflow: 'hidden',
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m.rowPaddingX,
    paddingBottom: m.panelPaddingBottom,
  },
  panelSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.panelGap,
  },
  startChips: {
    paddingHorizontal: m.rowPaddingX,
    paddingBottom: m.panelPaddingBottom,
    gap: m.templatesGap,
  },
  invite: {
    marginTop: m.inviteMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: m.inviteGap,
  },
  inviteText: {
    flexShrink: 1,
    marginLeft: m.inviteTextMarginLeft,
  },
  friends: {
    marginTop: m.friendsMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.templatesGap,
  },
  footer: {
    paddingTop: m.footerPaddingTop,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: m.footerPaddingBottom,
    gap: m.labelGap,
  },
  error: {
    textAlign: 'center',
  },
});
