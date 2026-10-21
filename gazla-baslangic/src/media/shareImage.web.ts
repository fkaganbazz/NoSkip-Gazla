/**
 * Görünümü PNG'ye çevirip paylaşma — web. react-native-view-shot web'de html2canvas kullanır
 * (DOM'u tuvale çizer). Tarayıcı dosya paylaşımını destekliyorsa (Web Share, çoğunlukla mobil)
 * paylaşım sayfası açılır, yoksa PNG indirilir. Yakalama başarısız olursa çağıran metin paylaşımına düşer.
 */
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { captureSize, type PixelSize } from './imageOutput';

export type ShareImageResult = 'shared' | 'downloaded' | 'unavailable';

export async function captureViewAsPng(view: RefObject<View | null>, output: PixelSize): Promise<string> {
  const size = captureSize(output, 'web', 1);
  return captureRef(view, { format: 'png', quality: 1, result: 'data-uri', ...size });
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareImageFile(
  uri: string,
  { dialogTitle, fileName }: { dialogTitle: string; fileName: string },
): Promise<ShareImageResult> {
  if (typeof document === 'undefined') return 'unavailable';
  const blob = await (await fetch(uri)).blob();
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: dialogTitle });
      return 'shared';
    } catch (error) {
      // Kullanıcı vazgeçti: hata değil
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
      // Kullanıcı etkileşimi süresi doldu ya da izin yok: indirmeye düş
    }
  }
  download(blob, fileName);
  return 'downloaded';
}
