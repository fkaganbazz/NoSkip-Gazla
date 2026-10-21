import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionLabel,
  Segmented,
  ToastHost,
  useToast,
} from '@/components/ui';
import { SUPPORT_EMAIL, legalLinks, supportMailto, type LegalLink } from '@/config/links';
import {
  useAuth,
  useBlockedUsers,
  useMySettings,
  useSignOutMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  type ProfileUpdate,
  type SettingsUpdate,
} from '@/data';
import {
  DAY_END_OPTIONS,
  DISCOVERABILITY_OPTIONS,
  dayEndDetail,
  errorText,
  formatTime,
  labelOf,
} from '@/features/settings/logic';
import OptionSheet from '@/features/settings/OptionSheet';
import { useOptimisticPatch } from '@/features/settings/optimistic';
import ProfileCard from '@/features/settings/ProfileCard';
import ProfileEditSheet from '@/features/settings/ProfileEditSheet';
import { LinkRow, SettingsGroup, ToggleRow } from '@/features/settings/rows';
import { THEME_OPTIONS, useThemePreference } from '@/features/settings/themePreference';
import { layout, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

type OpenSheet = 'profile' | 'discoverability' | 'dayEnd' | null;

/** DESTEK VE YASAL (Settings.dc.html sırası): web sayfaları uygulama içi tarayıcıda, "Bize yaz" e-postada */
const SUPPORT_ROWS: { title: string; page?: LegalLink }[] = [
  { title: 'Yardım ve SSS', page: 'help' },
  { title: 'Bize yaz' },
  { title: 'KVKK Aydınlatma Metni', page: 'kvkk' },
  { title: 'Gizlilik Politikası', page: 'privacy' },
  { title: 'Kullanım Koşulları', page: 'terms' },
];

// Ayarlar — design/Settings.dc.html. Profil useAuth'tan, ayarlar user_settings'ten (useMySettings).
export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const settings = useMySettings();
  const blocked = useBlockedUsers();
  const updateProfile = useUpdateProfileMutation();
  const updateSettings = useUpdateSettingsMutation();
  const signOut = useSignOutMutation();
  const [themePref, setThemePref] = useThemePreference();
  const toast = useToast();
  const flash = (message: string) => toast.show({ message });
  const [sheet, setSheet] = useState<OpenSheet>(null);

  // İyimser: anahtar ve seçim anında değişir; sunucu reddederse eski değere döner ve tost çıkar
  const onSaveError = (e: unknown) => flash(errorText(e));
  const settingsPatch = useOptimisticPatch<SettingsUpdate>((u) => updateSettings.mutateAsync(u), onSaveError);
  const profilePatch = useOptimisticPatch<ProfileUpdate>((u) => updateProfile.mutateAsync(u), onSaveError);

  const openPage = (page: LegalLink) =>
    WebBrowser.openBrowserAsync(legalLinks[page]).catch(() => flash('Sayfa açılamadı. Biraz sonra tekrar dene.'));
  const writeToUs = () =>
    Linking.openURL(supportMailto('Gazla destek')).catch(() =>
      flash(`E-posta uygulaması açılamadı. Bize ${SUPPORT_EMAIL} adresinden yazabilirsin.`),
    );

  const top = { paddingTop: insets.top + layout.screenTopGap };

  if (settings.isPending || !profile) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title="Ayarlar" />
        <LoadingState />
      </View>
    );
  }
  if (settings.isError) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title="Ayarlar" />
        <ErrorState onRetry={() => settings.refetch()} />
      </View>
    );
  }

  const s = settingsPatch.merge(settings.data);
  const me = profilePatch.merge(profile);
  const version = Constants.expoConfig?.version ?? '';
  const appName = Constants.expoConfig?.name ?? 'Gazla';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.padded,
          top,
          { paddingBottom: insets.bottom + m.screenPaddingBottom },
        ]}>
        <ScreenHeader title="Ayarlar" />

        <ProfileCard profile={profile} onPress={() => setSheet('profile')} />

        <SectionLabel style={styles.section}>CHALLENGE VE BİLDİRİMLER</SectionLabel>
        <SettingsGroup>
          <ToggleRow
            title="Sert mod"
            detail="Arkadaşların sana laf sokabilir. Kapalıyken sadece gaz verebilirler."
            value={me.harshMode}
            onChange={(harshMode) => profilePatch.apply({ harshMode })}
          />
          <ToggleRow
            title="Dürtme bildirimleri"
            value={s.pokePushEnabled}
            onChange={(pokePushEnabled) => settingsPatch.apply({ pokePushEnabled })}
          />
          <LinkRow
            title="Günlük hatırlatma"
            value={formatTime(s.dailyReminderTime)}
            onPress={() => router.push('/settings/notifications')}
          />
          <LinkRow
            title="Gün bitişi"
            detail={dayEndDetail(s.dayEndGraceHours)}
            value={labelOf(DAY_END_OPTIONS, s.dayEndGraceHours)}
            onPress={() => setSheet('dayEnd')}
            last
          />
        </SettingsGroup>

        <SectionLabel style={styles.section}>GÖRÜNÜM</SectionLabel>
        <Segmented
          options={THEME_OPTIONS}
          value={themePref}
          onChange={setThemePref}
          size="lg"
          role="radio"
          accessibilityLabel="Tema"
          style={styles.themePicker}
        />

        <SectionLabel style={styles.section}>GİZLİLİK VE GÜVENLİK</SectionLabel>
        <SettingsGroup>
          <LinkRow
            title="Beni kimler bulabilir"
            value={labelOf(DISCOVERABILITY_OPTIONS, s.discoverability)}
            onPress={() => setSheet('discoverability')}
          />
          <LinkRow
            title="Engellenen kullanıcılar"
            value={blocked.data ? String(blocked.data.length) : undefined}
            onPress={() => router.push('/settings/blocked')}
          />
          {/* UMP gizlilik seçenekleri formu kurulana kadar (Madde 3) reklam izni ön ekranı */}
          <LinkRow title="Reklam tercihleri" onPress={() => router.push('/ad-consent')} last />
        </SettingsGroup>

        <SectionLabel style={styles.section}>DESTEK VE YASAL</SectionLabel>
        <SettingsGroup>
          {SUPPORT_ROWS.map(({ title, page }, i) => (
            <LinkRow
              key={title}
              title={title}
              compact
              onPress={() => (page ? openPage(page) : writeToUs())}
              accessibilityRole="link"
              last={i === SUPPORT_ROWS.length - 1}
            />
          ))}
        </SettingsGroup>

        <SettingsGroup style={styles.accountGroup}>
          <LinkRow
            title={signOut.isPending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
            chevron={false}
            dividerInside
            disabled={signOut.isPending}
            // Başarıda oturum kapanır; kök düzen onboarding'e geçirir
            onPress={() => signOut.mutate(undefined, { onError: (e) => flash(errorText(e)) })}
          />
          <LinkRow
            title="Hesabı sil"
            titleColor={colors.dangerText}
            chevron={false}
            onPress={() => router.push('/settings/delete-account')}
            last
          />
        </SettingsGroup>

        <Text style={[t.footer, styles.footer, { color: colors.textSecondary }]}>
          {appName} {version} · Diken selam söylüyor
        </Text>
      </ScrollView>

      <ProfileEditSheet
        visible={sheet === 'profile'}
        profile={profile}
        onClose={() => setSheet(null)}
        onSaved={() => {
          setSheet(null);
          flash('Profilin güncellendi.');
        }}
      />
      <OptionSheet
        visible={sheet === 'discoverability'}
        title="Beni kimler bulabilir"
        options={DISCOVERABILITY_OPTIONS}
        value={s.discoverability}
        onSelect={(discoverability) => settingsPatch.apply({ discoverability })}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'dayEnd'}
        title="Gün bitişi"
        description={`Gece yarısından sonra dünkü görevlerini ne kadar süre daha işaretleyebileceğini seç. Saat dilimine göre hesaplanır: ${s.timezone}.`}
        options={DAY_END_OPTIONS}
        value={s.dayEndGraceHours}
        onSelect={(dayEndGraceHours) => settingsPatch.apply({ dayEndGraceHours })}
        onClose={() => setSheet(null)}
      />

      <ToastHost toast={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
  section: {
    marginTop: m.sectionMarginTop,
  },
  themePicker: {
    marginTop: m.groupMarginTop,
  },
  accountGroup: {
    marginTop: m.sectionMarginTop,
  },
  footer: {
    marginTop: m.footerMarginTop,
    textAlign: 'center',
  },
});
