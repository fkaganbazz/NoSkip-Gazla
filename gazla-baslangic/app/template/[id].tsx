import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ErrorState, LoadingState, Segmented } from '@/components/ui';
import { useCreateChallengeMutation, useTemplates, useTemplateStats } from '@/data';
import FaceStack from '@/features/explore/FaceStack';
import PreviewFeatures from '@/features/explore/PreviewFeatures';
import PreviewHero from '@/features/explore/PreviewHero';
import {
  CATEGORY_NAMES,
  DIFFICULTY_NAMES,
  DURATION_OPTIONS,
  TASK_TYPE_NAMES,
  type DurationOption,
} from '@/features/explore/labels';
import { doingNowText } from '@/features/explore/logic';
import { challengeTints, layout, radius, typography, useTheme } from '@/theme';
import { previewMetrics as m, previewTypography } from '@/theme/explore';

const DURATION_SEGMENTS = DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d} gün` }));

// Challenge önizleme — design/ChallengePreview.dc.html. Veri: challenge_templates + template_stats.
// "Arkadaşlarla" → /create (params: templateId, durationDays); "Tek başıma başla" → create_challenge.
export default function TemplatePreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  const templates = useTemplates();
  const stats = useTemplateStats(id);
  const create = useCreateChallengeMutation();
  const template = templates.data?.find((t) => t.id === id);

  // Seçilmediyse şablonun varsayılan süresi
  const [picked, setPicked] = useState<DurationOption | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/explore'));

  if (templates.isPending) {
    return (
      <View style={styles.screen}>
        <LoadingState />
      </View>
    );
  }

  if (!template) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState
          message={templates.isError ? templates.error.message : 'Bu challenge bulunamadı.'}
          onRetry={templates.isError ? () => templates.refetch() : goBack}
        />
      </View>
    );
  }

  const tint = challengeTints[template.tint][scheme];
  const duration = picked ?? template.defaultDurationDays;
  const doing = stats.data ? doingNowText(stats.data) : null;
  const faces = (stats.data?.friends ?? []).map((f) => ({ name: f.displayName, tint: f.avatarTint }));

  const share = () => {
    Share.share({ message: [template.title, template.description].filter(Boolean).join('\n\n') }).catch(() => {});
  };

  const withFriends = () =>
    router.push({ pathname: '/create', params: { templateId: template.id, durationDays: String(duration) } });

  const startSolo = () =>
    create.mutate(
      { templateId: template.id, durationDays: duration },
      // Tasarımda Bugün'e döner
      { onSuccess: () => router.dismissTo('/(tabs)') },
    );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <PreviewHero icon={template.icon} tint={template.tint} onBack={goBack} onShare={share} />

        <View style={styles.content}>
          <Text accessibilityRole="header" style={[previewTypography.title, { color: colors.text }]}>
            {template.title}
          </Text>

          <View style={styles.chips}>
            <InfoChip label={CATEGORY_NAMES[template.category]} bg={tint.bg} color={tint.ink} />
            <InfoChip label={`${DIFFICULTY_NAMES[template.difficulty]} zorluk`} bg={colors.surfaceMuted} color={colors.textBody} />
            <InfoChip label={TASK_TYPE_NAMES[template.taskType]} bg={colors.surfaceMuted} color={colors.textBody} />
          </View>

          {template.description ? (
            <Text style={[previewTypography.description, styles.description, { color: colors.textBody }]}>
              {template.description}
            </Text>
          ) : null}

          <PreviewFeatures taskType={template.taskType} />

          <Text style={[typography.captionStrong, styles.durationLabel, { color: colors.text }]}>
            Süre
          </Text>
          <View style={styles.segmented} accessibilityLabel="Süre">
            <Segmented
              options={DURATION_SEGMENTS}
              value={String(duration)}
              onChange={(v) => setPicked(Number(v) as DurationOption)}
            />
          </View>

          {doing && (
            <View style={styles.friends}>
              {faces.length > 0 && (
                <FaceStack
                  faces={faces}
                  size={m.friendAvatar}
                  border={m.friendAvatarBorder}
                  ringColor={colors.background}
                  overlap={m.friendOverlap}
                  textStyle={previewTypography.faceInitial}
                />
              )}
              <Text style={[typography.caption, styles.friendsText, { color: colors.textBody }]}>{doing}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, m.footerBottom) },
        ]}>
        {create.isError && (
          <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.error, { color: colors.danger }]}>
            {create.error.message}
          </Text>
        )}
        <View style={styles.buttons}>
          <Button title="Arkadaşlarla" variant="secondary" onPress={withFriends} style={styles.button} />
          <Button title="Tek başıma başla" onPress={startSolo} loading={create.isPending} style={styles.button} />
        </View>
      </View>
    </View>
  );
}

function InfoChip({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[previewTypography.chip, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    paddingBottom: layout.screenPadding,
  },
  content: {
    marginTop: m.contentMarginTop,
    paddingHorizontal: layout.screenPadding,
  },
  chips: {
    marginTop: m.chipsMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.chipGap,
  },
  chip: {
    paddingVertical: m.chipPaddingY,
    paddingHorizontal: m.chipPaddingX,
    borderRadius: radius.full,
  },
  description: {
    marginTop: m.descriptionMarginTop,
  },
  durationLabel: {
    marginTop: m.durationLabelMarginTop,
  },
  segmented: {
    marginTop: m.segmentedMarginTop,
  },
  friends: {
    marginTop: m.friendsMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.friendsGap,
  },
  friendsText: {
    flex: 1,
  },
  footer: {
    paddingTop: m.footerPaddingTop,
    paddingHorizontal: layout.screenPadding,
  },
  error: {
    marginBottom: m.footerGap,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: m.footerGap,
  },
  button: {
    flex: 1,
    paddingHorizontal: 0,
  },
});
