/**
 * Yeni challenge — design/Create.dc.html (tam ekran). `app/create.tsx` (sekmelerdeki + modal) ve onboarding
 * (`app/(onboarding)/create.tsx`) aynı formu kullanır.
 *
 * Tasarımda olmayan ama spesifikasyonun/`create_challenge`'ın istediği alanlar aynı bileşenlerle eklendi:
 * özel süre (3–60), sayı ayarları (birim, hedef, günlük artış), "Başlangıç" satırı (Bugün / Yarın).
 * `initialTemplateId` verilirse form o şablonla dolar (ad/tür değişirse özel challenge olur);
 * `initialDurationDays` süreyi seçer.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddAvatar } from '@/components/Avatar';
import { AddIcon, CalendarIcon, ClockIcon, LockIcon, MinusIcon } from '@/components/icons';
import { Avatar, Button, Card, Chip, IconButton, ScreenHeader, TextField, Toggle } from '@/components/ui';
import { useChallengeTemplates, useCreateChallenge, useFriendsToday } from '@/data';
import {
  durationOptions,
  formFromTemplate,
  inviteSummary,
  startLabel,
  startOptions,
  taskOptions,
  titleError,
  toCreateInput,
  visibilityLabel,
  visibilityOptions,
  type CreateForm,
  type DurationChoice,
} from '@/features/create/logic';
import { ChoiceSheet, DurationCell, SettingRow, TaskOption } from '@/features/create/parts';
import { REMINDER_STEP_MINUTES, REMINDER_TIMES, stepReminder } from '@/features/settings/logic';
import { useT } from '@/i18n';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { createColors, createMetrics as m, createTypography as typo } from '@/theme/create';

export type CreateScreenProps = {
  /** Oluşturulunca; verilmezse challenge detayına geçilir (`router.replace`) */
  onCreated?: (challengeId: string) => void;
  /** Kapat (×); verilmezse `router.back()` */
  onClose?: () => void;
  /** Formu bu şablonla doldur */
  initialTemplateId?: string;
  /** 7 / 10 / 30 ya da özel (3–60) */
  initialDurationDays?: number;
};

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
  visibility: 'invited',
  invitees: [],
};

/** Parametre süresi → form seçimi (7/10/30 hücre, diğerleri sınırlar içindeyse Özel) */
function durationPatch(days: number | undefined): Partial<CreateForm> {
  if (days === undefined || !Number.isInteger(days)) return {};
  if (days === 7 || days === 10 || days === 30) return { duration: days as DurationChoice };
  if (days >= m.customMin && days <= m.customMax) return { duration: 'custom', customDays: days };
  return {};
}

type Panel = 'reminder' | 'friends' | null;
type SheetKind = 'visibility' | 'start' | null;

export default function CreateScreen({ onCreated, onClose, initialTemplateId, initialDurationDays }: CreateScreenProps) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const c = createColors[scheme];
  const t = useT();

  const templates = useChallengeTemplates();
  const friends = useFriendsToday();
  const { create } = useCreateChallenge();

  const [form, setForm] = useState<CreateForm>(() => ({ ...INITIAL, ...durationPatch(initialDurationDays) }));
  const [panel, setPanel] = useState<Panel>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  // Ad hatası kullanıcı yazmaya başlayınca (ya da alandan çıkınca) gösterilir; boş formda değil
  const [titleTouched, setTitleTouched] = useState(false);
  const now = useMemo(() => new Date(), []);
  const update = (patch: Partial<CreateForm>) => setForm((f) => ({ ...f, ...patch }));
  // Şablondan gelen ad/tür/sayı değişirse artık özel challenge
  const edit = (patch: Partial<CreateForm>) => update({ ...patch, templateId: null });
  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  const template = templates.data?.find((x) => x.id === form.templateId);

  // Verilen şablonu bir kez uygula (şablonlar gelince)
  const appliedTemplate = useRef(false);
  useEffect(() => {
    if (appliedTemplate.current || !initialTemplateId || !templates.data) return;
    appliedTemplate.current = true;
    const tp = templates.data.find((x) => x.id === initialTemplateId);
    if (!tp) return;
    setForm((f) => ({ ...formFromTemplate(f, tp), ...durationPatch(initialDurationDays) }));
  }, [initialTemplateId, initialDurationDays, templates.data]);

  const friendList = friends.data ?? [];
  // Seçim sırasıyla ("Mert ve Ece davet edilecek")
  const invited = form.invitees.flatMap((id) => friendList.filter((f) => f.id === id));
  const input = toCreateInput(form, template);
  const nameError = titleTouched ? titleError(form.title, t) : null;

  const submit = () => {
    if (!input) return;
    create(input, {
      onSuccess: (challenge) => {
        if (onCreated) onCreated(challenge.id);
        else router.replace({ pathname: '/challenge/[id]', params: { id: challenge.id } });
      },
    });
  };

  const toggleInvitee = (id: string) =>
    update({
      invitees: form.invitees.includes(id) ? form.invitees.filter((x) => x !== id) : [...form.invitees, id],
    });

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title={t.create.title} leading="close" onLeadingPress={onClose} />

          <TextField
            label={t.create.name.label}
            value={form.title}
            onChangeText={(title) => {
              setTitleTouched(true);
              edit({ title });
            }}
            onBlur={() => form.title.length > 0 && setTitleTouched(true)}
            error={nameError}
            placeholder={t.create.name.placeholder}
            returnKeyType="done"
            style={styles.section}
          />

          <Text nativeID="create-duration" style={[componentTypography.inputLabel, styles.section, { color: colors.text }]}>
            {t.create.duration.label}
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabelledBy="create-duration" style={styles.durations}>
            {durationOptions(t).map((d) => (
              <DurationCell
                key={d.value}
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
                accessibilityLabel={t.create.duration.decrease}
                onPress={() => update({ customDays: Math.max(m.customMin, form.customDays - 1) })}
              />
              <Text accessibilityLiveRegion="polite" style={[typo.panelValue, styles.panelValueText, { color: colors.text }]}>
                {t.common.days(form.customDays)}
              </Text>
              <IconButton
                icon={AddIcon}
                iconSize={m.stepIconSize}
                iconStrokeWidth={m.stepIconStrokeWidth}
                accessibilityLabel={t.create.duration.increase}
                onPress={() => update({ customDays: Math.min(m.customMax, form.customDays + 1) })}
              />
            </View>
          )}

          <Text nativeID="create-type" style={[componentTypography.inputLabel, styles.section, { color: colors.text }]}>
            {t.create.taskLabel}
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabelledBy="create-type" style={styles.options}>
            {taskOptions(t).map((o) => (
              <TaskOption
                key={o.value}
                title={o.title}
                desc={o.desc}
                selected={form.taskType === o.value}
                onPress={() => form.taskType !== o.value && edit({ taskType: o.value })}>
                {o.value === 'number' && form.taskType === 'number' && (
                  <View style={styles.numberFields}>
                    <TextField
                      label={t.create.number.unit}
                      value={form.unit}
                      onChangeText={(unit) => edit({ unit })}
                      maxLength={m.unitMaxLength}
                      placeholder={t.create.number.unitPlaceholder}
                      autoCapitalize="none"
                      style={styles.numberField}
                    />
                    <TextField
                      label={t.create.number.target}
                      value={form.target}
                      onChangeText={(target) => edit({ target })}
                      keyboardType="decimal-pad"
                      placeholder="20"
                      style={styles.numberField}
                    />
                    <TextField
                      label={t.create.number.increment}
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
              label={t.create.reminder.label}
              value={form.reminder ? t.create.reminder.daily(form.reminder) : t.create.reminder.off}
              onPress={() => togglePanel('reminder')}
              expanded={panel === 'reminder'}
            />
            {panel === 'reminder' && (
              <View style={styles.panel}>
                {form.reminder ? (
                  <View style={styles.panelSteps}>
                    {/* Ayarlar ve Detail'deki saatlerle aynı adımlar (08:00–23:00, 30 dk); uçta buton pasif */}
                    <IconButton
                      icon={MinusIcon}
                      iconSize={m.stepIconSize}
                      iconStrokeWidth={m.stepIconStrokeWidth}
                      accessibilityLabel={t.create.reminder.earlier(REMINDER_STEP_MINUTES)}
                      disabled={form.reminder <= REMINDER_TIMES[0]}
                      onPress={() => form.reminder && update({ reminder: stepReminder(form.reminder, -1) })}
                    />
                    <Text accessibilityLiveRegion="polite" style={[typo.panelValue, styles.panelValueText, { color: colors.text }]}>
                      {form.reminder}
                    </Text>
                    <IconButton
                      icon={AddIcon}
                      iconSize={m.stepIconSize}
                      iconStrokeWidth={m.stepIconStrokeWidth}
                      accessibilityLabel={t.create.reminder.later(REMINDER_STEP_MINUTES)}
                      disabled={form.reminder >= REMINDER_TIMES[REMINDER_TIMES.length - 1]}
                      onPress={() => form.reminder && update({ reminder: stepReminder(form.reminder, 1) })}
                    />
                  </View>
                ) : (
                  <Text style={[typo.rowValue, { color: c.rowValue }]}>{t.create.reminder.offLong}</Text>
                )}
                <Toggle
                  value={!!form.reminder}
                  onChange={(on) => update({ reminder: on ? m.reminderDefault : null })}
                  accessibilityLabel={t.create.reminder.label}
                />
              </View>
            )}

            <SettingRow
              divider
              icon={<LockIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />}
              label={t.create.visibility.label}
              value={visibilityLabel(form.visibility, t)}
              onPress={() => setSheet('visibility')}
            />

            {/* Tasarımda yok: spesifikasyon "başlangıç tarihi yarın veya bugün seçilebilir" */}
            <SettingRow
              divider
              icon={<CalendarIcon color={c.rowIcon} size={m.rowIconSize} strokeWidth={m.rowIconStrokeWidth} />}
              label={t.create.start.label}
              value={startLabel(form.startOffset, t)}
              onPress={() => setSheet('start')}
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
                accessibilityLabel={t.create.invite.add}
                accessibilityState={{ expanded: panel === 'friends' }}
                hitSlop={(layout.minTouchTarget - m.avatarSize) / 2}>
                <AddAvatar size={m.avatarSize} />
              </Pressable>
            )}
            <Text style={[typography.caption, styles.inviteText, { color: colors.textBody }]}>
              {friendList.length > 0 || invited.length > 0
                ? inviteSummary(invited, t)
                : t.create.invite.noFriends}
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
            <Text accessibilityLiveRegion="polite" style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
              {create.error.message}
            </Text>
          )}
          <Button title={t.create.submit} onPress={submit} disabled={!input} loading={create.isPending} />
        </View>
      </KeyboardAvoidingView>

      <ChoiceSheet
        visible={sheet === 'visibility'}
        title={t.create.visibility.label}
        options={visibilityOptions(t)}
        value={form.visibility}
        onSelect={(visibility) => update({ visibility })}
        onClose={() => setSheet(null)}
      />
      <ChoiceSheet
        visible={sheet === 'start'}
        title={t.create.start.label}
        options={startOptions(now, t)}
        value={form.startOffset}
        onSelect={(startOffset) => update({ startOffset })}
        onClose={() => setSheet(null)}
      />
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
    gap: m.friendsGap,
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
