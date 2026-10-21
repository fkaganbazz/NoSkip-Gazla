/**
 * Web eşi: push yok, bildirime dokunma ve token yenilenmesi yok. Kanca aynı imzayla çağrılabilsin diye var
 * (expo-notifications web'de içe aktarılmaz).
 */
export type NotificationsBootstrapOptions = {
  canNavigate: boolean;
};

export function useNotificationsBootstrap(_options: NotificationsBootstrapOptions): void {}
