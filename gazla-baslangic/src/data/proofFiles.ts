/**
 * Kuyruktaki fotoğraf kanıtlarının dosyaları. Seçici/kamera dosyası önbellek dizinindedir ve
 * sistem onu silebilir; çevrimdışı kuyruğa giren fotoğraf uygulamanın kalıcı dizinine
 * (`Paths.document/proof-queue/<id>.<uzantı>`) kopyalanır, kuyrukta o URI tutulur. Gönderim
 * bitince ya da işlem atılınca dosya silinir.
 *
 * Web'de dosya sistemi yok: URI (blob:) olduğu gibi kalır.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const DIR_NAME = 'proof-queue';
const IMAGE_EXT = /^\.(jpe?g|png|webp|heic|heif)$/i;

const supported = Platform.OS !== 'web';

function queueDir(): Directory | null {
  if (!supported) return null;
  try {
    return new Directory(Paths.document, DIR_NAME);
  } catch {
    return null;
  }
}

/** Bu URI kuyruğun kendi kopyası mı */
export function isQueuedProofFile(uri: string): boolean {
  const dir = queueDir();
  return !!dir && uri.startsWith(dir.uri);
}

/**
 * Dosyayı kalıcı dizine kopyala ve yeni URI'yi döndür. Kopyalanamazsa (web, dosya yok, yer yok)
 * özgün URI kalır; gönderim yine dener.
 */
export function persistProofFile(uri: string): string {
  const dir = queueDir();
  if (!dir || uri.startsWith(dir.uri)) return uri;
  try {
    dir.create({ intermediates: true, idempotent: true });
    const source = new File(uri);
    const ext = IMAGE_EXT.test(source.extension) ? source.extension.toLowerCase() : '.jpg';
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const target = new File(dir, `${id}${ext}`);
    source.copySync(target);
    return target.uri;
  } catch {
    return uri;
  }
}

/** Kuyruğun kopyasıysa sil (özgün seçici dosyasına dokunmaz) */
export function deleteProofFile(uri: string | undefined): void {
  if (!uri || !isQueuedProofFile(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // yok say: bir sonraki temizlikte silinir
  }
}

/** Kuyrukta artık olmayan kopyaları sil (ör. uygulama kopyalama ile kayıt arasında kapandıysa) */
export function sweepProofFiles(referenced: Set<string>): void {
  const dir = queueDir();
  if (!dir) return;
  try {
    if (!dir.exists) return;
    for (const entry of dir.list()) {
      if (entry instanceof File && !referenced.has(entry.uri)) entry.delete();
    }
  } catch {
    // yok say
  }
}
