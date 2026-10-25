import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClockIcon } from '@/components/icons';
import { Button, Checkbox, ScreenHeader, TextField } from '@/components/ui';
import { useFriendProfile, useReport, type ReportReason, type ReportTarget } from '@/data';
import ReasonList from '@/features/report/ReasonList';
import { useT } from '@/i18n';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

/** Sunucudaki reports.details sınırı */
const DETAILS_MAX = 500;

/**
 * /report/<kişi>?target=… — kişi yolda: kişi şikayetinde şikayet edilen, içerik şikayetinde içeriğin sahibi
 * (fotoğrafı gönderen, challenge'ın kurucusu). İçerik kimliği sorguda:
 * - `/report/u-ece` — kişi
 * - `/report/u-ece?target=photo&contentId=<check-in id>` — fotoğraf
 * - `/report/u-mert?target=challenge&challengeId=c-phone` — challenge
 */
type Params = {
  userId: string;
  /** 'user' (varsayılan) | 'photo' | 'challenge' */
  target?: string;
  /** Fotoğraf şikayetinde fotoğrafın check-in id'si */
  contentId?: string;
  /** Challenge şikayetinde challenge id'si */
  challengeId?: string;
  /** Ad biliniyorsa başlıkta kullanılır (profil okunamazsa) */
  name?: string;
};

const toTarget = (t: string | undefined): ReportTarget => (t === 'photo' ? 'photo' : t === 'challenge' ? 'challenge' : 'user');

// Şikayet et — design/Report.dc.html (modal). Neden (radio), isteğe bağlı ayrıntı, kişiyi de engelle;
// submit_report. Gönderilince teşekkür durumu gösterilir.
export default function ReportScreen() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const { colors } = useTheme();
  const t = useT();

  const target = toTarget(params.target);
  const userId = params.userId;
  const profile = useFriendProfile(userId);
  const name = profile.data?.displayName ?? params.name ?? null;

  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  // Engellenince profil artık okunamaz; teşekkür metni için ad gönderirken saklanır
  const [sentName, setSentName] = useState<string | null>(null);
  const { submit } = useReport();
  const sent = submit.isSuccess;
  const blocked = sent && !!submit.variables?.alsoBlock;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const title =
    target === 'user'
      ? name
        ? t.report.question.user(name)
        : t.report.question.generic
      : target === 'photo'
        ? t.report.question.photo
        : t.report.question.challenge;
  const intro = target === 'user' && name ? t.report.intro.named(name) : t.report.intro.generic;

  const onSubmit = () => {
    setSentName(name);
    submit({
      target,
      reason,
      details: details.trim() || undefined,
      alsoBlock: !!userId && alsoBlock,
      userId,
      checkinId: target === 'photo' ? params.contentId : undefined,
      challengeId: target === 'challenge' ? params.challengeId : undefined,
    });
  };

  const header = <ScreenHeader title={t.common.report} leading="close" onLeadingPress={close} size="compact" align="center" />;

  if (sent) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.content}>
          {header}
          <View style={styles.thanks}>
            <Text accessibilityRole="header" style={[socialTypography.reportTitle, { color: colors.text }]}>
              {t.report.thanks.title}
            </Text>
            <Text style={[typography.body, { color: colors.textBody }]}>{t.report.thanks.body}</Text>
            {blocked && (
              <Text style={[typography.body, { color: colors.textBody }]}>
                {sentName ? t.report.thanks.blocked(sentName) : t.report.thanks.blockedGeneric}
              </Text>
            )}
          </View>
          <View style={styles.footer}>
            <Button title={t.common.done} onPress={() => (blocked ? router.dismissTo('/friends') : close())} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {header}

          <View style={styles.intro}>
            <Text accessibilityRole="header" style={[socialTypography.reportTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[typography.body, { color: colors.textBody }]}>{intro}</Text>
          </View>

          <ReasonList value={reason} onChange={setReason} />

          <TextField
            label={t.report.detailsLabel}
            value={details}
            onChangeText={setDetails}
            placeholder={t.report.detailsPlaceholder}
            size="sm"
            multiline
            maxLength={DETAILS_MAX}
            style={styles.detail}
          />

          {!!userId && (
            <Pressable
              onPress={() => setAlsoBlock((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: alsoBlock }}
              aria-checked={alsoBlock}
              style={styles.block}>
              <Checkbox checked={alsoBlock} />
              <Text style={[socialTypography.blockLabel, { color: colors.text }]}>
                {name ? t.report.alsoBlock.named(name) : t.report.alsoBlock.generic}
              </Text>
            </Pressable>
          )}

          <View style={styles.note}>
            <ClockIcon color={colors.textSecondary} size={m.noteIconSize} strokeWidth={m.noteIconStrokeWidth} />
            <Text style={[typography.meta, styles.noteText, { color: colors.textBody }]}>
              {t.report.reviewNote}
            </Text>
          </View>

          <View style={styles.footer}>
            {submit.error && (
              <Text
                accessibilityLiveRegion="polite"
                style={[componentTypography.inputError, styles.error, { color: colors.dangerText }]}>
                {submit.error.message}
              </Text>
            )}
            <Button title={t.report.submit} variant="ink" onPress={onSubmit} loading={submit.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: layout.screenTopGap,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: m.reportPaddingBottom,
  },
  intro: {
    marginTop: m.reportIntroMarginTop,
    gap: m.reportIntroGap,
  },
  detail: {
    marginTop: m.detailMarginTop,
  },
  block: {
    marginTop: m.blockMarginTop,
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.blockGap,
  },
  note: {
    marginTop: m.reportNoteMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.noteGap,
  },
  noteText: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: m.sendMarginTop,
  },
  error: {
    marginBottom: m.pokeErrorMarginBottom,
    textAlign: 'center',
  },
  thanks: {
    marginTop: m.reportIntroMarginTop,
    gap: m.thanksGap,
  },
});
