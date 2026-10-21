/**
 * Profili düzenle — Settings.dc.html profil kartı Profile.dc.html'e gider; alanlar oradan
 * (fotoğraf, ad, kullanıcı adı). Doğum yılı değiştirilemez (SettingsUpdate'te yok).
 */
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CameraIcon } from '@/components/icons';
import Sheet from '@/components/Sheet';
import { Avatar, Button, TextField } from '@/components/ui';
import { ApiError, useUpdateProfileMutation, useUsernameAvailable, type Profile, type ProfileUpdate } from '@/data';
import { typography, useTheme } from '@/theme';
import { settingsColors, settingsMetrics as m, settingsTypography as t } from '@/theme/settings';

import { displayNameProblem, errorText, normalizeUsername, usernameProblem } from './logic';

const DEBOUNCE_MS = 400;

type Props = {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onSaved: () => void;
};

export default function ProfileEditSheet({ visible, profile, onClose, onSaved }: Props) {
  const { colors, scheme } = useTheme();
  const c = settingsColors[scheme];
  const update = useUpdateProfileMutation();

  const [name, setName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  // undefined: değişmedi · string: yeni yerel dosya · null: kaldırıldı
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined);
  const [debounced, setDebounced] = useState(profile.username);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Her açılışta güncel profille başla
  useEffect(() => {
    if (!visible) return;
    setName(profile.displayName);
    setUsername(profile.username);
    setDebounced(profile.username);
    setAvatar(undefined);
    setSaveError(null);
  }, [visible, profile.displayName, profile.username]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(normalizeUsername(username)), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [username]);

  const normalized = normalizeUsername(username);
  const usernameChanged = normalized !== profile.username;
  const formatProblem = usernameChanged ? usernameProblem(username) : null;
  const availability = useUsernameAvailable(usernameChanged && !formatProblem ? debounced : '');
  const checking = usernameChanged && !formatProblem && (debounced !== normalized || availability.isFetching);
  const taken = usernameChanged && !formatProblem && !checking && availability.data === false;

  const nameProblem = displayNameProblem(name);
  const usernameError = formatProblem ?? (taken ? 'Bu kullanıcı adı alınmış' : null);
  const usernameHint = !usernameChanged
    ? null
    : checking
      ? 'Kontrol ediliyor…'
      : availability.data
        ? 'Bu kullanıcı adı boşta'
        : null;

  const changes: ProfileUpdate = {};
  if (name.trim() !== profile.displayName) changes.displayName = name.trim();
  if (usernameChanged) changes.username = normalized;
  if (avatar !== undefined) changes.avatarFileUri = avatar;
  const dirty = Object.keys(changes).length > 0;
  const canSave = dirty && !nameProblem && !usernameError && !checking;

  const photoUrl = avatar === undefined ? profile.avatarUrl : avatar;

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const save = () => {
    setSaveError(null);
    update.mutate(changes, {
      onSuccess: onSaved,
      onError: (e) => setSaveError(e instanceof ApiError && e.code === '23505' ? null : errorText(e)),
    });
  };

  const serverTaken = update.error instanceof ApiError && update.error.code === '23505';

  return (
    <Sheet visible={visible} onClose={onClose} title="Profili düzenle" surface scrollable>
      <View style={styles.photoRow}>
        <View style={styles.avatarWrap}>
          <Avatar
            name={name || profile.displayName}
            tint={profile.avatarTint}
            url={photoUrl}
            size={m.editAvatar}
            accessibilityLabel="Profil fotoğrafın"
          />
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Profil fotoğrafı seç"
            hitSlop={4}
            style={[styles.camera, { backgroundColor: c.cameraBg, borderColor: c.cameraRing }]}>
            <CameraIcon color={c.cameraIcon} size={m.cameraIconSize} strokeWidth={m.cameraIconStrokeWidth} />
          </Pressable>
        </View>
        <View style={styles.photoTexts}>
          <Text style={[t.rowTitle, { color: colors.text }]}>Profil fotoğrafı</Text>
          {photoUrl ? (
            <Pressable onPress={() => setAvatar(null)} accessibilityRole="button" hitSlop={10}>
              <Text style={[typography.caption, { color: colors.danger }]}>Fotoğrafı kaldır</Text>
            </Pressable>
          ) : (
            <Text style={[t.photoHint, { color: colors.textSecondary }]}>
              Arkadaşların seni daha kolay tanır.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.fields}>
        <TextField
          label="Adın"
          value={name}
          onChangeText={setName}
          maxLength={40}
          autoComplete="name"
          error={name !== profile.displayName ? nameProblem : null}
        />
        <TextField
          label="Kullanıcı adın"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={21}
          error={usernameError ?? (serverTaken ? 'Bu kullanıcı adı alınmış' : null)}
          hint={usernameHint}
        />
      </View>

      {saveError ? (
        <Text accessibilityLiveRegion="polite" style={[typography.meta, styles.error, { color: colors.danger }]}>
          {saveError}
        </Text>
      ) : null}

      <Button title="Kaydet" onPress={save} disabled={!canSave} loading={update.isPending} style={styles.save} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.editAvatarGap,
  },
  avatarWrap: {
    width: m.editAvatar,
    height: m.editAvatar,
  },
  camera: {
    position: 'absolute',
    right: m.cameraOffset,
    bottom: m.cameraOffset,
    width: m.cameraButton,
    height: m.cameraButton,
    borderRadius: m.cameraButton / 2,
    borderWidth: m.cameraBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTexts: {
    flex: 1,
    gap: m.rowTextGap,
  },
  fields: {
    marginTop: m.editFieldsMarginTop,
    gap: m.editFieldsGap,
  },
  error: {
    marginTop: m.editFieldsGap,
  },
  save: {
    marginTop: m.editFieldsMarginTop,
  },
});
