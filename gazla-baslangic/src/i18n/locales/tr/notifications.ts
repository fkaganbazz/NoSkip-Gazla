/** Bildirimler (src/notifications): Android bildirim kanallarının adları ve açıklamaları (telefon ayarlarında görünür) */
export const notifications = {
  channels: {
    default: {
      name: 'Genel',
      description: 'Gazla’dan gelen diğer bildirimler',
    },
    diken: {
      name: 'Diken',
      description: 'Gün bitmeden hatırlatmalar ve serin tehlikedeyken uyarılar (günde en çok 2)',
    },
    friends: {
      name: 'Arkadaşlar',
      description: 'Dürtmeler, gazlar, arkadaşlık istekleri ve challenge davetleri',
    },
  },
};
