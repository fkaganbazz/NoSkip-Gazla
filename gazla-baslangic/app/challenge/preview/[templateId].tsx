import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarStack } from '@/components/Avatar';
import { Button, Chip, ErrorState, LoadingState, Segmented } from '@/components/ui';
import { useChallengeTemplates, useCreateChallenge, useTemplateStats } from '@/data';
import PreviewFeatures from '@/features/explore/PreviewFeatures';
import PreviewHero from '@/features/explore/PreviewHero';
import type { DurationOption } from '@/features/explore/labels';
import { doingNowText } from '@/features/explore/logic';
import { useT } from '@/i18n';
import { categoryTint, layout, typography, useTheme } from '@/theme';
import { previewMetrics as m, previewTypography } from '@/theme/explore';

// Challenge önizleme — design/ChallengePreview.dc.html (/challenge/preview/<şablon id>).
// Veri: challenge_templates + template_stats.
// İki buton da seçilen süreyle create_challenge çağırır. "Arkadaşlarla": oluşunca challenge detayı açılır,
// üstünde davet modalı (/invite-friends); kapatınca detayda kalınır. "Tek başıma başla": → Bugün.
export default function TemplatePreviewScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();

  const templates = useChallengeTemplates();
  const stats = useTemplateStats(templateId);
  const { create } = useCreateChallenge();
  const template = templates.data?.find((x) => x.id === templateId);

  // Seçilmediyse şablonun varsayılan süresi
  const [picked, setPicked] = useState<DurationOption | null>(null);
  // Hangi butonla oluşturuluyor (yükleniyor göstergesi o butonda)
  const [mode, setMode] = useState<'friends' | 'solo' | null>(null);

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
          message={templates.isError ? templates.error.message : t.explore.preview.notFound}
          onRetry={templates.isError ? () => templates.refetch() : goBack}
          actionLabel={templates.isError ? undefined : t.explore.preview.goBack}
        />
      </View>
    );
  }

  // Süre seçici yalnızca şablonun izin verdiği süreleri gösterir (EKRANLAR 4.2)
  const duration = picked ?? template.defaultDurationDays;
  const durationSegments = template.allowedDurations.map((d) => ({ value: String(d), label: t.common.days(d) }));
  const doing = stats.data ? doingNowText(stats.data, t) : null;
  const faces = (stats.data?.friends ?? []).map((f) => ({ name: f.displayName, tint: f.avatarTint, url: f.avatarUrl }));

  const share = () => {
    Share.share({ message: [template.title, template.description].filter(Boolean).join('\n\n') }).catch(() => {});
  };

  const start = (next: 'friends' | 'solo') => {
    if (create.isPending) return;
    // Çevrimdışıyken hemen NetworkError ile düşer (yazmalar beklemeye alınmaz; DataProvider)
    setMode(next);
    create(
      { templateId: template.id, durationDays: duration },
      {
        onSuccess: (challenge) => {
          if (next === 'solo') {
            // Tasarımda Bugün'e döner ('/(tabs)' sekmelerin ilk ekranı)
            router.dismissTo('/(tabs)');
            return;
          }
          // Önizlemenin yerine yeni challenge'ın detayı; davet modalı onun üstünde açılır
          router.replace({ pathname: '/challenge/[id]', params: { id: challenge.id } });
          router.push({ pathname: '/invite-friends', params: { challengeId: challenge.id } });
        },
      },
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <PreviewHero icon={template.icon} category={template.category} onBack={goBack} onShare={share} />

        <View style={styles.content}>
          <Text accessibilityRole="header" style={[previewTypography.title, { color: colors.text }]}>
            {template.title}
          </Text>

          <View style={styles.chips}>
            <Chip size="xs" tint={categoryTint(template.category)} label={t.explore.categoryNames[template.category]} />
            <Chip size="xs" tone="muted" label={t.explore.preview.difficulty(t.explore.difficulty[template.difficulty])} />
            <Chip size="xs" tone="muted" label={t.create.taskTypes[template.taskType].title} />
          </View>

          {template.description ? (
            <Text style={[previewTypography.description, styles.description, { color: colors.textBody }]}>
              {template.description}
            </Text>
          ) : null}

          <PreviewFeatures taskType={template.taskType} />

          <Text style={[typography.captionStrong, styles.durationLabel, { color: colors.text }]}>
            {t.explore.preview.duration}
          </Text>
          <Segmented
            options={durationSegments}
            value={String(duration)}
            onChange={(v) => setPicked(Number(v) as DurationOption)}
            role="radio"
            accessibilityLabel={t.explore.preview.duration}
            style={styles.segmented}
          />

          {doing && (
            <View style={styles.friends}>
              {faces.length > 0 && (
                <AvatarStack people={faces} size={m.friendAvatar} outlineColor={colors.background} />
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
          <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.error, { color: colors.dangerText }]}>
            {create.error.message}
          </Text>
        )}
        <View style={styles.buttons}>
          <Button
            title={t.explore.preview.withFriends}
            variant="secondary"
            onPress={() => start('friends')}
            loading={create.isPending && mode === 'friends'}
            style={styles.button}
          />
          <Button
            title={t.explore.preview.startSolo}
            onPress={() => start('solo')}
            loading={create.isPending && mode === 'solo'}
            style={styles.button}
          />
        </View>
      </View>
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
