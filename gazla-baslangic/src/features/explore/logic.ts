/** Önizleme metin kuralları — design/ChallengePreview.dc.html */
import type { TemplateStats } from '@/data';
import type { Messages } from '@/i18n';

/**
 * "Mert, Kerem ve 310 kişi şu an yapıyor". Sayılar sunucudan (template_stats); yalnızca
 * gösterilen arkadaşlar toplamdan düşülür. Kimse yoksa null.
 */
export function doingNowText(stats: TemplateStats, t: Messages): string | null {
  const w = t.explore.preview.doingNow;
  const names = stats.friends.map((f) => f.displayName);
  const others = Math.max(0, stats.activeCount - names.length);
  if (names.length === 0) {
    return others > 0 ? w.others(others) : null;
  }
  if (others === 0) {
    return names.length === 1 ? w.one(names[0]) : w.two(names[0], names[1]);
  }
  return w.namesAndOthers(names.join(', '), others);
}
