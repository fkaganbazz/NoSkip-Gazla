import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Sheet from '@/components/Sheet';
import {
  Button,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionLabel,
  Segmented,
  ToastHost,
  useToast,
} from '@/components/ui';
import {
  useAuth,
  useBlockedUsers,
  useMySettings,
  useSignOutMutation,
  useUpdateProfileMutation,
  useUpdateSettingsMutation,
  type SettingsUpdate,
} from '@/data';
import {
  DISCOVERABILITY_OPTIONS,
  LOCALE_OPTIONS,
  errorText,
  formatTime,
  labelOf,
} from '@/features/settings/logic';
import OptionSheet from '@/features/settings/OptionSheet';
import ProfileCard from '@/features/settings/ProfileCard';
import ProfileEditSheet from '@/features/settings/ProfileEditSheet';
import { LinkRow, SettingsGroup, ToggleRow } from '@/features/settings/rows';
import { THEME_OPTIONS, useThemePreference } from '@/features/settings/themePreference';
import { layout, typography, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

type OpenSheet = 'profile' | 'discoverability' | 'locale' | 'dayEnd' | null;

const LEGAL_ROWS = ['Yardım ve SSS', 'Bize yaz', 'KVKK Aydınlatma Metni', 'Gizlilik Politikası', 'Kullanım Koşulları'];

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

  const saveSettings = (update: SettingsUpdate) => updateSettings.mutate(update, { onError: (e) => flash(errorText(e)) });

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

  const s = settings.data;
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
            value={profile.harshMode}
            disabled={updateProfile.isPending}
            onChange={(harshMode) => updateProfile.mutate({ harshMode }, { onError: (e) => flash(errorText(e)) })}
          />
          <ToggleRow
            title="Dürtme bildirimleri"
            value={s.pokePushEnabled}
            disabled={updateSettings.isPending}
            onChange={(pokePushEnabled) => saveSettings({ pokePushEnabled })}
          />
          <LinkRow
            title="Günlük hatırlatma"
            value={formatTime(s.dailyReminderTime)}
            onPress={() => router.push('/settings/notifications')}
          />
          <LinkRow
            title="Gün bitişi"
            detail="Gece yarısından sonra 2 saat daha işaretleyebilirsin. Saat dilimine göre hesaplanır."
            value="+2 saat"
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
        {/* Tasarımda yok: dil seçimi (user_settings.locale) */}
        <SettingsGroup>
          <LinkRow title="Dil" value={labelOf(LOCALE_OPTIONS, s.locale)} onPress={() => setSheet('locale')} last />
        </SettingsGroup>

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
          <LinkRow title="Reklam tercihleri" onPress={() => router.push('/ad-consent')} last />
        </SettingsGroup>

        <SectionLabel style={styles.section}>DESTEK VE YASAL</SectionLabel>
        <SettingsGroup>
          {LEGAL_ROWS.map((title, i) => (
            <LinkRow
              key={title}
              title={title}
              compact
              // Bağlantılar henüz yok (backend/içerik boşluğu)
              onPress={() => flash('Bu sayfa yakında burada olacak.')}
              last={i === LEGAL_ROWS.length - 1}
            />
          ))}
        </SettingsGroup>

        <SettingsGroup style={styles.accountGroup}>
          <LinkRow
            title={signOut.isPending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
            chevron={false}
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
        onSelect={(discoverability) => saveSettings({ discoverability })}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'locale'}
        title="Dil"
        options={LOCALE_OPTIONS}
        value={s.locale}
        onSelect={(locale) => saveSettings({ locale })}
        onClose={() => setSheet(null)}
      />
      <Sheet visible={sheet === 'dayEnd'} onClose={() => setSheet(null)} title="Gün bitişi" surface>
        <Text style={[typography.body, { color: colors.textBody }]}>
          Gece yarısından sonra 2 saat daha işaretleyebilirsin. Saat dilimine göre hesaplanır.
        </Text>
        <Text style={[t.rowValue, styles.timezone, { color: colors.textSecondary }]}>Saat dilimin: {s.timezone}</Text>
        <Button title="Tamam" variant="secondary" onPress={() => setSheet(null)} style={styles.sheetButton} />
      </Sheet>

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
  timezone: {
    marginTop: m.groupMarginTop,
  },
  sheetButton: {
    marginTop: m.editFieldsMarginTop,
  },
});
