import { Redirect, useLocalSearchParams } from 'expo-router';

// Davet linki (https://<alan-adi>/d/<kod>, src/config/links.ts inviteLink) uygulamada açılınca
// davet karşılama ekranına yönlendirir. Korumasız route: oturumsuz da açılır.
export default function InviteShortLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={{ pathname: '/invite/[code]', params: { code: code ?? '' } }} />;
}
