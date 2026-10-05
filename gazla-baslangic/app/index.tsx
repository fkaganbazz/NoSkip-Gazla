import { Redirect } from 'expo-router';

// Sekmeler (app/(tabs)/) gelene kadar geçici giriş: geliştirme ekranları.
export default function Index() {
  return <Redirect href="/dev" />;
}
