/**
 * Görünümü PNG'ye çevirip paylaşma — native (iOS/Android). Web eşi: `shareImage.web.ts`.
 *
 * - `captureViewAsPng`: react-native-view-shot `captureRef` ile geçici PNG dosyası (tam istenen piksel ölçüsü;
 *   hesap `captureSize`). Görünüm `collapsable={false}` olmalı ve çizilmiş olmalı (onLayout sonrası).
 * - `shareImageFile`: expo-sharing paylaşım sayfası (Instagram — Story dahil —, WhatsApp, Kaydet …).
 */
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { PixelRatio, Platform, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { captureSize, toFileUri, type PixelSize } from './imageOutput';

export type ShareImageResult = 'shared' | 'downloaded' | 'unavailable';

export async function captureViewAsPng(view: RefObject<View | null>, output: PixelSize): Promise<string> {
  const size = captureSize(output, Platform.OS, PixelRatio.get());
  const uri = await captureRef(view, { format: 'png', quality: 1, result: 'tmpfile', ...size });
  return toFileUri(uri);
}

/**
 * Paylaşım sayfasını açar; kullanıcı vazgeçse de 'shared' döner (sistem bunu bildirmez).
 * Paylaşım yoksa 'unavailable' (çağıran metin paylaşımına düşer).
 * `fileName` web eşinde indirilen dosyanın adı; native'de geçici dosya adı kullanılır.
 */
export async function shareImageFile(
  uri: string,
  { dialogTitle }: { dialogTitle: string; fileName: string },
): Promise<ShareImageResult> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
  return 'shared';
}
