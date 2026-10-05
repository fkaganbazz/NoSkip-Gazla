import { Redirect } from 'expo-router';

// Sekmeler (app/(tabs)/) gelene kadar geçici giriş: tema önizlemesi.
export default function Index() {
  return <Redirect href="/dev/tokens" />;
}
