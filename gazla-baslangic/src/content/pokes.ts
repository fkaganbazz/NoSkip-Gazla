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

export type PokeMessageContent = {
  /** poke_messages.key */
  id: string;
  tone: PokeTone;
  /** Türkçe metin (poke_messages.text_tr) */
  text: string;
  /** İngilizce metin henüz tasarlanmadı (poke_messages.text_en) */
  textEn: string | null;
};

/** Karo sırası tasarımdaki gibi (her tonda 6; sortOrder = tondaki sıra) */
export const POKE_MESSAGES: readonly PokeMessageContent[] = [
  { id: 'almost_there', tone: 'hype', text: 'Az kaldı, bırakma!', textEn: null },
  { id: 'streak_going_well', tone: 'hype', text: 'Serin çok iyi gidiyor', textEn: null },
  { id: 'finish_together', tone: 'hype', text: 'Beraber bitireceğiz', textEn: null },
  { id: 'take_five', tone: 'hype', text: '5 dakikanı ayır, hallet', textEn: null },
  { id: 'proud_of_you', tone: 'hype', text: 'Seninle gurur duyuyorum', textEn: null },
  { id: 'diken_waiting', tone: 'hype', text: 'Diken seni bekliyor', textEn: null },
  { id: 'cactus_faster', tone: 'roast', text: 'Kaktüs bile senden hızlı büyüyor', textEn: null },
  { id: 'phone_in_hand', tone: 'roast', text: 'Telefon elinde, challenge nerede?', textEn: null },
  { id: 'diken_thirsty', tone: 'roast', text: 'Diken susuz kaldı, haberin olsun', textEn: null },
  { id: 'today_tomorrow', tone: 'roast', text: 'Bugün mü, yarın mı, seneye mi?', textEn: null },
  { id: 'streak_crying', tone: 'roast', text: 'Serin şu an ağlıyor', textEn: null },
  { id: 'i_did_it', tone: 'roast', text: 'Ben yaptım. Sen?', textEn: null },
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

/** Dürtme metni (Aktivite alıntı balonu); bilinmeyen (kaldırılmış) id için null */
export function pokeText(id: string, tone?: PokeTone): string | null {
  return POKE_MESSAGES.find((m) => m.id === id && (!tone || m.tone === tone))?.text ?? null;
}
