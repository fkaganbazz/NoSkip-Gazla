import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, LoadingState } from '@/components/ui';
import { useTemplates } from '@/data';
import { onboardingTemplates } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import StepHeader from '@/features/onboarding/StepHeader';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import TemplateTile from '@/features/onboarding/TemplateTile';
import { onboardingMetrics as m } from '@/theme/onboarding';

// İlk challenge'ını seç — design/PickChallenge.dc.html (adım 1/4). Seçim girişten sonra
// oluşturulmak üzere onboarding durumunda saklanır.
export default function PickChallengeScreen() {
  const router = useRouter();
  const { pickedTemplateId, pickTemplate } = useOnboarding();
  const templates = useTemplates();

  const list = useMemo(() => onboardingTemplates(templates.data ?? []), [templates.data]);
  const [choice, setChoice] = useState<string | null>(pickedTemplateId);
  // Seçim yoksa ilk şablon seçili gelir (tasarımda bir kart hep seçili)
  const selectedId = choice && list.some((t) => t.id === choice) ? choice : (list[0]?.id ?? null);

  const rows = useMemo(() => {
    const out: (typeof list)[] = [];
    for (let i = 0; i < list.length; i += 2) out.push(list.slice(i, i + 2));
    return out;
  }, [list]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(onboarding)'));

  return (
    <StepScreen
      footer={
        <>
          <Button
            title="Devam"
            disabled={!selectedId}
            onPress={() => {
              pickTemplate(selectedId);
              router.push('/(onboarding)/sign-in');
            }}
          />
          <Button
            title="Kendim oluşturacağım"
            variant="text"
            onPress={() => {
              // Kendi challenge'ı uygulama açılınca Bugün'deki boş durumdan oluşturulur
              pickTemplate(null);
              router.push('/(onboarding)/sign-in');
            }}
          />
        </>
      }>
      <StepHeader step={1} onBack={goBack} />
      <StepIntro
        title="İlk challenge'ını seç"
        body="Sonra istediğin kadar ekleyebilirsin. Arkadaşların da aynı challenge'a katılabilir."
      />

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
              {row.map((t) => (
                <TemplateTile key={t.id} template={t} selected={t.id === selectedId} onPick={setChoice} />
              ))}
              {row.length === 1 && <View style={styles.filler} />}
            </View>
          ))}
        </View>
      )}
    </StepScreen>
  );
}

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
