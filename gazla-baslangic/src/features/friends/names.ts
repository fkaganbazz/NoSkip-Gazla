/**
 * Türkçe isim ekleri (ünlü uyumu): "Ece'ye gönder", "Ece'yi dürt", "\"10 gün şekersiz\"i bitirdi".
 * Ad sunucudan geldiği gibi kalır; yalnızca kesme işaretinden sonraki ek hesaplanır.
 */
const VOWELS = 'aeıioöuüAEIİOÖUÜ';
const BACK = 'aıouAIOU';
const ROUNDED_FRONT = 'öüÖÜ';
const ROUNDED_BACK = 'ouOU';

function lastVowel(word: string) {
  for (let i = word.length - 1; i >= 0; i -= 1) {
    if (VOWELS.includes(word[i])) return word[i];
  }
  return 'e';
}

const endsWithVowel = (word: string) => VOWELS.includes(word.charAt(word.length - 1));

/** Yönelme eki: Ece → ye, Mert → e, Can → a */
export function dativeSuffix(word: string) {
  const v = BACK.includes(lastVowel(word)) ? 'a' : 'e';
  return endsWithVowel(word) ? `y${v}` : v;
}

/** Belirtme eki: Ece → yi, Mert → i, Can → ı, Selin → i, Okan → u */
export function accusativeSuffix(word: string) {
  const lv = lastVowel(word);
  const v = ROUNDED_BACK.includes(lv) ? 'u' : ROUNDED_FRONT.includes(lv) ? 'ü' : BACK.includes(lv) ? 'ı' : 'i';
  return endsWithVowel(word) ? `y${v}` : v;
}

/** "Ece'ye" */
export const toDative = (name: string) => `${name}'${dativeSuffix(name)}`;

/** "Ece'yi" */
export const toAccusative = (name: string) => `${name}'${accusativeSuffix(name)}`;
