/**
 * Yüklemeden önce görsel küçültme (expo-image-manipulator; web'de canvas ile aynı API).
 * Uzun kenar en çok `maxEdge` olur (küçük görsel büyütülmez), sonuç JPEG `quality` ile kaydedilir.
 * Ölçüler EXIF yönü uygulanmış gerçek görselden okunur (kamera/seçici ölçüsüne güvenilmez).
 */
import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';

export type ImageSize = { width: number; height: number };

export type CompressedImage = ImageSize & { uri: string };

/** Uzun kenarı `maxEdge`e indiren yeniden boyutlandırma (tek kenar; oran korunur). Zaten küçükse null. */
export function fitLongEdge(size: ImageSize, maxEdge: number): { width: number } | { height: number } | null {
  const { width, height } = size;
  if (!(width > 0) || !(height > 0)) return null;
  if (Math.max(width, height) <= maxEdge) return null;
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}

/**
 * Görseli küçültüp JPEG olarak kaydeder; yeni dosyanın URI'si (native: önbellek dizini, web: blob:).
 * Hata fırlatabilir (bozuk dosya, yer yok): çağıran özgün dosyayla devam edebilir.
 */
export async function compressImage(
  uri: string,
  { maxEdge, quality }: { maxEdge: number; quality: number },
): Promise<CompressedImage> {
  const refs: { release(): void }[] = [];
  try {
    const source = ImageManipulator.manipulate(uri);
    refs.push(source);
    const base: ImageRef = await source.renderAsync();
    refs.push(base);

    const resize = fitLongEdge(base, maxEdge);
    let output = base;
    if (resize) {
      const resized = ImageManipulator.manipulate(base).resize(resize);
      refs.push(resized);
      output = await resized.renderAsync();
      refs.push(output);
    }
    const saved = await output.saveAsync({ format: SaveFormat.JPEG, compress: quality });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  } finally {
    for (const ref of refs) {
      try {
        ref.release();
      } catch {
        // yok say: bellek nesnesi zaten bırakılmış
      }
    }
  }
}
