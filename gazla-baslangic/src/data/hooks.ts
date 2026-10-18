/**
 * Ekranların veri kancaları (TanStack Query). Okumalar `useX`, yazmalar `useXMutation`.
 * Her yazma, etkilediği okumaları yeniler; Bugün'deki işaretleme iyimser güncellenir
 * (dokunur dokunmaz değişir, hata olursa geri alınır).
 */
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { OAuthProvider } from './api';
import { api } from './client';
import type {
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  LocalDate,
  ProfileUpdate,
  ReportInput,
  SendPokeInput,
  SettingsUpdate,
  TodayTask,
} from './types';

export const queryKeys = {
  profile: ['me', 'profile'] as const,
  settings: ['me', 'settings'] as const,
  today: ['me', 'today'] as const,
  streak: ['me', 'streak'] as const,
  recentDays: (days: number) => ['me', 'recentDays', days] as const,
  pendingRescues: ['me', 'pendingRescues'] as const,
  garden: ['me', 'garden'] as const,
  templates: ['templates'] as const,
  templateStats: (id: string) => ['templates', id, 'stats'] as const,
  challenge: (id: string) => ['challenge', id] as const,
  membership: (id: string) => ['challenge', id, 'membership'] as const,
  board: (id: string) => ['challenge', id, 'board'] as const,
  calendar: (id: string) => ['challenge', id, 'calendar'] as const,
  invitePreview: (code: string) => ['invite', code] as const,
  friendsToday: ['friends', 'today'] as const,
  friendRequests: ['friends', 'requests'] as const,
  search: (q: string) => ['friends', 'search', q] as const,
  friendProfile: (id: string) => ['friends', 'profile', id] as const,
  pokeMessages: ['pokeMessages'] as const,
  activity: ['activity'] as const,
  blocked: ['blocked'] as const,
};

/** Bir yazmadan sonra yenilenecek ortak gruplar */
const DAILY: QueryKey[] = [['me'], ['challenge'], ['friends']];
const SOCIAL: QueryKey[] = [['friends'], ['activity'], ['blocked']];

function useWrite<TInput, TResult>(fn: (input: TInput) => Promise<TResult>, invalidate: QueryKey[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => Promise.all(invalidate.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

// Profil ve ayarlar ------------------------------------------------------------------------------

export const useMySettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: () => api.getMySettings() });

export const useUsernameAvailable = (username: string) =>
  useQuery({
    queryKey: ['usernameAvailable', username],
    queryFn: () => api.isUsernameAvailable(username),
    enabled: username.trim().length >= 3,
  });

export const useCompleteProfileMutation = () =>
  useWrite((input: CompleteProfileInput) => api.completeProfile(input), [['me']]);

export const useUpdateProfileMutation = () => useWrite((update: ProfileUpdate) => api.updateProfile(update), [['me'], ['friends']]);

export const useUpdateSettingsMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (update: SettingsUpdate) => api.updateSettings(update),
    onSuccess: (settings) => client.setQueryData(queryKeys.settings, settings),
  });
};

// Oturum -------------------------------------------------------------------------------------------

export const useSignInWithProviderMutation = () =>
  useMutation({ mutationFn: (provider: OAuthProvider) => api.signInWithProvider(provider) });

export const useSignInWithEmailMutation = () => useMutation({ mutationFn: (email: string) => api.signInWithEmail(email) });

export const useSignOutMutation = () => useMutation({ mutationFn: () => api.signOut() });

export const useDeleteAccountMutation = () => useMutation({ mutationFn: () => api.deleteAccount() });

// Bugün ve seri -------------------------------------------------------------------------------------

export const useToday = () => useQuery({ queryKey: queryKeys.today, queryFn: () => api.getToday() });

export const useStreak = () => useQuery({ queryKey: queryKeys.streak, queryFn: () => api.getStreak() });

export const useRecentDays = (days = 7) =>
  useQuery({ queryKey: queryKeys.recentDays(days), queryFn: () => api.getRecentDays(days) });

export const usePendingRescues = () =>
  useQuery({ queryKey: queryKeys.pendingRescues, queryFn: () => api.getPendingRescues() });

/** İşaretleme: Bugün listesinde hemen tamam görünür */
export function useCheckinMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckinInput) => api.checkin(input),
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey: queryKeys.today });
      const previous = client.getQueryData<TodayTask[]>(queryKeys.today);
      client.setQueryData<TodayTask[]>(queryKeys.today, (tasks) =>
        tasks?.map((t) =>
          t.challengeId === input.challengeId && (!input.localDate || t.localDate === input.localDate)
            ? { ...t, done: true, value: input.value ?? t.value, note: input.note ?? t.note, photoUrl: input.photoFileUri ?? t.photoUrl }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => client.setQueryData(queryKeys.today, context?.previous),
    onSettled: () => Promise.all(DAILY.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

/** İşaretlemeyi geri al (yalnızca açık günler) */
export function useUndoCheckinMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, localDate }: { challengeId: string; localDate?: LocalDate }) =>
      api.undoCheckin(challengeId, localDate),
    onMutate: async ({ challengeId, localDate }) => {
      await client.cancelQueries({ queryKey: queryKeys.today });
      const previous = client.getQueryData<TodayTask[]>(queryKeys.today);
      client.setQueryData<TodayTask[]>(queryKeys.today, (tasks) =>
        tasks?.map((t) =>
          t.challengeId === challengeId && (!localDate || t.localDate === localDate)
            ? { ...t, done: false, value: null, photoUrl: null, note: null }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) => client.setQueryData(queryKeys.today, context?.previous),
    onSettled: () => Promise.all(DAILY.map((queryKey) => client.invalidateQueries({ queryKey }))),
  });
}

export const useRescueWithFreeRightMutation = () =>
  useWrite(({ challengeId, missedDate }: { challengeId: string; missedDate: LocalDate }) =>
    api.rescueWithFreeRight(challengeId, missedDate), DAILY);

// Challenge ---------------------------------------------------------------------------------------

export const useTemplates = () => useQuery({ queryKey: queryKeys.templates, queryFn: () => api.getTemplates(), staleTime: 10 * 60_000 });

export const useTemplateStats = (templateId: string | undefined) =>
  useQuery({ queryKey: queryKeys.templateStats(templateId ?? ''), queryFn: () => api.getTemplateStats(templateId!), enabled: !!templateId });

export const useChallenge = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.challenge(id ?? ''), queryFn: () => api.getChallenge(id!), enabled: !!id });

export const useMyMembership = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.membership(id ?? ''), queryFn: () => api.getMyMembership(id!), enabled: !!id });

export const useChallengeBoard = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.board(id ?? ''), queryFn: () => api.getChallengeBoard(id!), enabled: !!id });

export const useChallengeCalendar = (id: string | undefined) =>
  useQuery({ queryKey: queryKeys.calendar(id ?? ''), queryFn: () => api.getChallengeCalendar(id!), enabled: !!id });

export const useInvitePreview = (code: string | undefined) =>
  useQuery({ queryKey: queryKeys.invitePreview(code ?? ''), queryFn: () => api.getInvitePreview(code!), enabled: !!code });

export const useGarden = () => useQuery({ queryKey: queryKeys.garden, queryFn: () => api.getGarden() });

export const useCreateChallengeMutation = () =>
  useWrite((input: CreateChallengeInput) => api.createChallenge(input), DAILY);

export const useInviteToChallengeMutation = () =>
  useWrite(({ challengeId, userIds }: { challengeId: string; userIds: string[] }) => api.inviteToChallenge(challengeId, userIds), [['challenge']]);

export const useRespondToInviteMutation = () =>
  useWrite(({ challengeId, accept }: { challengeId: string; accept: boolean }) => api.respondToInvite(challengeId, accept), [...DAILY, ['activity']]);

export const useLeaveChallengeMutation = () => useWrite((challengeId: string) => api.leaveChallenge(challengeId), DAILY);

export const useCreateInviteCodeMutation = () => useMutation({ mutationFn: (challengeId: string) => api.createInviteCode(challengeId) });

export const useJoinByInviteMutation = () => useWrite((code: string) => api.joinByInvite(code), [...DAILY, ['invite']]);

// Arkadaşlar ve sosyal --------------------------------------------------------------------------------

export const useFriendsToday = () => useQuery({ queryKey: queryKeys.friendsToday, queryFn: () => api.getFriendsToday() });

export const useFriendRequests = () => useQuery({ queryKey: queryKeys.friendRequests, queryFn: () => api.getFriendRequests() });

export const useSearchProfiles = (query: string) =>
  useQuery({
    queryKey: queryKeys.search(query.trim().toLowerCase()),
    queryFn: () => api.searchProfiles(query),
    enabled: query.trim().replace(/^@/, '').length >= 2,
  });

export const useFriendProfile = (userId: string | undefined) =>
  useQuery({ queryKey: queryKeys.friendProfile(userId ?? ''), queryFn: () => api.getFriendProfile(userId!), enabled: !!userId });

export const usePokeMessages = () =>
  useQuery({ queryKey: queryKeys.pokeMessages, queryFn: () => api.getPokeMessages(), staleTime: 60 * 60_000 });

export const useActivity = () => useQuery({ queryKey: queryKeys.activity, queryFn: () => api.getActivity() });

export const useBlockedUsers = () => useQuery({ queryKey: queryKeys.blocked, queryFn: () => api.getBlockedUsers() });

export const useSendFriendRequestMutation = () => useWrite((userId: string) => api.sendFriendRequest(userId), SOCIAL);

export const useAcceptFriendRequestMutation = () =>
  useWrite((friendshipId: string) => api.acceptFriendRequest(friendshipId), SOCIAL);

export const useRemoveFriendshipMutation = () => useWrite((userId: string) => api.removeFriendship(userId), SOCIAL);

export const useSendPokeMutation = () => useWrite((input: SendPokeInput) => api.sendPoke(input), [['friends']]);

export const useUndoPokeMutation = () => useWrite((pokeId: string) => api.undoPoke(pokeId), [['friends']]);

export const useMarkActivityReadMutation = () =>
  useWrite((ids: string[] | undefined) => api.markActivityRead(ids), [['activity']]);

export const useBlockUserMutation = () => useWrite((userId: string) => api.blockUser(userId), [...SOCIAL, ['challenge']]);

export const useUnblockUserMutation = () => useWrite((userId: string) => api.unblockUser(userId), SOCIAL);

export const useSubmitReportMutation = () => useWrite((input: ReportInput) => api.submitReport(input), SOCIAL);
