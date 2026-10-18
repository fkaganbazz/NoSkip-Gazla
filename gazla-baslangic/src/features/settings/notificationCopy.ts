/**
 * Bildirim kuralları ve metinleri — design/Notifications.dc.html. Metinleri sunucu gönderir;
 * burada kullanıcıya ne zaman ne geleceğini göstermek için birebir listelenir.
 */
export type RuleTone = 'strong' | 'lilac' | 'peach';

export const NOTIFICATION_RULES: { label: string; tone: RuleTone }[] = [
  { label: 'Diken günde en fazla 2 kez konuşur', tone: 'strong' },
  { label: 'Sessiz saatler 23:30–08:00', tone: 'lilac' },
  { label: 'Laf sokma sadece sert mod açıksa', tone: 'peach' },
];

export type CopyRow = { when: string; title: string; from: 'diken' | 'friend'; body: string };

export const NOTIFICATION_COPY: CopyRow[] = [
  { when: 'Günlük hatırlatma (seçilen saat)', title: 'Diken', from: 'diken', body: 'Su yok mu su? Bugünkü görevlerin seni bekliyor.' },
  { when: 'Gün bitimine 2 saat kala', title: 'Diken', from: 'diken', body: 'Gün bitiyor, 2 görevin duruyor. Susuz kaldım burada.' },
  { when: 'Arkadaşın gaz verdi', title: 'Selin sana gaz verdi', from: 'friend', body: '"Beraber bitireceğiz"' },
  { when: 'Arkadaşın laf soktu', title: 'Ece sana laf soktu', from: 'friend', body: '"Kaktüs bile senden hızlı büyüyor"' },
  { when: 'Arkadaşın challenge bitirdi', title: 'Mert bitirdi', from: 'friend', body: '10 gün şekersiz tamam. Tebrik etmek ister misin?' },
  { when: 'Seri koptu (ertesi sabah 09:00)', title: 'Diken', from: 'diken', body: 'Dün kaçtı. Beni sulamak için 24 saatin var.' },
  { when: 'Haftalık özet (Pazar 19:00)', title: 'Haftan', from: 'diken', body: "7 günün 5'ini tamamladın. Grupta 2. sıradasın." },
];
