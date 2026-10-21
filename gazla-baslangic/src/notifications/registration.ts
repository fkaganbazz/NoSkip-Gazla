/**
 * Bu açılışta push token'ı hangi hesap için kaydettik. Açılışta (ve uygulama öne gelince) token bir kez
 * tazelenir (`register_push_token` `last_seen_at`'i günceller); aynı oturumda tekrar istek atılmaz.
 * Token yenilenirse (`addPushTokenListener`) zorla yeniden kaydedilir.
 */
let registeredUserId: string | null = null;

export function markRegistered(userId: string) {
  registeredUserId = userId;
}

export function wasRegistered(userId: string) {
  return registeredUserId === userId;
}

/** Çıkışta: sonraki hesap için yeniden kaydedilsin */
export function resetRegistration() {
  registeredUserId = null;
}
