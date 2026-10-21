/**
 * Bellekte çalışan örnek API. Supabase bağlanmadan tüm ekranlar gerçek akışla denensin diye
 * RPC'lerin iş kurallarının sade bir kopyasını uygular (sınırlar, sert mod, engel, geri alma,
 * gün bitişi toleransı, "Arkadaşlarım" görünürlüğü, kurtarmadan vazgeçme…).
 * Seri motorunun tamamı burada yok: genel seri sabit taban + bugün tamamsa 1. Rozet kuralları da
 * yok: kazanılanlar tasarımdaki gibi sabit (seedEarnedBadges).
 */
import { ApiError, type GazlaApi, type OAuthProvider } from '../api';
import { clearAllFlags } from '../flags';
import { clearPendingInvite } from '../pendingInvite';
import type {
  ActivityItem,
  ActivityPage,
  Badge,
  BadgeKey,
  BlockedUser,
  BoardMember,
  Challenge,
  ChallengeCalendar,
  ChallengeMembership,
  ChallengeStatus,
  Checkin,
  CheckinInput,
  CompleteProfileInput,
  CreateChallengeInput,
  DikenStage,
  FinishedChallenge,
  FriendProfile,
  FriendRequest,
  FriendToday,
  GardenItem,
  InvitePreview,
  JoinableChallenge,
  LocalDate,
  NumberStats,
  PendingRescue,
  PersonLite,
  Poke,
  PokeMessage,
  PokeStatus,
  Profile,
  ProfileUpdate,
  RecentDay,
  ReportInput,
  SearchResult,
  SendPokeInput,
  Session,
  SettingsUpdate,
  StreakRescue,
  StreakSummary,
  Template,
  TemplateStats,
  TodayTask,
  UserSettings,
} from '../types';
import {
  ME_ID,
  addDays,
  localDate,
  minutesAgo,
  seedActivity,
  seedBadges,
  seedChallenges,
  seedEarnedBadges,
  seedFriendIds,
  seedFriendRequests,
  seedGarden,
  seedHistory,
  seedInviteCodes,
  seedLongestStreak,
  seedMembers,
  seedOtherFriendships,
  seedPersonalReminders,
  seedPokeMessages,
  seedProfiles,
  seedSettings,
  seedStreakBase,
  seedTemplateActive,
  seedTemplates,
  type SeedChallenge,
} from './seed';

const LATENCY_MS = 120;
const POKE_DAILY_LIMIT = 3;
const POKE_UNDO_MS = 30_000;
const MAX_MEMBERS = 20;
const ACTIVITY_PAGE_SIZE = 30;
const RESERVED = ['diken', 'gazla', 'noskip', 'admin', 'destek', 'support', 'yardim', 'moderator'];
/** Yaş sınırı ekranda ve hata metninde söylenmez (sunucuyla aynı nötr metin) */
const AGE_REJECTED = 'Şu an hesabını oluşturamıyoruz.';

const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function stageFor(streak: number): DikenStage {
  if (streak >= 30) return 'cicek';
  if (streak >= 10) return 'tam';
  if (streak >= 7) return 'genc';
  return 'filiz';
}

const daysBetween = (from: LocalDate, to: LocalDate) => {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
};

/** Saklanan üyelik: etkin hatırlatma saati okunurken hesaplanır */
type Member = Omit<ChallengeMembership, 'reminderTime'> & { joinedAt: string };
type Friendship = { id: string; requesterId: string; addresseeId: string; status: 'pending' | 'accepted'; createdAt: string };

const newMember = (m: Pick<Member, 'challengeId' | 'userId'> & Partial<Member>): Member => ({
  role: 'member',
  status: 'active',
  invitedBy: null,
  joinedOn: null,
  joinedAt: '',
  leftOn: null,
  finishedAt: null,
  finalDaysDone: null,
  finalRequiredDays: null,
  finalRescues: null,
  finalRank: null,
  personalReminderTime: null,
  finishSeenAt: null,
  ...m,
});

/** Aktivite imleci: zaman + id (aynı anda oluşan satırlar da sırayla gelsin) */
const cursorOf = (a: ActivityItem) => `${a.createdAt}|${a.id}`;
const isOlderThan = (a: ActivityItem, cursor: string) => {
  const [at, id] = cursor.split('|');
  return a.createdAt < at || (a.createdAt === at && a.id < id);
};

class MockStore {
  signedIn = true;
  profileCompleted = true;
  profiles = new Map<string, Profile>();
  settings: UserSettings = clone(seedSettings);
  challenges = new Map<string, SeedChallenge>();
  members: Member[] = [];
  checkins = new Map<string, Checkin>();
  rescues: (StreakRescue & { userId: string })[] = [];
  friendships: Friendship[] = [];
  blocks: { blockerId: string; blockedId: string; createdAt: string }[] = [];
  pokes: Poke[] = [];
  activity: ActivityItem[] = [];
  garden: GardenItem[] = clone(seedGarden);
  inviteCodes = clone(seedInviteCodes);
  pendingRescues: PendingRescue[] = [];
  rescueDeclines: { challengeId: string; missedDate: LocalDate }[] = [];
  freeRescueUsedMonth: string | null = null;
  reports: ReportInput[] = [];
  earnedBadges = new Map<BadgeKey, string>(seedEarnedBadges.map((b) => [b.key, b.earnedAt]));

  constructor() {
    const today = localDate();
    seedProfiles.forEach((p) => this.profiles.set(p.id, clone(p)));
    seedChallenges.forEach((c) => this.challenges.set(c.id, clone(c)));
    for (const m of seedMembers) {
      const c = this.challenges.get(m.challengeId)!;
      const joinedOn = c.startDate <= today ? c.startDate : today;
      this.members.push(
        newMember({
          challengeId: m.challengeId,
          userId: m.userId,
          role: m.role,
          joinedOn,
          joinedAt: `${joinedOn}T08:00:00.000Z`,
          personalReminderTime:
            seedPersonalReminders.find((r) => r.challengeId === m.challengeId && r.userId === m.userId)?.time ?? null,
        }),
      );
    }
    this.seedHistoryOf(() => true);
    seedFriendIds.forEach((id, i) =>
      this.friendships.push({ id: `f-${id}`, requesterId: i % 2 ? ME_ID : id, addresseeId: i % 2 ? id : ME_ID, status: 'accepted', createdAt: minutesAgo(60 * 24 * 60) }),
    );
    seedOtherFriendships.forEach(([a, b]) =>
      this.friendships.push({ id: `f-${a}-${b}`, requesterId: a, addresseeId: b, status: 'accepted', createdAt: minutesAgo(60 * 24 * 90) }),
    );
    seedFriendRequests.forEach((r) =>
      this.friendships.push({ id: r.id, requesterId: r.fromId, addresseeId: r.toId, status: 'pending', createdAt: r.createdAt }),
    );
    this.activity = seedActivity((id) => this.lite(id));
  }

  /** Geçmiş işaretlemeleri challenge'ın bugünkü başlangıcına göre yazar (son gün dahil, bittiyse) */
  seedHistoryOf(filter: (h: (typeof seedHistory)[number]) => boolean) {
    const today = localDate();
    for (const h of seedHistory.filter(filter)) {
      const c = this.challenges.get(h.challengeId)!;
      const elapsed = daysBetween(c.startDate, today) + 1;
      const lastPast = Math.min(elapsed - 1, c.durationDays);
      for (let day = 1; day <= lastPast; day++) {
        const date = addDays(c.startDate, day - 1);
        // Bitmiş challenge'ın son günü "bugün" yerine geçer (doneToday)
        const isLastOfEnded = elapsed > c.durationDays && day === c.durationDays;
        if (h.rescuedDays?.includes(day)) {
          this.rescues.push({ challengeId: c.id, userId: h.userId, rescuedDate: date, method: 'ad' });
        } else if (isLastOfEnded ? h.doneToday : !h.missedDays.includes(day)) {
          this.putCheckin(h.userId, c.id, date, h.values?.[day] ?? (c.taskType === 'number' ? 60 : null), null, null);
        }
      }
      if (h.doneToday && elapsed >= 1 && elapsed <= c.durationDays) {
        this.putCheckin(h.userId, c.id, today, c.taskType === 'number' ? (h.todayValue ?? 70) : null, null, null);
      }
    }
  }

  key = (userId: string, challengeId: string, date: LocalDate) => `${challengeId}|${userId}|${date}`;

  putCheckin(userId: string, challengeId: string, date: LocalDate, value: number | null, photoUrl: string | null, note: string | null) {
    const id = this.key(userId, challengeId, date);
    const row: Checkin = { id, challengeId, userId, localDate: date, value, photoUrl, note, createdAt: new Date().toISOString() };
    this.checkins.set(id, row);
    return row;
  }

  lite(id: string): PersonLite {
    const p = this.profiles.get(id)!;
    return { id: p.id, displayName: p.displayName, username: p.username, avatarUrl: p.avatarUrl, avatarTint: p.avatarTint };
  }

  isBlocked(a: string, b: string) {
    return this.blocks.some((x) => (x.blockerId === a && x.blockedId === b) || (x.blockerId === b && x.blockedId === a));
  }

  friendship(a: string, b: string) {
    return this.friendships.find((f) => (f.requesterId === a && f.addresseeId === b) || (f.requesterId === b && f.addresseeId === a));
  }

  areFriends(a: string, b: string) {
    return this.friendship(a, b)?.status === 'accepted';
  }

  friendsOf(a: string) {
    return this.friendships
      .filter((f) => f.status === 'accepted' && (f.requesterId === a || f.addresseeId === a))
      .map((f) => (f.requesterId === a ? f.addresseeId : f.requesterId));
  }

  /** app.mutual_friend_count */
  mutualCount(a: string, b: string) {
    const fb = new Set(this.friendsOf(b));
    return this.friendsOf(a).filter((x) => x !== a && x !== b && fb.has(x)).length;
  }

  activeMembers(challengeId: string) {
    return this.members.filter((m) => m.challengeId === challengeId && m.status === 'active');
  }

  membership(challengeId: string, userId: string) {
    return this.members.find((m) => m.challengeId === challengeId && m.userId === userId);
  }

  coMembers(a: string, b: string) {
    return this.members.some(
      (m) => m.userId === a && m.status === 'active' && this.membership(m.challengeId, b)?.status === 'active',
    );
  }

  covered(userId: string, challengeId: string, date: LocalDate) {
    return (
      this.checkins.has(this.key(userId, challengeId, date)) ||
      this.rescues.some((r) => r.userId === userId && r.challengeId === challengeId && r.rescuedDate === date)
    );
  }

  /** Gün numarası (sınırsız; TodayTask) */
  dayIndex(c: SeedChallenge, date: LocalDate = localDate()) {
    return daysBetween(c.startDate, date) + 1;
  }

  /**
   * app.open_dates: bugün ve gün bitişi toleransı içindeyse dün (Ayarlar 0/1/2 saat). Cihazın yerel
   * gece yarısına göre (mock'ta saat dilimi cihazınki).
   */
  openDates(): LocalDate[] {
    const today = localDate();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const graceOpen = Date.now() < midnight.getTime() + this.settings.dayEndGraceHours * 3_600_000;
    return graceOpen ? [today, addDays(today, -1)] : [today];
  }

  /** app.challenge_status */
  statusOf(c: SeedChallenge, userId: string): ChallengeStatus {
    if (this.membership(c.id, userId)?.finishedAt) return 'finished';
    if (c.startDate > localDate()) return 'upcoming';
    const open = this.openDates();
    return c.endDate < open[open.length - 1] ? 'finished' : 'active';
  }

  /** challenge_detail: satır + izleyiciye göre durum, gün no (0 = başlamadı, en çok süre), üye sayısı */
  view(c: SeedChallenge, userId: string): Challenge {
    return {
      ...clone(c),
      status: this.statusOf(c, userId),
      dayIndex: Math.max(Math.min(this.dayIndex(c), c.durationDays), 0),
      memberCount: this.activeMembers(c.id).length,
    };
  }

  /** my_membership: etkin hatırlatma saati = kişisel, yoksa grubun */
  membershipView(m: Member): ChallengeMembership {
    const { joinedAt: _joinedAt, ...rest } = m;
    return clone({ ...rest, reminderTime: m.personalReminderTime ?? this.challenges.get(m.challengeId)?.reminderTime ?? null });
  }

  /** Bugün sürüyor ve kullanıcı aktif üye olduğu challenge'lar */
  runningFor(userId: string, date: LocalDate = localDate()) {
    return this.members
      .filter((m) => m.userId === userId && m.status === 'active' && (!m.joinedOn || m.joinedOn <= date))
      .map((m) => this.challenges.get(m.challengeId)!)
      .filter((c) => c.startDate <= date && date <= c.endDate);
  }

  doneTodayAll(userId: string) {
    const today = localDate();
    const running = this.runningFor(userId);
    if (running.length === 0) return null;
    return running.every((c) => this.covered(userId, c.id, today));
  }

  streakOf(userId: string) {
    return (seedStreakBase[userId] ?? 0) + (this.doneTodayAll(userId) ? 1 : 0);
  }

  challengeStreak(userId: string, c: SeedChallenge) {
    const today = localDate();
    let date = this.covered(userId, c.id, today) ? today : addDays(today, -1);
    let run = 0;
    while (date >= c.startDate && this.covered(userId, c.id, date)) {
      run += 1;
      date = addDays(date, -1);
    }
    return run;
  }

  daysDone(userId: string, c: SeedChallenge) {
    let n = 0;
    for (let d = c.startDate; d <= localDate() && d <= c.endDate; d = addDays(d, 1)) {
      if (this.covered(userId, c.id, d)) n += 1;
    }
    return n;
  }

  /** friend_profile.joinable_challenges: arkadaşın "Arkadaşlarım" challenge'ları (yalnızca arkadaşa) */
  joinableFor(viewer: string, friend: string): JoinableChallenge[] {
    if (!this.areFriends(viewer, friend)) return [];
    const today = localDate();
    return [...this.challenges.values()]
      .filter(
        (c) =>
          c.createdBy === friend &&
          c.visibility === 'friends' &&
          this.membership(c.id, friend)?.status === 'active' &&
          c.endDate >= today &&
          this.activeMembers(c.id).length < MAX_MEMBERS &&
          !['active', 'left'].includes(this.membership(c.id, viewer)?.status ?? ''),
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((c) => ({
        challengeId: c.id,
        title: c.title,
        shortTitle: c.shortTitle,
        icon: c.icon,
        tint: c.tint,
        taskType: c.taskType,
        durationDays: c.durationDays,
        startDate: c.startDate,
        endDate: c.endDate,
        dayIndex: Math.max(Math.min(this.dayIndex(c), c.durationDays), 0),
        memberCount: this.activeMembers(c.id).length,
      }));
  }

  visibleActivity(uid: string) {
    return this.activity
      .filter((a) => !a.actor || !this.isBlocked(uid, a.actor.id))
      .sort((a, b) => (a.createdAt === b.createdAt ? b.id.localeCompare(a.id) : b.createdAt.localeCompare(a.createdAt)));
  }
}

let store = new MockStore();
const sessionListeners = new Set<(s: Session | null) => void>();
const notifySession = () => {
  const s = store.signedIn ? { userId: ME_ID, email: 'deniz@example.com' } : null;
  sessionListeners.forEach((l) => l(s));
};

const me = () => {
  if (!store.signedIn) throw new ApiError('Oturum açman gerekiyor', '42501');
  if (!store.profileCompleted) throw new ApiError('Önce profilini tamamla', 'P0001');
  return ME_ID;
};

const challengeOrThrow = (id: string) => {
  const c = store.challenges.get(id);
  if (!c) throw new ApiError('Challenge bulunamadı', 'P0002');
  return c;
};

/** Keşfet popülerlik sırası: yapan sayısı, sonra onboarding sırası, sonra slug (template_popularity) */
function templatesWithPopularity(): Template[] {
  const active = (id: string) => seedTemplateActive[id] ?? 0;
  const ranked = [...seedTemplates].sort(
    (a, b) =>
      active(b.id) - active(a.id) ||
      (a.onboardingOrder ?? Number.MAX_SAFE_INTEGER) - (b.onboardingOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.slug.localeCompare(b.slug),
  );
  return seedTemplates.map((t) => ({ ...clone(t), activeCount: active(t.id), popularity: ranked.indexOf(t) + 1 }));
}

/** Geliştirme menüsü için senaryo düğmeleri */
export const mockDev = {
  /** Dünü kaçırmış gibi: plank için bekleyen kurtarma */
  simulateStreakLost() {
    const today = localDate();
    store.pendingRescues = [
      {
        challengeId: 'c-plank',
        title: 'Plank: her gün +5 saniye',
        missedDate: addDays(today, -1),
        streakBefore: 12,
        expiresAt: new Date(Date.now() + (21 * 60 + 40) * 60000).toISOString(),
        freeRescueAvailable: store.freeRescueUsedMonth !== today.slice(0, 7),
      },
    ];
  },
  /**
   * "Challenge bitti" senaryosu: c-phone dün bitmiş, sonuçlar bugün kaydedilmiş gibi (Deniz 30/30,
   * 1 kurtarma, 1. sıra). Bugün açılışında `useUnseenFinished` onu bir kez döndürür.
   */
  simulateFinished() {
    const today = localDate();
    const c = store.challenges.get('c-phone')!;
    c.startDate = addDays(today, -c.durationDays);
    c.endDate = addDays(c.startDate, c.durationDays - 1);
    for (const k of [...store.checkins.keys()]) if (k.startsWith(`${c.id}|`)) store.checkins.delete(k);
    store.rescues = store.rescues.filter((r) => r.challengeId !== c.id);
    const members = store.activeMembers(c.id);
    members.forEach((m) => {
      m.joinedOn = c.startDate;
      m.joinedAt = `${c.startDate}T08:00:00.000Z`;
    });
    store.seedHistoryOf((h) => h.challengeId === c.id);
    const finishedAt = new Date().toISOString();
    members
      .map((m, order) => ({ m, order, days: store.daysDone(m.userId, c) }))
      .sort((a, b) => b.days - a.days || a.order - b.order)
      .forEach(({ m, days }, i) => {
        m.finishedAt = finishedAt;
        m.finalDaysDone = days;
        m.finalRequiredDays = c.durationDays;
        m.finalRescues = store.rescues.filter((r) => r.challengeId === c.id && r.userId === m.userId).length;
        m.finalRank = i + 1;
        m.finishSeenAt = null;
      });
    const mine = store.membership(c.id, ME_ID)!;
    if (!store.garden.some((g) => g.challengeId === c.id) && (mine.finalDaysDone ?? 0) >= (mine.finalRequiredDays ?? 0)) {
      store.garden.push({
        challengeId: c.id,
        title: c.title,
        shortTitle: c.shortTitle,
        durationDays: c.durationDays,
        requiredDays: mine.finalRequiredDays!,
        stage: stageFor(mine.finalRequiredDays!),
        finishedAt,
        finalRescues: mine.finalRescues!,
        finalRank: mine.finalRank!,
      });
    }
  },
  /** Örnek veriyi baştan kur (cihazdaki tek seferlik bayraklar ve bekleyen davet kodu da silinir) */
  reset() {
    store = new MockStore();
    void clearAllFlags();
    void clearPendingInvite();
    notifySession();
  },
};

export const mockApi: GazlaApi = {
  kind: 'mock',

  // Oturum ------------------------------------------------------------------------------------
  async getSession() {
    return store.signedIn ? { userId: ME_ID, email: 'deniz@example.com' } : null;
  },
  onSessionChange(listener) {
    sessionListeners.add(listener);
    return () => sessionListeners.delete(listener);
  },
  async signInWithProvider(_provider: OAuthProvider) {
    await wait();
    store.signedIn = true;
    notifySession();
  },
  async signInWithEmail(email) {
    await wait();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      throw new ApiError('Geçerli bir e-posta yaz', '22023');
    }
    // Gerçekte bağlantı e-postayla gelir; örnekte hemen oturum açılır.
    store.signedIn = true;
    notifySession();
  },
  async signOut() {
    await wait();
    store.signedIn = false;
    // Onboarding akışı baştan denensin diye profil adımı da sıfırlanır.
    store.profileCompleted = false;
    notifySession();
  },
  async deleteAccount() {
    await wait();
    store = new MockStore();
    store.signedIn = false;
    store.profileCompleted = false;
    notifySession();
  },

  // Profil ve ayarlar ---------------------------------------------------------------------------
  async getMyProfile() {
    await wait();
    if (!store.signedIn || !store.profileCompleted) return null;
    return clone(store.profiles.get(ME_ID)!);
  },
  async isUsernameAvailable(username) {
    await wait();
    const name = username.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/.test(name) || RESERVED.includes(name)) return false;
    return ![...store.profiles.values()].some((p) => p.username === name && p.id !== ME_ID);
  },
  async completeProfile(input: CompleteProfileInput) {
    await wait();
    if (!store.signedIn) throw new ApiError('Oturum açman gerekiyor', '42501');
    if (input.birthYear > new Date().getFullYear() - 13) throw new ApiError(AGE_REJECTED, '23514');
    if (!(await mockApi.isUsernameAvailable(input.username))) throw new ApiError('Bu kullanıcı adı alınmış', '23505');
    const p = store.profiles.get(ME_ID)!;
    p.username = input.username.trim().replace(/^@/, '').toLowerCase();
    p.displayName = input.displayName.trim();
    store.settings.birthYear = input.birthYear;
    store.settings.timezone = input.timezone;
    if (input.locale) store.settings.locale = input.locale;
    store.profileCompleted = true;
    notifySession();
    return clone(p);
  },
  async updateProfile(update: ProfileUpdate) {
    await wait();
    const p = store.profiles.get(me())!;
    if (update.username !== undefined && update.username !== p.username) {
      if (!(await mockApi.isUsernameAvailable(update.username))) throw new ApiError('Bu kullanıcı adı alınmış', '23505');
      p.username = update.username.trim().toLowerCase();
    }
    if (update.displayName !== undefined) p.displayName = update.displayName.trim();
    if (update.avatarTint !== undefined) p.avatarTint = update.avatarTint;
    if (update.harshMode !== undefined) p.harshMode = update.harshMode;
    if (update.avatarFileUri !== undefined) p.avatarUrl = update.avatarFileUri;
    return clone(p);
  },
  async getMySettings() {
    await wait();
    me();
    return clone(store.settings);
  },
  async updateSettings(update: SettingsUpdate) {
    await wait();
    me();
    if (update.dayEndGraceHours !== undefined && ![0, 1, 2].includes(update.dayEndGraceHours)) {
      throw new ApiError('Tolerans 0, 1 ya da 2 saat olabilir', '23514');
    }
    Object.assign(store.settings, update);
    return clone(store.settings);
  },
  async registerPushToken() {
    await wait();
  },

  // Bugün ve seri -------------------------------------------------------------------------------
  async getToday() {
    await wait();
    const uid = me();
    // İşaretlenebilen her gün için satır: bugün, toleranstaysa dün de (sunucudaki my_today gibi)
    return store.openDates().flatMap((date) =>
      store.runningFor(uid, date).map((c): TodayTask => {
        const dayIndex = store.dayIndex(c, date);
        const row = store.checkins.get(store.key(uid, c.id, date));
        const n = c.number;
        return {
          challengeId: c.id,
          title: c.title,
          shortTitle: c.shortTitle,
          taskType: c.taskType,
          icon: c.icon,
          tint: c.tint,
          localDate: date,
          dayIndex,
          durationDays: c.durationDays,
          done: store.covered(uid, c.id, date),
          value: row?.value ?? null,
          photoUrl: row?.photoUrl ?? null,
          note: row?.note ?? null,
          target: n ? Math.min(n.baseTarget + (dayIndex - 1) * n.dailyIncrement, n.max ?? Infinity) : null,
          numberUnit: n?.unit ?? null,
          memberCount: store.activeMembers(c.id).length,
        };
      }),
    );
  },
  async getStreak(): Promise<StreakSummary> {
    await wait();
    const uid = me();
    const today = localDate();
    const running = store.runningFor(uid);
    const current = store.streakOf(uid);
    return {
      currentStreak: current,
      longestStreak: Math.max(seedLongestStreak, current),
      stage: stageFor(current),
      wilted: store.pendingRescues.length > 0,
      doneToday: running.filter((c) => store.covered(uid, c.id, today)).length,
      totalToday: running.length,
      freeRescueAvailable: store.freeRescueUsedMonth !== today.slice(0, 7),
    };
  },
  async getRecentDays(days = 7) {
    await wait();
    const uid = me();
    const today = localDate();
    const open = store.openDates();
    const result: RecentDay[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const required = store.members
        .filter((m) => m.userId === uid && m.status === 'active')
        .map((m) => store.challenges.get(m.challengeId)!)
        .filter((c) => c.startDate <= day && day <= c.endDate);
      result.push({
        day,
        required: required.length,
        covered: required.filter((c) => store.covered(uid, c.id, day)).length,
        rescued: store.rescues.filter((r) => r.userId === uid && r.rescuedDate === day).length,
        isOpen: open.includes(day),
      });
    }
    return result;
  },
  async getPendingRescues() {
    await wait();
    me();
    return clone(store.pendingRescues);
  },
  async checkin(input: CheckinInput) {
    await wait();
    const uid = me();
    const c = challengeOrThrow(input.challengeId);
    if (store.membership(c.id, uid)?.status !== 'active') throw new ApiError("Bu challenge'da değilsin", '42501');
    const date = input.localDate ?? localDate();
    if (!store.openDates().includes(date)) throw new ApiError('Bu gün artık işaretlenemez', 'P0001');
    if (date < c.startDate || date > c.endDate) throw new ApiError('Challenge bu gün sürmüyor', 'P0001');
    if (c.taskType === 'photo' && !input.photoFileUri) throw new ApiError('Fotoğraf kanıtı gerekli', '22023');
    if (c.taskType === 'number') {
      const v = input.value;
      if (v === undefined || !(v >= 0) || (c.number?.max != null && v > c.number.max)) {
        throw new ApiError('Geçersiz değer', '22023');
      }
    }
    const value = input.value === undefined ? null : Math.round(input.value * 10000) / 10000;
    return clone(store.putCheckin(uid, c.id, date, value, input.photoFileUri ?? null, input.note?.trim() || null));
  },
  async undoCheckin(challengeId, date) {
    await wait();
    const uid = me();
    const day = date ?? localDate();
    if (!store.openDates().includes(day)) throw new ApiError('Geçmiş günler değiştirilemez', 'P0001');
    store.checkins.delete(store.key(uid, challengeId, day));
  },
  async rescueWithFreeRight(challengeId, missedDate) {
    await wait();
    const uid = me();
    const month = localDate().slice(0, 7);
    if (!store.pendingRescues.some((p) => p.challengeId === challengeId && p.missedDate === missedDate)) {
      throw new ApiError('Bu gün için kurtarma yapılamaz', 'P0001');
    }
    if (store.freeRescueUsedMonth === month) throw new ApiError('Bu ayın ücretsiz kurtarma hakkı kullanıldı', 'P0001');
    store.freeRescueUsedMonth = month;
    store.rescues.push({ challengeId, userId: uid, rescuedDate: missedDate, method: 'free' });
    store.pendingRescues = store.pendingRescues.filter((p) => p.challengeId !== challengeId);
  },
  async declineRescue(challengeId, missedDate) {
    await wait();
    me();
    if (!store.pendingRescues.some((p) => p.challengeId === challengeId && p.missedDate === missedDate)) {
      throw new ApiError('Bekleyen bir kurtarma yok', 'P0002');
    }
    // Gün kurtarılmadan kapanır; seri sıfırdan devam eder, sonradan da kurtarılamaz
    store.rescueDeclines.push({ challengeId, missedDate });
    store.pendingRescues = store.pendingRescues.filter((p) => !(p.challengeId === challengeId && p.missedDate === missedDate));
  },
  async getUnseenFinished(): Promise<FinishedChallenge[]> {
    await wait();
    const uid = me();
    return store.members
      .filter((m) => m.userId === uid && m.finishedAt && !m.finishSeenAt)
      .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!))
      .map((m) => {
        const c = store.challenges.get(m.challengeId)!;
        return {
          challengeId: c.id,
          title: c.title,
          shortTitle: c.shortTitle,
          icon: c.icon,
          tint: c.tint,
          taskType: c.taskType,
          durationDays: c.durationDays,
          requiredDays: m.finalRequiredDays ?? c.durationDays,
          daysDone: m.finalDaysDone ?? 0,
          rescues: m.finalRescues ?? 0,
          rank: m.finalRank ?? 1,
          completed: (m.finalDaysDone ?? 0) >= (m.finalRequiredDays ?? c.durationDays),
          stage: stageFor(m.finalRequiredDays ?? c.durationDays),
          finishedAt: m.finishedAt!,
        };
      });
  },
  async markFinishSeen(challengeId) {
    await wait();
    const m = store.membership(challengeId, me());
    if (m?.finishedAt && !m.finishSeenAt) m.finishSeenAt = new Date().toISOString();
  },

  // Challenge -----------------------------------------------------------------------------------
  async getTemplates(): Promise<Template[]> {
    await wait();
    return templatesWithPopularity();
  },
  async getTemplateStats(templateId): Promise<TemplateStats> {
    await wait();
    const friends = store.signedIn
      ? store.members
          .filter((m) => m.status === 'active' && store.challenges.get(m.challengeId)?.templateId === templateId)
          .map((m) => m.userId)
          .filter((id, i, all) => id !== ME_ID && all.indexOf(id) === i && store.areFriends(ME_ID, id))
          .map((id) => store.profiles.get(id)!)
      : [];
    return {
      activeCount: seedTemplateActive[templateId] ?? 0,
      friendsCount: friends.length,
      friends: friends.slice(0, 2).map((p) => ({ displayName: p.displayName, avatarUrl: p.avatarUrl, avatarTint: p.avatarTint })),
    };
  },
  async getChallenge(challengeId) {
    await wait();
    return store.view(challengeOrThrow(challengeId), ME_ID);
  },

  async getMyMembership(challengeId) {
    await wait();
    const m = store.membership(challengeId, me());
    return m ? store.membershipView(m) : null;
  },
  async setMyReminder(challengeId, time) {
    await wait();
    const m = store.membership(challengeId, me());
    if (m?.status !== 'active') throw new ApiError("Bu challenge'da değilsin", '42501');
    if (time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new ApiError('Geçersiz saat', '22007');
    m.personalReminderTime = time;
    return store.membershipView(m);
  },
  async getNumberStats(challengeId, date): Promise<NumberStats> {
    await wait();
    const uid = me();
    const c = challengeOrThrow(challengeId);
    if (store.membership(c.id, uid)?.status !== 'active') throw new ApiError("Bu challenge'da değilsin", '42501');
    if (c.taskType !== 'number' || !c.number) throw new ApiError('Bu görev sayı ile işaretlenmiyor', '22023');
    const day = date ?? localDate();
    const dayIndex = store.dayIndex(c, day);
    const valueOf = (userId: string, d: LocalDate) => store.checkins.get(store.key(userId, c.id, d))?.value ?? null;
    const mine = [...store.checkins.values()]
      .filter((k) => k.userId === uid && k.challengeId === c.id && k.localDate !== day && k.value !== null)
      .map((k) => k.value!);
    const best = store
      .activeMembers(c.id)
      .filter((m) => m.userId === uid || !store.isBlocked(uid, m.userId))
      .map((m) => ({ m, k: store.checkins.get(store.key(m.userId, c.id, day)) }))
      .filter((x) => x.k?.value != null)
      .sort((a, b) => b.k!.value! - a.k!.value! || a.k!.createdAt.localeCompare(b.k!.createdAt))[0];
    return {
      localDate: day,
      dayIndex,
      target: Math.min(c.number.baseTarget + Math.max(dayIndex - 1, 0) * c.number.dailyIncrement, c.number.max ?? Infinity),
      unit: c.number.unit,
      myValue: valueOf(uid, day),
      yesterday: valueOf(uid, addDays(day, -1)),
      best: mine.length ? Math.max(...mine) : null,
      groupBest: best ? { value: best.k!.value!, person: store.lite(best.m.userId) } : null,
    };
  },
  async getChallengeBoard(challengeId): Promise<BoardMember[]> {
    await wait();
    const uid = me();
    const c = challengeOrThrow(challengeId);
    const today = localDate();
    const rows = store
      .activeMembers(challengeId)
      .filter((m) => m.userId === uid || !store.isBlocked(uid, m.userId))
      .map((m) => ({
        ...store.lite(m.userId),
        role: m.role,
        streak: store.challengeStreak(m.userId, c),
        daysDone: store.daysDone(m.userId, c),
        doneToday: store.covered(m.userId, c.id, today),
        joinedAt: m.joinedAt,
        rank: 0,
      }))
      .sort((a, b) => b.streak - a.streak || b.daysDone - a.daysDone || a.joinedAt.localeCompare(b.joinedAt));
    return rows.map(({ joinedAt: _j, ...r }, i) => ({ ...r, rank: i + 1 }));
  },
  async getChallengeCalendar(challengeId): Promise<ChallengeCalendar> {
    await wait();
    const uid = me();
    return {
      checkins: [...store.checkins.values()].filter((k) => k.challengeId === challengeId && k.userId === uid).map(clone),
      rescues: store.rescues
        .filter((r) => r.challengeId === challengeId && r.userId === uid)
        .map(({ challengeId: cid, rescuedDate, method }) => ({ challengeId: cid, rescuedDate, method })),
    };
  },
  async createChallenge(input: CreateChallengeInput) {
    await wait();
    const uid = me();
    const today = localDate();
    const start = input.startDate ?? today;
    if (start < today || start > addDays(today, 7)) {
      throw new ApiError('Başlangıç günü bugün ile 7 gün sonrası arasında olmalı', '22023');
    }
    const t = input.templateId ? seedTemplates.find((x) => x.id === input.templateId) : undefined;
    if (input.templateId && !t) throw new ApiError('Şablon bulunamadı', 'P0002');
    const title = t ? t.title : input.title?.trim();
    const taskType = t ? t.taskType : input.taskType;
    const duration = input.durationDays ?? t?.defaultDurationDays;
    if (!title || !taskType || !duration) throw new ApiError('Ad, süre ve tamamlama şekli gerekli', '22023');
    if (duration < 3 || duration > 60) throw new ApiError('Süre 3 ile 60 gün arasında olmalı', '23514');
    const id = `c-${Date.now().toString(36)}`;
    const c: SeedChallenge = {
      id,
      templateId: t?.id ?? null,
      createdBy: uid,
      title,
      shortTitle: t?.shortTitle ?? null,
      taskType,
      durationDays: duration,
      startDate: start,
      endDate: addDays(start, duration - 1),
      reminderTime: input.reminderTime ?? null,
      inviteMessage: input.inviteMessage?.trim() || null,
      category: t?.category ?? null,
      icon: t?.icon ?? 'check',
      tint: t?.tint ?? 'green',
      number: t?.number ?? input.number ?? null,
      visibility: input.visibility ?? 'invited',
    };
    store.challenges.set(id, c);
    store.members.push(newMember({ challengeId: id, userId: uid, role: 'owner', joinedOn: today, joinedAt: new Date().toISOString() }));
    if (input.inviteeIds?.length) await mockApi.inviteToChallenge(id, input.inviteeIds);
    return store.view(c, uid);
  },
  async inviteToChallenge(challengeId, userIds) {
    await wait();
    const uid = me();
    challengeOrThrow(challengeId);
    if (store.membership(challengeId, uid)?.status !== 'active') {
      throw new ApiError("Bu challenge'a davet edemezsin", '42501');
    }
    let count = 0;
    for (const id of userIds) {
      if (!store.areFriends(uid, id) || store.isBlocked(uid, id)) {
        throw new ApiError('Yalnızca arkadaşlarını davet edebilirsin', 'P0001');
      }
      const existing = store.membership(challengeId, id);
      if (existing && existing.status !== 'declined') continue;
      if (store.members.filter((m) => m.challengeId === challengeId && (m.status === 'active' || m.status === 'invited')).length >= MAX_MEMBERS) {
        throw new ApiError('Grup dolu', 'P0001');
      }
      if (existing) {
        existing.status = 'invited';
        existing.invitedBy = uid;
      } else {
        store.members.push(newMember({ challengeId, userId: id, status: 'invited', invitedBy: uid }));
      }
      count += 1;
    }
    return count;
  },
  async respondToInvite(challengeId, accept) {
    await wait();
    const m = store.membership(challengeId, me());
    if (!m || m.status !== 'invited') throw new ApiError('Davet bulunamadı', 'P0002');
    if (accept) {
      m.status = 'active';
      m.joinedOn = localDate();
      m.joinedAt = new Date().toISOString();
    } else {
      m.status = 'declined';
    }
  },
  async leaveChallenge(challengeId) {
    await wait();
    const uid = me();
    const c = challengeOrThrow(challengeId);
    const m = store.membership(challengeId, uid);
    if (c.endDate < localDate() && m?.status === 'active') throw new ApiError('Bu challenge bitti', 'P0001');
    if (!m || m.status !== 'active') throw new ApiError("Bu challenge'da değilsin", 'P0002');
    m.status = 'left';
    m.leftOn = localDate();
    if (m.role === 'owner') {
      m.role = 'member';
      const next = store.activeMembers(challengeId).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
      if (next) next.role = 'owner';
    }
  },
  async createInviteCode(challengeId) {
    await wait();
    const uid = me();
    if (store.membership(challengeId, uid)?.status !== 'active') {
      throw new ApiError("Bu challenge'a davet edemezsin", '42501');
    }
    const existing = Object.entries(store.inviteCodes).find(([, v]) => v.challengeId === challengeId && v.inviterId === uid);
    if (existing) return existing[0];
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const code = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    store.inviteCodes[code] = { challengeId, inviterId: uid };
    return code;
  },
  async getInvitePreview(code): Promise<InvitePreview | null> {
    await wait();
    const inv = store.inviteCodes[code];
    if (!inv) return null;
    const c = store.challenges.get(inv.challengeId)!;
    const inviter = store.profiles.get(inv.inviterId)!;
    const members = store.activeMembers(c.id).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    return {
      // Oturumsuz önizleme kimlik vermez (sunucuyla aynı)
      challengeId: store.signedIn ? c.id : null,
      inviter: { displayName: inviter.displayName, avatarUrl: inviter.avatarUrl, avatarTint: inviter.avatarTint },
      challenge: {
        title: c.title,
        durationDays: c.durationDays,
        taskType: c.taskType,
        startDate: c.startDate,
        endDate: c.endDate,
        icon: c.icon,
        tint: c.tint,
        inviteMessage: c.inviteMessage,
      },
      memberCount: members.length,
      members: members.slice(0, 5).map((m) => {
        const p = store.profiles.get(m.userId)!;
        return { initial: p.displayName.charAt(0), avatarTint: p.avatarTint };
      }),
      alreadyMember: store.signedIn && store.membership(c.id, ME_ID)?.status === 'active',
    };
  },
  async joinByInvite(code) {
    await wait();
    const uid = me();
    const inv = store.inviteCodes[code];
    if (!inv || store.isBlocked(uid, inv.inviterId)) throw new ApiError('Davet linki geçersiz', 'P0002');
    const c = challengeOrThrow(inv.challengeId);
    if (c.endDate < localDate()) throw new ApiError('Bu challenge bitti', 'P0001');
    const m = store.membership(c.id, uid);
    if (m?.status === 'active') return c.id;
    if (m?.status === 'left') throw new ApiError("Ayrıldığın challenge'a tekrar katılamazsın", 'P0001');
    if (store.activeMembers(c.id).length >= MAX_MEMBERS) throw new ApiError('Grup dolu', 'P0001');
    const joinedOn = localDate();
    if (m) {
      m.status = 'active';
      m.invitedBy = inv.inviterId;
      m.joinedOn = joinedOn;
      m.joinedAt = new Date().toISOString();
    } else {
      store.members.push(newMember({ challengeId: c.id, userId: uid, invitedBy: inv.inviterId, joinedOn, joinedAt: new Date().toISOString() }));
    }
    return c.id;
  },
  async joinFriendChallenge(challengeId) {
    await wait();
    const uid = me();
    const c = store.challenges.get(challengeId);
    // join_friend_challenge: oluşturanın arkadaşı, oluşturan hâlâ aktif üye, "Arkadaşlarım" görünürlük
    if (
      !c ||
      c.visibility !== 'friends' ||
      !c.createdBy ||
      !store.areFriends(uid, c.createdBy) ||
      store.membership(c.id, c.createdBy)?.status !== 'active'
    ) {
      throw new ApiError('Challenge bulunamadı', 'P0002');
    }
    if (c.endDate < localDate()) throw new ApiError('Bu challenge bitti', 'P0001');
    const m = store.membership(c.id, uid);
    if (m?.status === 'active') return store.membershipView(m);
    if (m?.status === 'left') throw new ApiError("Ayrıldığın challenge'a tekrar katılamazsın", 'P0001');
    if (store.activeMembers(c.id).length >= MAX_MEMBERS) throw new ApiError('Grup dolu', 'P0001');
    const joinedOn = localDate();
    const row =
      m ?? newMember({ challengeId: c.id, userId: uid, invitedBy: c.createdBy });
    row.status = 'active';
    row.invitedBy = row.invitedBy ?? c.createdBy;
    row.joinedOn = joinedOn;
    row.joinedAt = new Date().toISOString();
    if (!m) store.members.push(row);
    return store.membershipView(row);
  },
  async getGarden() {
    await wait();
    me();
    return clone(store.garden);
  },
  async getBadges(): Promise<Badge[]> {
    await wait();
    me();
    return seedBadges.map((b) => ({ ...b, earnedAt: store.earnedBadges.get(b.key) ?? null }));
  },

  // Arkadaşlar ve sosyal ------------------------------------------------------------------------
  async getFriendsToday(): Promise<FriendToday[]> {
    await wait();
    const uid = me();
    return store
      .friendsOf(uid)
      .filter((id) => !store.isBlocked(uid, id))
      .map((id) => {
        const p = store.profiles.get(id)!;
        const shared = store.runningFor(uid).find((c) => store.membership(c.id, id)?.status === 'active');
        return {
          ...store.lite(id),
          harshMode: p.harshMode,
          streak: store.streakOf(id),
          doneToday: store.doneTodayAll(id),
          activeChallenges: store.runningFor(id).length,
          sharedChallengeId: shared?.id ?? null,
          sharedChallengeTitle: shared?.title ?? null,
          challengeShortTitle: shared?.shortTitle ?? null,
        };
      })
      .sort((a, b) => Number(a.doneToday ?? 2) - Number(b.doneToday ?? 2) || a.displayName.localeCompare(b.displayName, 'tr'));
  },
  async getFriendRequests(): Promise<FriendRequest[]> {
    await wait();
    const uid = me();
    return store.friendships
      .filter((f) => f.status === 'pending' && (f.requesterId === uid || f.addresseeId === uid))
      .map((f) => {
        const other = f.requesterId === uid ? f.addresseeId : f.requesterId;
        return {
          id: f.id,
          person: store.lite(other),
          direction: f.addresseeId === uid ? ('incoming' as const) : ('outgoing' as const),
          createdAt: f.createdAt,
          mutualCount: store.mutualCount(uid, other),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async searchProfiles(query): Promise<SearchResult[]> {
    await wait();
    const uid = me();
    const term = query.trim().replace(/^@/, '').toLowerCase();
    if (term.length < 2) return [];
    return [...store.profiles.values()]
      .filter((p) => p.id !== uid && p.username.startsWith(term) && !store.isBlocked(uid, p.id))
      .map((p) => {
        const f = store.friendship(uid, p.id);
        return {
          ...store.lite(p.id),
          isFriend: f?.status === 'accepted',
          requestPending: f?.status === 'pending',
          mutualCount: store.mutualCount(uid, p.id),
        };
      });
  },
  async sendFriendRequest(userId) {
    await wait();
    const uid = me();
    if (userId === uid) throw new ApiError('Kendine istek gönderemezsin', 'P0001');
    if (!store.profiles.has(userId) || store.isBlocked(uid, userId)) throw new ApiError('Kullanıcı bulunamadı', 'P0002');
    const f = store.friendship(uid, userId);
    if (f) {
      if (f.status === 'pending' && f.addresseeId === uid) f.status = 'accepted';
      return;
    }
    store.friendships.push({ id: `fr-${Date.now().toString(36)}`, requesterId: uid, addresseeId: userId, status: 'pending', createdAt: new Date().toISOString() });
  },
  async acceptFriendRequest(friendshipId) {
    await wait();
    const uid = me();
    const f = store.friendships.find((x) => x.id === friendshipId && x.addresseeId === uid && x.status === 'pending');
    if (!f) throw new ApiError('İstek bulunamadı', 'P0002');
    f.status = 'accepted';
    store.activity = store.activity.filter((a) => a.friendshipId !== friendshipId);
  },
  async removeFriendship(userId) {
    await wait();
    const uid = me();
    const f = store.friendship(uid, userId);
    store.friendships = store.friendships.filter((x) => x !== f);
    if (f) store.activity = store.activity.filter((a) => a.friendshipId !== f.id);
  },
  async getFriendProfile(userId): Promise<FriendProfile | null> {
    await wait();
    const uid = me();
    if (store.isBlocked(uid, userId) || !(store.areFriends(uid, userId) || store.coMembers(uid, userId))) return null;
    const p = store.profiles.get(userId)!;
    const today = localDate();
    return {
      ...clone(p),
      isFriend: store.areFriends(uid, userId),
      streak: store.streakOf(userId),
      completedCount: userId === 'u-ece' ? 7 : 3,
      sharedChallenges: store.members
        .filter((m) => m.userId === uid && m.status === 'active' && store.membership(m.challengeId, userId)?.status === 'active')
        .map((m) => store.challenges.get(m.challengeId)!)
        .filter((c) => c.endDate >= today)
        .map((c) => ({
          challengeId: c.id,
          title: c.title,
          icon: c.icon,
          tint: c.tint,
          durationDays: c.durationDays,
          dayIndex: Math.max(Math.min(store.dayIndex(c), c.durationDays), 0),
          daysDone: store.daysDone(userId, c),
        })),
      joinableChallenges: store.joinableFor(uid, userId),
    };
  },
  async getPokeMessages(): Promise<PokeMessage[]> {
    await wait();
    return clone(seedPokeMessages);
  },
  async getPokeStatus(userId): Promise<PokeStatus> {
    await wait();
    const uid = me();
    if (userId === uid) throw new ApiError('Kendini dürtemezsin', 'P0001');
    const recipient = store.profiles.get(userId);
    if (!recipient || store.isBlocked(uid, userId) || !(store.areFriends(uid, userId) || store.coMembers(uid, userId))) {
      throw new ApiError('Bu kişiyi dürtemezsin', 'P0001');
    }
    const today = localDate();
    // Geri alınan dürtmeler de sayılır (mock'ta geri alınan kayıt silinmez)
    const sentToday = store.pokes.filter(
      (k) => k.senderId === uid && k.recipientId === userId && localDate(new Date(k.createdAt)) === today,
    ).length;
    return { harshMode: recipient.harshMode, sentToday, dailyLimit: POKE_DAILY_LIMIT, remaining: Math.max(POKE_DAILY_LIMIT - sentToday, 0) };
  },
  async sendPoke(input: SendPokeInput) {
    await wait();
    const uid = me();
    const recipient = store.profiles.get(input.recipientId);
    if (!recipient || input.recipientId === uid) throw new ApiError('Kendini dürtemezsin', 'P0001');
    if (store.isBlocked(uid, input.recipientId)) throw new ApiError('Bu kişiyi dürtemezsin', 'P0001');
    if (!store.areFriends(uid, input.recipientId) && !(input.challengeId && store.coMembers(uid, input.recipientId))) {
      throw new ApiError('Bu kişiyi dürtemezsin', 'P0001');
    }
    if (input.tone === 'roast' && !recipient.harshMode) {
      throw new ApiError('Sert modu kapalı; sadece gaz verebilirsin', 'P0001');
    }
    if (!seedPokeMessages.some((m) => m.key === input.messageKey && m.tone === input.tone)) {
      throw new ApiError('Geçersiz mesaj', '22023');
    }
    const today = localDate();
    const sentToday = store.pokes.filter(
      (k) => k.senderId === uid && k.recipientId === input.recipientId && localDate(new Date(k.createdAt)) === today,
    ).length;
    if (sentToday >= POKE_DAILY_LIMIT) throw new ApiError('Bugün bu kişiyi yeterince dürttün', 'P0001');
    const poke: Poke = {
      id: `p-${Date.now().toString(36)}`,
      senderId: uid,
      recipientId: input.recipientId,
      challengeId: input.challengeId ?? null,
      tone: input.tone,
      messageKey: input.messageKey,
      createdAt: new Date().toISOString(),
    };
    // Geri alınan dürtme de günlük sınıra sayılır; o yüzden kayıt silinmez, yalnızca işaretlenir.
    store.pokes.push(poke);
    return clone(poke);
  },
  async undoPoke(pokeId) {
    await wait();
    const uid = me();
    const p = store.pokes.find((k) => k.id === pokeId && k.senderId === uid);
    if (!p || Date.now() - new Date(p.createdAt).getTime() > POKE_UNDO_MS) {
      throw new ApiError('Geri alma süresi doldu', 'P0001');
    }
  },
  async getActivity() {
    await wait();
    return clone(store.visibleActivity(me()));
  },
  async getActivityPage(params = {}): Promise<ActivityPage> {
    await wait();
    const limit = Math.min(Math.max(params.limit ?? ACTIVITY_PAGE_SIZE, 1), 100);
    const rest = store.visibleActivity(me()).filter((a) => !params.before || isOlderThan(a, params.before));
    const items = rest.slice(0, limit);
    return { items: clone(items), nextCursor: rest.length > limit ? cursorOf(items[items.length - 1]) : null };
  },
  async getUnreadCount() {
    await wait();
    return store.visibleActivity(me()).filter((a) => !a.readAt).length;
  },
  async markActivityRead(ids) {
    await wait();
    me();
    const now = new Date().toISOString();
    store.activity.forEach((a) => {
      if (!a.readAt && (!ids || ids.includes(a.id))) a.readAt = now;
    });
  },
  async getBlockedUsers(): Promise<BlockedUser[]> {
    await wait();
    const uid = me();
    return store.blocks.filter((b) => b.blockerId === uid).map((b) => ({ ...store.lite(b.blockedId), blockedAt: b.createdAt }));
  },
  async blockUser(userId) {
    await wait();
    const uid = me();
    if (!store.blocks.some((b) => b.blockerId === uid && b.blockedId === userId)) {
      store.blocks.push({ blockerId: uid, blockedId: userId, createdAt: new Date().toISOString() });
    }
    store.friendships = store.friendships.filter((f) => f !== store.friendship(uid, userId));
  },
  async unblockUser(userId) {
    await wait();
    const uid = me();
    store.blocks = store.blocks.filter((b) => !(b.blockerId === uid && b.blockedId === userId));
  },
  async submitReport(input: ReportInput) {
    await wait();
    const uid = me();
    if (input.userId === uid) throw new ApiError('Kendini şikayet edemezsin', 'P0001');
    store.reports.push(clone(input));
    if (input.alsoBlock && input.userId) await mockApi.blockUser(input.userId);
  },
};
