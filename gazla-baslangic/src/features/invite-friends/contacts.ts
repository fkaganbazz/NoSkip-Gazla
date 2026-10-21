/**
 * "Rehberden bul": rehberdeki e-posta adresleri (expo-contacts). Adresler cihazdan çıkmaz; ekran bunları
 * `hashContactEmails` (@/data: kırp, küçük harf, SHA-256 hex) ile özetleyip yalnızca özetleri gönderir.
 * Web'de rehber yok (`CONTACTS_SUPPORTED` false; satır gizlenir).
 */
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';
import { Platform } from 'react-native';

export const CONTACTS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

export type ContactEmails =
  /** İzin yok; `canAskAgain` false ise yalnızca Ayarlar'dan açılır */
  | { status: 'denied'; canAskAgain: boolean }
  /** `limited`: iOS 18+ "Seçili kişiler" izni — yalnızca seçilen kişilere bakıldı */
  | { status: 'granted'; emails: string[]; limited: boolean };

/** İzin ister (gerekirse) ve rehberdeki tüm e-posta adreslerini okur */
export async function readContactEmails(): Promise<ContactEmails> {
  let permission = await getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) permission = await requestPermissionsAsync();
  if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };

  const rows = await Contact.getAllDetails([ContactField.EMAILS]);
  const emails = rows.flatMap((row) => (row.emails ?? []).map((e) => e.address ?? '')).filter((a) => a.includes('@'));
  return { status: 'granted', emails, limited: permission.accessPrivileges === 'limited' };
}

/** iOS 18+ sınırlı izinde: sistem kişi seçicisini açar (daha fazla kişi paylaşmak için) */
export async function pickMoreContacts(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await Contact.presentAccessPicker();
  } catch {
    // iOS 18 altı ya da kullanıcı kapattı
  }
}
