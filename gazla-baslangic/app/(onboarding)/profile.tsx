import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import OnboardingHeader from '@/components/OnboardingHeader';
import { Button, TextField } from '@/components/ui';
import { useAuth, useProfile, useSignOut, useUsernameCheck } from '@/data';
import AvatarPicker from '@/features/onboarding/AvatarPicker';
import BirthYearField from '@/features/onboarding/BirthYearField';
import { deviceTimezone, errorMessage, normalizeUsername } from '@/features/onboarding/logic';
import { useOnboarding } from '@/features/onboarding/OnboardingProvider';
import StepScreen, { StepIntro } from '@/features/onboarding/StepScreen';
import { useDebouncedValue } from '@/features/onboarding/useDebouncedValue';
import UsernameField, { type UsernameState } from '@/features/onboarding/UsernameField';
import { typography, useTheme } from '@/theme';
import { onboardingMetrics as m } from '@/theme/onboarding';

// Seni nasıl çağıralım? — design/Profile.dc.html (adım 2/4). Ad, kullanıcı adı (boşta mı, yazarken
// kontrol edilir), doğum yılı ve isteğe bağlı fotoğraf. Profil tamamlanınca (onboarding)/_layout sıradaki
// adıma geçirir: bekleyen davet varsa önce katılınır (OnboardingProvider) ve doğrudan bildirim iznine; yoksa
// seçilen şablonun challenge'ı davet adımında, "Kendim oluşturacağım" ise Create'te oluşturulur.
// 13 yaş altı kaydı sunucu reddeder; mesajı (nötr, yaş sınırını söylemez) olduğu gibi gösterilir.
export default function ProfileScreen() {
  const { colors } = useTheme();
  const { status } = useAuth();
  const { start } = useOnboarding();
  // create: profili tamamla, update: fotoğrafı yükle
  const { create, update } = useProfile();
  const signOut = useSignOut();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeUsername(username);
  const debounced = useDebouncedValue(normalized, m.usernameDebounceMs);
  const availability = useUsernameCheck(debounced);
  const usernameState: UsernameState =
    normalized.length === 0
      ? 'empty'
      : normalized.length < 3
        ? 'short'
        : debounced !== normalized || availability.isFetching
          ? 'checking'
          : availability.isError
            ? 'error'
            : availability.data === true
              ? 'available'
              : availability.data === false
                ? 'unavailable'
                : 'checking';

  // Kontrol hata verdiyse yine gönderilebilir; kararı sunucu verir
  const usernameOk = usernameState === 'available' || usernameState === 'error';
  const canSubmit = !!name.trim() && usernameOk && birthYear !== null;
  // Profil kaydedildi; bekleyen davet kontrol edilirken sıradaki adıma geçilmeyi bekler
  const finishing = status === 'ready';

  const submit = async () => {
    if (birthYear === null) return;
    setError(null);
    // Profil hazır olunca uygulama hemen açılmasın: davet ve bildirim adımları da görülsün
    start();
    try {
      await create({
        username: normalized,
        displayName: name.trim(),
        birthYear,
        timezone: deviceTimezone(),
        locale: 'tr',
      });
    } catch (e) {
      setError(errorMessage(e));
      return;
    }
    // Fotoğraf isteğe bağlı: yüklenemezse akış durmaz, sonra Ayarlar'dan eklenebilir
    if (avatarUri) update({ avatarFileUri: avatarUri });
  };

  return (
    <StepScreen
      footer={
        <>
          {error && (
            <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.error, { color: colors.dangerText }]}>
              {error}
            </Text>
          )}
          <Button
            title="Devam"
            onPress={submit}
            disabled={!canSubmit && !finishing}
            loading={create.isPending || finishing}
          />
        </>
      }>
      {/* Geri: hesabı değiştirmek için oturum kapanır, giriş ekranına dönülür */}
      <OnboardingHeader
        step={2}
        onBack={() => {
          if (!signOut.isPending && !finishing) signOut.mutate();
        }}
      />
      <StepIntro title="Seni nasıl çağıralım?" body="Arkadaşların seni kullanıcı adınla bulur." />

      <AvatarPicker name={name} uri={avatarUri} onChange={setAvatarUri} />

      <View style={styles.fields}>
        <TextField
          label="Adın"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
        />
        <UsernameField value={username} onChangeText={setUsername} state={usernameState} />
        <BirthYearField value={birthYear} onChange={setBirthYear} />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    marginTop: m.fieldsMarginTop,
    gap: m.fieldsGap,
  },
  error: {
    textAlign: 'center',
  },
});
