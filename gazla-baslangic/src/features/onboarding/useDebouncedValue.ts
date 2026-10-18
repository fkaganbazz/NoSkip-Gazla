import { useEffect, useState } from 'react';

/** Değer `delay` ms boyunca değişmezse güncellenir (kullanıcı adı kontrolü yazarken her harfte gitmesin) */
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
