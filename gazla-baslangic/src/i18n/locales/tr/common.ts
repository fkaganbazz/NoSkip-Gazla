/**
 * Ortak metinler: birden çok ekranda geçen buton ve durum metinleri, marka, tarih adları.
 * Türkçe sözlük kaynaktır: `Messages` tipi buradan çıkar; İngilizce aynı biçimde olmak zorunda.
 * `as const` yazma (İngilizce karşılık aynı tipte olamaz); değişken metin fonksiyon olur.
 */
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const common = {
  appName: 'Gazla',
  mascot: 'Diken',

  // Butonlar
  close: 'Kapat',
  back: 'Geri',
  cancel: 'Vazgeç',
  continue: 'Devam',
  done: 'Tamam',
  save: 'Kaydet',
  saved: 'Kaydedildi',
  send: 'Gönder',
  share: 'Paylaş',
  copy: 'Kopyala',
  copied: 'Kopyalandı',
  delete: 'Sil',
  undo: 'Geri al',
  retry: 'Tekrar dene',
  accept: 'Kabul et',
  join: 'Katıl',
  options: 'Seçenekler',
  settings: 'Ayarlar',
  openSettings: 'Ayarları aç',
  skipForNow: 'Şimdilik atla',
  report: 'Şikayet et',
  block: 'Engelle',
  poke: 'Dürt',
  hype: 'Gaz ver',
  roast: 'Laf sok',

  // Durumlar
  loading: 'Yükleniyor',
  loadFailed: 'Şu an yüklenemedi. Bağlantını kontrol edip tekrar dene.',
  offline: 'İnternet bağlantısı yok. Bağlanınca tekrar dene.',
  somethingWentWrong: 'Bir şeyler ters gitti',

  // Sayılar
  days: (n: number) => `${n} gün`,
  dayN: (n: number) => `${n}. gün`,
  people: (n: number) => `${n} kişi`,

  // Tarih
  dates: {
    months: MONTHS,
    weekdays: WEEKDAYS,
    today: 'Bugün',
    yesterday: 'Dün',
    tomorrow: 'Yarın',
    /** "25 Ekim" */
    dayMonth: (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`,
    /** "Pazar, 25 Ekim" */
    weekdayDayMonth: (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`,
    /** "5 dk" */
    minutesShort: (n: number) => `${n} dk`,
    /** "3 sa" */
    hoursShort: (n: number) => `${n} sa`,
  },
};
