import PlaceholderScreen from '@/components/PlaceholderScreen';

type Props = {
  /** Kullanıcının adı (selamlama) */
  name: string;
};

// Bugün'ün boş hali (aktif challenge yok) — design/EmptyToday.dc.html. Ekran grubunda uygulanacak.
export default function EmptyToday(_props: Props) {
  return <PlaceholderScreen title="Bugün" design="EmptyToday.dc.html" />;
}
