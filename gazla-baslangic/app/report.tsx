import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClockIcon } from '@/components/icons';
import { Button, Checkbox, ScreenHeader, TextField } from '@/components/ui';
import { useFriendProfile, useSubmitReportMutation, type ReportReason, type ReportTarget } from '@/data';
import { toAccusative } from '@/features/friends/names';
import ReasonList from '@/features/report/ReasonList';
import { componentTypography, layout, typography, useTheme } from '@/theme';
import { socialMetrics as m, socialTypography } from '@/theme/social';

/** Sunucudaki reports.details sınırı */
const DETAILS_MAX = 500;

type Params = {
  /** 'user' | 'photo' | 'challenge' ('checkin' = 'photo') */
  targetType?: string;
  /** Kişi, check-in ya da challenge id'si */
  targetId?: string;
  /** Fotoğraf/challenge şikayetinde içeriğin sahibi */
  userId?: string;
  /** Davet linkinden challenge şikayeti (InviteLanding) */
  inviteCode?: string;
  /** Ad biliniyorsa başlıkta kullanılır */
  name?: string;
};

const toTarget = (t: string | undefined): ReportTarget =>
  t === 'photo' || t === 'checkin' ? 'photo' : t === 'challenge' ? 'challenge' : 'user';

// Şikayet et — design/Report.dc.html (modal). Neden (radio), isteğe bağlı ayrıntı, kişiyi de engelle;
// submit_report. Gönderilince teşekkür durumu gösterilir.
export default function ReportScreen() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const { colors } = useTheme();

  const target = toTarget(params.targetType);
  const userId = target === 'user' ? params.targetId : params.userId;
  const profile = useFriendProfile(target === 'user' ? params.targetId : params.userId);
  const name = profile.data?.displayName ?? params.name ?? null;

  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  // Engellenince profil artık okunamaz; teşekkür metni için ad gönderirken saklanır
  const [sentName, setSentName] = useState<string | null>(null);
  const submit = useSubmitReportMutation();
  const sent = submit.isSuccess;
  const blocked = sent && !!submit.variables?.alsoBlock;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const title =
    target === 'user'
      ? name
        ? `${name} hakkında ne oldu?`
        : 'Ne oldu?'
      : target === 'photo'
        ? 'Bu fotoğrafta ne oldu?'
        : "Bu challenge'da ne oldu?";
  const intro =
    target === 'user' && name
      ? `Şikayetin gizli kalır. ${name} bunu kimin bildirdiğini görmez.`
      : 'Şikayetin gizli kalır. Kimin bildirdiğini kimse görmez.';

  const onSubmit = () => {
    setSentName(name);
    submit.mutate({
      target,
      reason,
      details: details.trim() || undefined,
      alsoBlock: !!userId && alsoBlock,
      userId,
      checkinId: target === 'photo' ? params.targetId : undefined,
      challengeId: target === 'challenge' ? params.targetId : undefined,
      inviteCode: params.inviteCode,
    });
  };

  const header = <ScreenHeader title="Şikayet et" leading="close" onLeadingPress={close} size="compact" align="center" />;

  if (sent) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <View style={styles.content}>
          {header}
          <View style={styles.thanks}>
            <Text accessibilityRole="header" style={[socialTypography.reportTitle, { color: colors.text }]}>
              Teşekkürler
            </Text>
            <Text style={[typography.body, { color: colors.textBody }]}>
              Şikayetin bize ulaştı. Ekibimiz 24 saat içinde inceleyecek.
            </Text>
            {blocked && (
              <Text style={[typography.body, { color: colors.textBody }]}>
                {sentName ? `${toAccusative(sentName)} engelledin.` : 'Bu kişiyi engelledin.'}
              </Text>
            )}
          </View>
          <View style={styles.footer}>
            <Button title="Tamam" onPress={() => (blocked ? router.dismissTo('/friends') : close())} />
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
            label="Ayrıntı ekle (isteğe bağlı)"
            value={details}
            onChangeText={setDetails}
            placeholder="Ne olduğunu kısaca yaz"
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
                {name ? `${toAccusative(name)} de engelle` : 'Bu kişiyi de engelle'}
              </Text>
            </Pressable>
          )}

          <View style={styles.note}>
            <ClockIcon color={colors.textSecondary} size={m.noteIconSize} strokeWidth={m.noteIconStrokeWidth} />
            <Text style={[typography.meta, styles.noteText, { color: colors.textBody }]}>
              Ekibimiz şikayetleri 24 saat içinde inceler.
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
            <Button title="Şikayeti gönder" variant="ink" onPress={onSubmit} loading={submit.isPending} />
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
