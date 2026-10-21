/**
 * Görünümü görsele çevirme ve paylaşmanın platformdan bağımsız hesapları (birim testli).
 */

/** İstenen çıktı, piksel cinsinden (ör. Story 1080×1920) */
export type PixelSize = { width: number; height: number };

/**
 * react-native-view-shot `captureRef` için `width`/`height` seçeneği. Kütüphane bu değerleri
 * platforma göre farklı yorumlar:
 * - iOS: nokta (point); görüntü cihaz ölçeğiyle (PixelRatio, @2x/@3x) çizilir → piksel / PixelRatio.
 * - Android: piksel (Bitmap.createScaledBitmap) → olduğu gibi.
 * - Web (html2canvas): tuvalin piksel ölçüsü → olduğu gibi.
 * Böylece her cihazda dosya tam olarak istenen piksel ölçüsünde çıkar.
 */
export function captureSize(output: PixelSize, platform: string, pixelRatio: number): PixelSize {
  if (platform === 'ios' && pixelRatio > 0) {
    return { width: output.width / pixelRatio, height: output.height / pixelRatio };
  }
  return { width: output.width, height: output.height };
}

/** Şemasız dosya yolunu (iOS view-shot "/var/…/x.png" döner) file:// URI'ye çevirir */
export function toFileUri(uri: string): string {
  return uri.startsWith('/') ? `file://${uri}` : uri;
}

/** Paylaşılan görselin dosya adı: "gazla-<challenge>.png" (harf, rakam, tire) */
export function shareFileName(base: string): string {
  const slug = base
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return `gazla${slug ? `-${slug}` : ''}.png`;
}
