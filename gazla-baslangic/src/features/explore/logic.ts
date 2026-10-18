/** Önizleme metin kuralları — design/ChallengePreview.dc.html */
import type { TemplateStats } from '@/data';

/**
 * "Mert, Kerem ve 310 kişi şu an yapıyor". Sayılar sunucudan (template_stats); yalnızca
 * gösterilen arkadaşlar toplamdan düşülür. Kimse yoksa null.
 */
export function doingNowText(stats: TemplateStats): string | null {
  const names = stats.friends.map((f) => f.displayName);
  const others = Math.max(0, stats.activeCount - names.length);
  if (names.length === 0) {
    return others > 0 ? `${others} kişi şu an yapıyor` : null;
  }
  if (others === 0) {
    return names.length === 1 ? `${names[0]} şu an yapıyor` : `${names[0]} ve ${names[1]} şu an yapıyor`;
  }
  return `${names.join(', ')} ve ${others} kişi şu an yapıyor`;
}
