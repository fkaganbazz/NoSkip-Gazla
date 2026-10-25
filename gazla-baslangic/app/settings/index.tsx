import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { openPrivacyOptions } from '@/ads';
import OptionSheet from '@/components/OptionSheet';
import {
  ErrorState,
  LoadingState,
  ScreenHeader,
  SectionLabel,
  Segmented,
  ToastHost,
  useToast,
} from '@/components/ui';
import { SUPPORT_EMAIL, legalLinkFor, supportMailto, type LegalLink } from '@/config/links';
import {
  useAuth,
  useBlock,
  useMySettings,
  useProfile,
  useSignOut,
  useUpdateSettings,
  type ProfileUpdate,
  type SettingsUpdate,
} from '@/data';
import {
  dayEndDetail,
  dayEndOptions,
  discoverabilityOptions,
  errorText,
  formatTime,
  labelOf,
} from '@/features/settings/logic';
import { useOptimisticPatch } from '@/features/settings/optimistic';
import ProfileCard from '@/features/settings/ProfileCard';
import ProfileEditSheet from '@/features/settings/ProfileEditSheet';
import { LinkRow, SettingsGroup, ToggleRow } from '@/features/settings/rows';
import { usePushPrompt } from '@/features/settings/usePushPrompt';
import { themeOptions, useThemePreference } from '@/features/settings/themePreference';
import { useLanguage, useLanguagePreference, useT, type LanguagePreference, type Messages } from '@/i18n';
import { layout, useTheme } from '@/theme';
import { settingsMetrics as m, settingsTypography as st } from '@/theme/settings';

type OpenSheet = 'profile' | 'discoverability' | 'dayEnd' | 'language' | null;

/** DESTEK VE YASAL (Settings.dc.html sırası): web sayfaları uygulama içi tarayıcıda, "Bize yaz" e-postada */
const supportRows = (t: Messages): { key: string; title: string; page?: LegalLink }[] => [
  { key: 'help', title: t.settings.index.help, page: 'help' },
  { key: 'write', title: t.settings.index.writeToUs },
  { key: 'kvkk', title: t.settings.index.kvkk, page: 'kvkk' },
  { key: 'privacy', title: t.settings.index.privacy, page: 'privacy' },
  { key: 'terms', title: t.settings.index.terms, page: 'terms' },
];

/** Dil adları her dilde kendi dilinde yazılır */
const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English' } as const;

const languageOptions = (t: Messages): { value: LanguagePreference; label: string; detail?: string }[] => [
  { value: 'system', label: t.settings.language.system, detail: t.settings.language.systemDetail },
  { value: 'tr', label: LANGUAGE_NAMES.tr },
  { value: 'en', label: LANGUAGE_NAMES.en },
];

// Ayarlar — design/Settings.dc.html. Profil useAuth'tan, ayarlar user_settings'ten (useMySettings).
export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const settings = useMySettings();
  const { blocked } = useBlock({ list: true });
  const { update: updateProfile } = useProfile();
  const { update: updateSettings } = useUpdateSettings();
  const signOut = useSignOut();
  const [themePref, setThemePref] = useThemePreference();
  const [languagePref, setLanguagePref] = useLanguagePreference();
  const language = useLanguage();
  const t = useT();
  const toast = useToast();
  const flash = (message: string) => toast.show({ message });
  const promptPush = usePushPrompt(toast);
  const [sheet, setSheet] = useState<OpenSheet>(null);

  // İyimser: anahtar ve seçim anında değişir; sunucu reddederse eski değere döner ve tost çıkar
  const onSaveError = (e: unknown) => flash(errorText(e, t));
  const settingsPatch = useOptimisticPatch<SettingsUpdate>((u) => updateSettings(u), onSaveError);
  const profilePatch = useOptimisticPatch<ProfileUpdate>((u) => updateProfile(u), onSaveError);

  const openPage = (page: LegalLink) =>
    WebBrowser.openBrowserAsync(legalLinkFor(page, language)).catch(() => flash(t.settings.index.pageOpenFailed));
  const writeToUs = () =>
    Linking.openURL(supportMailto(t.settings.index.supportSubject)).catch(() =>
      flash(t.settings.index.mailOpenFailed(SUPPORT_EMAIL)),
    );
  // Reklam tercihleri: UMP gizlilik seçenekleri formu (AB/İngiltere); bu kullanıcı için yoksa (ve web'de) ön ekran
  const [adPrefsBusy, setAdPrefsBusy] = useState(false);
  const openAdPreferences = async () => {
    setAdPrefsBusy(true);
    const result = await openPrivacyOptions().catch(() => 'failed' as const);
    setAdPrefsBusy(false);
    if (result === 'notRequired') router.push('/ad-consent');
    else if (result === 'failed') flash(t.settings.index.adPreferencesFailed);
  };

  const top = { paddingTop: insets.top + layout.screenTopGap };

  if (settings.isPending || !profile) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title={t.common.settings} />
        <LoadingState />
      </View>
    );
  }
  if (settings.isError) {
    return (
      <View style={[styles.screen, styles.padded, top]}>
        <ScreenHeader title={t.common.settings} />
        <ErrorState onRetry={() => settings.refetch()} />
      </View>
    );
  }

  const s = settingsPatch.merge(settings.data);
  const me = profilePatch.merge(profile);
  const version = Constants.expoConfig?.version ?? '';
  const ix = t.settings.index;
  const discoverability = discoverabilityOptions(t);
  const dayEnd = dayEndOptions(t);
  const languages = languageOptions(t);
  const support = supportRows(t);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.padded,
          top,
          { paddingBottom: insets.bottom + m.screenPaddingBottom },
        ]}>
        <ScreenHeader title={t.common.settings} />

        <ProfileCard profile={profile} onPress={() => setSheet('profile')} />

        <SectionLabel style={styles.section}>{ix.sections.challengeNotifications}</SectionLabel>
        <SettingsGroup>
          <ToggleRow
            title={ix.harshMode}
            detail={ix.harshModeDetail}
            value={me.harshMode}
            onChange={(harshMode) => profilePatch.apply({ harshMode })}
          />
          <ToggleRow
            title={ix.pokePush}
            value={s.pokePushEnabled}
            onChange={(pokePushEnabled) => {
              settingsPatch.apply({ pokePushEnabled });
              if (pokePushEnabled) promptPush();
            }}
          />
          <LinkRow
            title={ix.dailyReminder}
            value={formatTime(s.dailyReminderTime, t)}
            onPress={() => router.push('/settings/notifications')}
          />
          <LinkRow
            title={ix.dayEnd}
            detail={dayEndDetail(s.dayEndGraceHours, t)}
            value={labelOf(dayEnd, s.dayEndGraceHours)}
            onPress={() => setSheet('dayEnd')}
            last
          />
        </SettingsGroup>

        <SectionLabel style={styles.section}>{ix.sections.appearance}</SectionLabel>
        <Segmented
          options={themeOptions(t)}
          value={themePref}
          onChange={setThemePref}
          size="lg"
          role="radio"
          accessibilityLabel={ix.theme}
          style={styles.themePicker}
        />
        <SettingsGroup>
          <LinkRow
            title={ix.language}
            value={labelOf(languages, languagePref)}
            onPress={() => setSheet('language')}
            last
          />
        </SettingsGroup>

        <SectionLabel style={styles.section}>{ix.sections.privacy}</SectionLabel>
        <SettingsGroup>
          <LinkRow
            title={ix.discoverability}
            value={labelOf(discoverability, s.discoverability)}
            onPress={() => setSheet('discoverability')}
          />
          <LinkRow
            title={ix.blocked}
            value={blocked.data ? String(blocked.data.length) : undefined}
            onPress={() => router.push('/settings/blocked')}
          />
          <LinkRow title={ix.adPreferences} onPress={openAdPreferences} disabled={adPrefsBusy} last />
        </SettingsGroup>

        <SectionLabel style={styles.section}>{ix.sections.support}</SectionLabel>
        <SettingsGroup>
          {support.map(({ key, title, page }, i) => (
            <LinkRow
              key={key}
              title={title}
              compact
              onPress={() => (page ? openPage(page) : writeToUs())}
              accessibilityRole="link"
              last={i === support.length - 1}
            />
          ))}
        </SettingsGroup>

        <SettingsGroup style={styles.accountGroup}>
          <LinkRow
            title={signOut.isPending ? ix.signingOut : ix.signOut}
            chevron={false}
            dividerInside
            disabled={signOut.isPending}
            // Başarıda oturum kapanır; kök düzen onboarding'e geçirir
            onPress={() => signOut.mutate(undefined, { onError: (e) => flash(errorText(e, t)) })}
          />
          <LinkRow
            title={ix.deleteAccount}
            titleColor={colors.dangerText}
            chevron={false}
            onPress={() => router.push('/settings/delete-account')}
            last
          />
        </SettingsGroup>

        <Text style={[st.footer, styles.footer, { color: colors.textSecondary }]}>
          {ix.footer(t.common.appName, version)}
        </Text>
      </ScrollView>

      <ProfileEditSheet
        visible={sheet === 'profile'}
        profile={profile}
        onClose={() => setSheet(null)}
        onSaved={() => {
          setSheet(null);
          flash(ix.profileUpdated);
        }}
      />
      <OptionSheet
        visible={sheet === 'discoverability'}
        title={ix.discoverability}
        options={discoverability}
        value={s.discoverability}
        onSelect={(discoverability) => settingsPatch.apply({ discoverability })}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'dayEnd'}
        title={ix.dayEnd}
        description={ix.dayEndDescription(s.timezone)}
        options={dayEnd}
        value={s.dayEndGraceHours}
        onSelect={(dayEndGraceHours) => settingsPatch.apply({ dayEndGraceHours })}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'language'}
        title={ix.language}
        options={languages}
        value={languagePref}
        onSelect={setLanguagePref}
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
