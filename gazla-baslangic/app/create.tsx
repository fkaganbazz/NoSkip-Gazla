import { useLocalSearchParams } from 'expo-router';

import CreateScreen from '@/features/create/CreateScreen';

// Yeni challenge (tam ekran modal) — form src/features/create/CreateScreen.tsx (onboarding de kullanır).
// Keşfet/şablon ekranı `?templateId=&durationDays=` ile açarsa form o şablon ve süreyle dolu gelir;
// oluşturulunca challenge detayına geçilir.
export default function CreateRoute() {
  const { templateId, durationDays } = useLocalSearchParams<{ templateId?: string; durationDays?: string }>();
  const days = durationDays ? Number(durationDays) : undefined;
  return (
    <CreateScreen
      initialTemplateId={templateId || undefined}
      initialDurationDays={days !== undefined && Number.isFinite(days) ? days : undefined}
    />
  );
}
