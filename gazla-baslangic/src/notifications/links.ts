/**
 * Bildirime dokununca açılacak ekran: push verisindeki `url` (`data.url`). Sunucu uygulama içi yolu yazar
 * (`/challenge/<id>`, `/activity`, `/friend/<id>`, `/d/<kod>` …). Uygulamanın şemasıyla (`gazla://…`) ya da
 * web sitesinin adresiyle (`https://<alan>/…`) gelen adres de yola çevrilir. Başka hiçbir adres açılmaz
 * (bildirim dışarıya link açtıramaz).
 */

export type LinkOrigins = {
  /** Uygulama şemaları, ör. ['gazla'] */
  schemes: readonly string[];
  /** Uygulamanın açtığı web adresleri (evrensel link alan adları), ör. ['gazla.app'] */
  hosts: readonly string[];
};

const safePath = (path: string): string | null => {
  const value = path.startsWith('/') ? path : `/${path}`;
  // "//başka-alan" ya da "/\…" gibi protokolsüz dış adresler ve boşluklar yok
  if (value.startsWith('//') || value.includes('\\') || /\s/.test(value)) return null;
  return value;
};

/** `data.url` → uygulama içi yol; açılmayacaksa null */
export function notificationPath(data: unknown, origins: LinkOrigins): string | null {
  if (!data || typeof data !== 'object') return null;
  const raw = (data as { url?: unknown }).url;
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;

  if (url.startsWith('/')) return safePath(url);

  const scheme = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(url);
  if (!scheme) return null;
  const [, protocol, rest] = scheme;
  const name = protocol.toLowerCase();

  if (origins.schemes.some((s) => s.toLowerCase() === name)) {
    // gazla://challenge/1 ya da gazla:///challenge/1
    return safePath(rest.replace(/^\/+/, ''));
  }
  if (name === 'https') {
    const slash = rest.indexOf('/');
    const host = (slash === -1 ? rest : rest.slice(0, slash)).toLowerCase();
    if (!origins.hosts.some((h) => h.toLowerCase() === host)) return null;
    return safePath(slash === -1 ? '/' : rest.slice(slash));
  }
  return null;
}
