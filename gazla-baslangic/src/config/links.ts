/**
 * Uygulama dışı bağlantılar: yasal metinler, destek ve davet linki.
 * Alan adı henüz belli değil; değerler `.env`'den (EXPO_PUBLIC_*) gelir. Tanımlı değilse aşağıdaki
 * varsayılanlar kullanılır — yayından önce gerçek adreslerle doldurulmalı.
 */
import * as Linking from 'expo-linking';

import { getLanguage, type Language } from '../i18n/language';

const env = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim().replace(/\/+$/, '') : fallback);

/** Web sitesi kökü (yasal sayfalar bunun altında) */
export const WEB_BASE_URL = env(process.env.EXPO_PUBLIC_WEB_BASE_URL, 'https://gazla.app');

/** Davet linki kökü: `${INVITE_BASE_URL}/<kod>` (EKRANLAR.md 1.5: https://<alan-adi>/d/<kod>) */
export const INVITE_BASE_URL = env(process.env.EXPO_PUBLIC_INVITE_BASE_URL, `${WEB_BASE_URL}/d`);

/** Destek e-postası (Ayarlar "Bize yaz", mailto) */
export const SUPPORT_EMAIL = env(process.env.EXPO_PUBLIC_SUPPORT_EMAIL, 'destek@gazla.app');

export const legalLinks = {
  terms: `${WEB_BASE_URL}/kosullar`,
  privacy: `${WEB_BASE_URL}/gizlilik`,
  kvkk: `${WEB_BASE_URL}/kvkk`,
  help: `${WEB_BASE_URL}/yardim`,
} as const;

export type LegalLink = keyof typeof legalLinks;

/** İngilizce sayfalar (`/en/…`); KVKK aydınlatma metni yalnızca Türkçe */
const legalLinksEn: Record<LegalLink, string> = {
  terms: `${WEB_BASE_URL}/en/terms`,
  privacy: `${WEB_BASE_URL}/en/privacy`,
  kvkk: `${WEB_BASE_URL}/kvkk`,
  help: `${WEB_BASE_URL}/en/help`,
};

/** Yasal sayfanın uygulama dilindeki adresi */
export const legalLinkFor = (key: LegalLink, lang: Language = getLanguage()) =>
  lang === 'en' ? legalLinksEn[key] : legalLinks[key];

/** Paylaşılan davet linki (universal link). Uygulama içinde `/d/<kod>` route'u açar. */
export const inviteLink = (code: string) => `${INVITE_BASE_URL}/${encodeURIComponent(code)}`;

/** Uygulamanın kendi şemasıyla davet adresi (gazla://invite/<kod>); universal link yoksa yedek */
export const inviteDeepLink = (code: string) => Linking.createURL(`invite/${encodeURIComponent(code)}`);

export const supportMailto = (subject?: string) =>
  `mailto:${SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
