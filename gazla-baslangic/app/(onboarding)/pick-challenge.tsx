import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import OnboardingHeader from '@/components/OnboardingHeader';
import { Button, ErrorState, LoadingState } from '@/components/ui';
import { useAuth, useChallengeTemplates } from '@/data';
import { nextStepAfterProfile } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import TemplateTile from '@/features/onboarding/TemplateTile';
import { useT } from '@/i18n';
import { onboardingMetrics as m } from '@/theme/onboarding';

// İlk challenge'ını seç — design/PickChallenge.dc.html (adım 1/4). Seçim girişten sonra
// oluşturulmak üzere onboarding durumunda saklanır. "Kendim oluşturacağım" profil adımından sonra Create'i açar.
// Profil tamamlandıktan sonra da (davet adımından geri) açılır: seçim değiştirilip doğrudan devam edilir.
export default function PickChallengeScreen() {
  const router = useRouter();
  const t = useT();
  const { status } = useAuth();
  const onboarding = useOnboarding();
  const { pickedTemplateId, pickTemplate, chooseCustom } = onboarding;
  // Onboarding şablonları (6), onboarding sırasıyla
  const templates = useChallengeTemplates({ featured: true });
  const signedUp = status === 'ready';

  const list = useMemo(() => templates.data ?? [], [templates.data]);
  const [choice, setChoice] = useState<string | null>(pickedTemplateId);
  // Seçim yoksa 2. şablon seçili gelir (tasarımda bir kart hep seçili; EKRANLAR.md 1.2 kabul)
  const selectedId =
    choice && list.some((x) => x.id === choice) ? choice : (list[DEFAULT_INDEX]?.id ?? list[0]?.id ?? null);

  const rows = useMemo(() => {
    const out: (typeof list)[] = [];
    for (let i = 0; i < list.length; i += 2) out.push(list.slice(i, i + 2));
    return out;
  }, [list]);

  // Profil tamamlandıysa giriş adımlarına dönülmez: geri = geldiği adıma (davet ya da Create) dön
  const goBack = () =>
    signedUp
      ? router.replace(nextStepAfterProfile(onboarding))
      : router.canGoBack()
        ? router.back()
        : router.replace('/(onboarding)/welcome');

  return (
    <StepScreen
      footer={
        <>
          <Button
            title={t.common.continue}
            disabled={!selectedId}
            onPress={() => {
              pickTemplate(selectedId);
              router.push(signedUp ? '/(onboarding)/invite' : '/(onboarding)/sign-in');
            }}
          />
          <Button
            title={t.onboarding.pick.custom}
            variant="text"
            onPress={() => {
              // Kendi challenge'ı hesap açılıp profil tamamlanınca Create'te oluşturulur
              chooseCustom();
              router.push(signedUp ? '/(onboarding)/create' : '/(onboarding)/sign-in');
            }}
          />
        </>
      }>
      <OnboardingHeader step={1} onBack={goBack} />
      <StepIntro title={t.onboarding.pick.title} body={t.onboarding.pick.body} />

      {templates.isPending ? (
        <View style={styles.state}>
          <LoadingState />
        </View>
      ) : templates.isError ? (
        <View style={styles.state}>
          <ErrorState onRetry={() => templates.refetch()} />
        </View>
      ) : (
        <View accessibilityRole="radiogroup" style={styles.grid}>
          {rows.map((row) => (
            <View key={row[0].id} style={styles.row}>
              {row.map((x) => (
                <TemplateTile key={x.id} template={x} selected={x.id === selectedId} onPick={setChoice} />
              ))}
              {row.length === 1 && <View style={styles.filler} />}
            </View>
          ))}
        </View>
      )}
    </StepScreen>
  );
}

/** Varsayılan seçili karo: 2. (PickChallenge.png) */
const DEFAULT_INDEX = 1;

const styles = StyleSheet.create({
  grid: {
    marginTop: m.gridMarginTop,
    gap: m.gridGap,
  },
  row: {
    flexDirection: 'row',
    gap: m.gridGap,
  },
  filler: {
    flex: 1,
  },
  state: {
    marginTop: m.gridMarginTop,
    minHeight: m.tileHeight * 2,
  },
});
