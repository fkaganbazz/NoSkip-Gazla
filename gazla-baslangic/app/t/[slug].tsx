import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { savePendingTemplate, useAuth } from '@/data';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';

// Şablon linki (https://<alan-adi>/t/<slug>, src/config/links.ts templateLink): uygulama açıksa şablon önizlemesine
// gider. Oturum yoksa ya da onboarding sürüyorsa şablon saklanır, onboarding bitince Bugün açılırken önizleme
// gelir (`useOpenPendingTemplate`). Korumasız route: oturumsuz da açılır.
export default function TemplateShortLink() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { status } = useAuth();
  const onboarding = useOnboarding();
  const appOpen = status === 'ready' && !onboarding.inProgress;

  useEffect(() => {
    if (!appOpen && slug) void savePendingTemplate(slug);
  }, [appOpen, slug]);

  if (!appOpen) return <Redirect href="/" />;
  // Önizleme kimlik ya da kısa adla açılır
  return <Redirect href={{ pathname: '/challenge/preview/[templateId]', params: { templateId: slug ?? '' } }} />;
}
