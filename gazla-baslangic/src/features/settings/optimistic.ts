/**
 * İyimser kayıt (EKRANLAR.md 5.2: "Toggle'lar iyimser kaydedilir"): yeni değer dokunur dokunmaz ekranda
 * görünür, istek arkada gider. Sunucu reddederse ekran sunucudaki değere döner ve hata bildirilir.
 * Aynı alana art arda dokunulursa yalnızca sonuncunun sonucu sayılır (eskisinin hatası tost çıkarmaz).
 * Başarıda bekleyen değer bırakılır; o anda sorgu verisi zaten günceldir (kanca yazmadan sonra önbelleği
 * günceller ya da yeniler, eylemin Promise'i bundan sonra çözülür).
 */
import { useRef, useState } from 'react';

export function useOptimisticPatch<T extends object>(
  save: (patch: Partial<T>) => Promise<unknown>,
  onError: (error: unknown) => void,
) {
  const [pending, setPending] = useState<Partial<T>>({});
  const seq = useRef(new Map<keyof T, number>());

  const apply = (patch: Partial<T>) => {
    const keys = Object.keys(patch) as (keyof T)[];
    const ids = keys.map((k) => {
      const id = (seq.current.get(k) ?? 0) + 1;
      seq.current.set(k, id);
      return id;
    });
    const isLatest = () => keys.every((k, i) => seq.current.get(k) === ids[i]);
    setPending((p) => ({ ...p, ...patch }));

    save(patch)
      .catch((error: unknown) => {
        if (isLatest()) onError(error);
      })
      .finally(() => {
        setPending((p) => {
          const next = { ...p };
          keys.forEach((k, i) => {
            if (seq.current.get(k) === ids[i]) delete next[k];
          });
          return next;
        });
      });
  };

  /** Sunucu verisi + bekleyen değerler (`T` güncelleme tipi, `B` okunan kayıt: ayarlar, profil) */
  const merge = <B extends object>(base: B): B => ({ ...base, ...pending });

  return { apply, merge };
}
