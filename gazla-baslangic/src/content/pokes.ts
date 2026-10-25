/**
 * Hazır dürtme mesajları — docs/EKRANLAR.md 3.2: "Mesajlar sabit listeden (`src/content/pokes.ts`,
 * id ile); serbest metin yok". Tasarım: design/Poke.dc.html (2×3 karo, gaz ve laf ayrı).
 *
 * Id'ler ve metinler `supabase/migrations/20261007100900_reference_data.sql` içindeki
 * `poke_messages` seed'iyle AYNI olmalı: istemci yalnızca id gönderir (`send_poke(p_message_key)`),
 * sunucu id'nin etkin ve tonla eşleşen bir mesaj olduğunu doğrular. Listeye mesaj eklerken ya da
 * metni değiştirirken migration'ı da güncelle.
 */
import type { PokeTone } from '../data/types';
import { getLanguage, type Language } from '../i18n/language';

export type PokeMessageContent = {
  /** poke_messages.key */
  id: string;
  tone: PokeTone;
  /** Türkçe metin (poke_messages.text_tr) */
  text: string;
  /** İngilizce metin (poke_messages.text_en); yoksa Türkçesi gösterilir */
  textEn: string | null;
};

/** Karo sırası tasarımdaki gibi (her tonda 6; sortOrder = tondaki sıra) */
export const POKE_MESSAGES: readonly PokeMessageContent[] = [
  { id: 'almost_there', tone: 'hype', text: 'Az kaldı, bırakma!', textEn: "So close, don't quit!" },
  { id: 'streak_going_well', tone: 'hype', text: 'Serin çok iyi gidiyor', textEn: 'Your streak is on fire' },
  { id: 'finish_together', tone: 'hype', text: 'Beraber bitireceğiz', textEn: "We'll finish together" },
  { id: 'take_five', tone: 'hype', text: '5 dakikanı ayır, hallet', textEn: '5 minutes, get it done' },
  { id: 'proud_of_you', tone: 'hype', text: 'Seninle gurur duyuyorum', textEn: 'So proud of you' },
  { id: 'diken_waiting', tone: 'hype', text: 'Diken seni bekliyor', textEn: "Diken's waiting for you" },
  { id: 'cactus_faster', tone: 'roast', text: 'Kaktüs bile senden hızlı büyüyor', textEn: 'Even cacti grow faster than you' },
  { id: 'phone_in_hand', tone: 'roast', text: 'Telefon elinde, challenge nerede?', textEn: 'Phone in hand, but no challenge?' },
  { id: 'diken_thirsty', tone: 'roast', text: 'Diken susuz kaldı, haberin olsun', textEn: "Diken's thirsty, just saying" },
  { id: 'today_tomorrow', tone: 'roast', text: 'Bugün mü, yarın mı, seneye mi?', textEn: 'Today, tomorrow, or next year?' },
  { id: 'streak_crying', tone: 'roast', text: 'Serin şu an ağlıyor', textEn: 'Your streak is crying' },
  { id: 'i_did_it', tone: 'roast', text: 'Ben yaptım. Sen?', textEn: 'I did mine. You?' },
];

/**
 * Aktivite "Tebrik et" (arkadaş challenge bitirdi): seçim sayfası açılmadan doğrudan gönderilen gaz
 * mesajı. `usePoke().send({ toUserId, messageId: CONGRATS_POKE_ID })`
 */
export const CONGRATS_POKE_ID = 'proud_of_you';
export const CONGRATS_POKE = POKE_MESSAGES.find((m) => m.id === CONGRATS_POKE_ID)!;

/** Bir tondaki mesajlar, karo sırasıyla */
export function pokeMessagesFor(tone: PokeTone): PokeMessageContent[] {
  return POKE_MESSAGES.filter((m) => m.tone === tone);
}

/** Mesajın uygulama dilindeki metni (İngilizcesi yoksa Türkçesi) */
export function pokeMessageText(message: PokeMessageContent, lang: Language = getLanguage()): string {
  return lang === 'en' ? (message.textEn ?? message.text) : message.text;
}

/** Dürtme metni (Aktivite alıntı balonu); bilinmeyen (kaldırılmış) id için null */
export function pokeText(id: string, tone?: PokeTone, lang: Language = getLanguage()): string | null {
  const message = POKE_MESSAGES.find((m) => m.id === id && (!tone || m.tone === tone));
  return message ? pokeMessageText(message, lang) : null;
}
