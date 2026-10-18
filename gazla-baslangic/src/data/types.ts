/**
 * Uygulamanın veri tipleri. Her tip bir Supabase RPC'sinin ya da tablosunun döndürdüğü satırın
 * camelCase karşılığıdır (supabase/migrations). Ekranlar yalnızca bu tipleri görür; veri mock'tan mı
 * Supabase'ten mi geliyor bilmez.
 *
 * Tarih alanları: `LocalDate` = kullanıcının yerel günü 'YYYY-MM-DD'; `Timestamp` = ISO 8601.
 */

export type LocalDate = string;
export type Timestamp = string;

// Enum'lar (migration 000) ------------------------------------------------------------------

export type TaskType = 'check' | 'photo' | 'number';
export type ChallengeCategory =
  | 'detox'
  | 'social_courage'
  | 'sport'
  | 'food_drink'
  | 'reading'
  | 'money'
  | 'quirky';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'invited' | 'active' | 'declined' | 'left';
export type PokeTone = 'hype' | 'roast';
export type RescueMethod = 'ad' | 'free';
export type ReportTarget = 'user' | 'photo' | 'challenge';
export type ReportReason =
  | 'harassment'
  | 'inappropriate_photo'
  | 'spam_or_fake'
  | 'dangerous_challenge'
  | 'other';
export type NotificationKind =
  | 'daily_reminder'
  | 'day_ending'
  | 'streak_broken'
  | 'weekly_summary'
  | 'streak_milestone'
  | 'poke_hype'
  | 'poke_roast'
  | 'friend_request'
  | 'challenge_invite'
  | 'friend_finished_challenge';
export type Discoverability = 'everyone' | 'nobody';
export type DikenStage = 'filiz' | 'genc' | 'tam' | 'cicek';
export type AvatarTintKey = 'peach' | 'lavender' | 'mint' | 'butter';
export type Locale = 'tr' | 'en';

/** Challenge ikon anahtarı (challenge_templates.icon / challenges.icon) */
export type ChallengeIconKey =
  | 'check'
  | 'coffee'
  | 'phoneOff'
  | 'chatHeart'
  | 'timer'
  | 'book'
  | 'wallet'
  | 'toothbrush'
  | 'candy';
/** Challenge renk anahtarı (challenge_templates.tint / challenges.tint) */
export type ChallengeTintKey = 'lilac' | 'rose' | 'green' | 'butter' | 'peach' | 'teal' | 'sky';

// Oturum ve profil -----------------------------------------------------------------------------

export type Session = {
  userId: string;
  email: string | null;
};

/** Başkalarının da görebildiği profil (profiles) */
export type Profile = {
  id: string;
  username: string;
  displayName: string;
  /** Storage avatars kovasındaki dosyanın herkese açık adresi */
  avatarUrl: string | null;
  avatarTint: AvatarTintKey;
  harshMode: boolean;
};

/** Listelerde kişi: profilin küçük hali */
export type PersonLite = Pick<Profile, 'id' | 'displayName' | 'username' | 'avatarUrl' | 'avatarTint'>;

/** Yalnızca sahibinin gördüğü ayarlar (user_settings) */
export type UserSettings = {
  birthYear: number;
  timezone: string;
  locale: Locale;
  pokePushEnabled: boolean;
  /** 'HH:MM'; null = günlük hatırlatma kapalı */
  dailyReminderTime: string | null;
  discoverability: Discoverability;
};

export type ProfileUpdate = Partial<Pick<Profile, 'username' | 'displayName' | 'avatarTint' | 'harshMode'>> & {
  /** Yeni avatar: yerel dosya adresi (yüklenir) ya da null (kaldırılır) */
  avatarFileUri?: string | null;
};

export type SettingsUpdate = Partial<
  Pick<UserSettings, 'timezone' | 'locale' | 'pokePushEnabled' | 'dailyReminderTime' | 'discoverability'>
>;

export type CompleteProfileInput = {
  username: string;
  displayName: string;
  birthYear: number;
  timezone: string;
  locale?: Locale;
};

// Bugün ve seri (my_today, my_streak, my_pending_rescues, my_recent_days) ------------------------

export type TodayTask = {
  challengeId: string;
  title: string;
  shortTitle: string | null;
  taskType: TaskType;
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  /** Görevin ait olduğu gün (gece 00:00–02:00 arası dünün görevleri de gelir) */
  localDate: LocalDate;
  dayIndex: number;
  durationDays: number;
  done: boolean;
  value: number | null;
  photoUrl: string | null;
  note: string | null;
  /** Sayı görevinde günün hedefi */
  target: number | null;
  numberUnit: string | null;
  memberCount: number;
};

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  stage: DikenStage;
  /** Kurtarılabilecek kaçırılmış gün var (Diken solgun) */
  wilted: boolean;
  doneToday: number;
  totalToday: number;
  freeRescueAvailable: boolean;
};

export type PendingRescue = {
  challengeId: string;
  title: string;
  missedDate: LocalDate;
  streakBefore: number;
  expiresAt: Timestamp;
  freeRescueAvailable: boolean;
};

export type RecentDay = {
  day: LocalDate;
  required: number;
  covered: number;
  rescued: number;
  isOpen: boolean;
};

export type CheckinInput = {
  challengeId: string;
  /** Verilmezse bugün; toleransta dün için gönder */
  localDate?: LocalDate;
  value?: number;
  /** Fotoğraf görevinde: cihazdaki dosya (önce Storage'a yüklenir) */
  photoFileUri?: string;
  note?: string;
};

export type Checkin = {
  id: string;
  challengeId: string;
  userId: string;
  localDate: LocalDate;
  value: number | null;
  photoUrl: string | null;
  note: string | null;
  createdAt: Timestamp;
};

export type StreakRescue = {
  challengeId: string;
  rescuedDate: LocalDate;
  method: RescueMethod;
};

// Challenge ------------------------------------------------------------------------------------

export type NumberSettings = {
  unit: string;
  baseTarget: number;
  dailyIncrement: number;
  step: number;
  max: number | null;
};

/** Katalog (challenge_templates), kullanıcının diline göre */
export type Template = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string | null;
  description: string | null;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  taskType: TaskType;
  defaultDurationDays: 7 | 10 | 30;
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  number: NumberSettings | null;
  /** PickChallenge sırası (null = onboarding'de yok) */
  onboardingOrder: number | null;
  /** "Haftanın challenge'ı" haftası (pazartesi) */
  featuredWeek: LocalDate | null;
};

export type TemplateStats = {
  activeCount: number;
  friendsCount: number;
  /** İlk iki arkadaş (yüz yığını) */
  friends: Pick<Profile, 'displayName' | 'avatarUrl' | 'avatarTint'>[];
};

export type Challenge = {
  id: string;
  templateId: string | null;
  createdBy: string | null;
  title: string;
  shortTitle: string | null;
  taskType: TaskType;
  durationDays: number;
  startDate: LocalDate;
  endDate: LocalDate;
  /** 'HH:MM' grubun hatırlatma saati */
  reminderTime: string | null;
  inviteMessage: string | null;
  category: ChallengeCategory | null;
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  number: NumberSettings | null;
};

export type CreateChallengeInput = {
  /** Şablondan: diğer alanlar şablondan kopyalanır */
  templateId?: string;
  title?: string;
  taskType?: TaskType;
  durationDays?: number;
  startDate?: LocalDate;
  reminderTime?: string | null;
  inviteMessage?: string | null;
  number?: NumberSettings;
  inviteeIds?: string[];
};

export type ChallengeMembership = {
  challengeId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy: string | null;
  joinedOn: LocalDate | null;
  leftOn: LocalDate | null;
  finishedAt: Timestamp | null;
  finalDaysDone: number | null;
  finalRequiredDays: number | null;
  finalRescues: number | null;
  finalRank: number | null;
};

/** Detail ekranındaki grup listesi (challenge_board) */
export type BoardMember = PersonLite & {
  role: MemberRole;
  streak: number;
  daysDone: number;
  doneToday: boolean;
  rank: number;
};

/** Detail takvimi: kullanıcının kendi günleri */
export type ChallengeCalendar = {
  checkins: Checkin[];
  rescues: StreakRescue[];
};

export type InvitePreview = {
  inviter: Pick<Profile, 'displayName' | 'avatarUrl' | 'avatarTint'>;
  challenge: Pick<
    Challenge,
    'title' | 'durationDays' | 'taskType' | 'startDate' | 'endDate' | 'icon' | 'tint' | 'inviteMessage'
  >;
  memberCount: number;
  /** İlk 5 üyenin baş harfi ve rengi */
  members: { initial: string; avatarTint: AvatarTintKey }[];
  alreadyMember: boolean;
};

/** Bahçe: tamamlanan challenge (my_garden) */
export type GardenItem = {
  challengeId: string;
  title: string;
  shortTitle: string | null;
  durationDays: number;
  requiredDays: number;
  stage: DikenStage;
  finishedAt: Timestamp;
  finalRescues: number;
  finalRank: number;
};

// Arkadaşlar ve sosyal --------------------------------------------------------------------------

export type FriendToday = PersonLite & {
  harshMode: boolean;
  streak: number;
  /** null = bugün görevi yok */
  doneToday: boolean | null;
  activeChallenges: number;
  sharedChallengeId: string | null;
  sharedChallengeTitle: string | null;
};

export type FriendRequest = {
  id: string;
  person: PersonLite;
  direction: 'incoming' | 'outgoing';
  createdAt: Timestamp;
};

export type SearchResult = PersonLite & {
  isFriend: boolean;
  requestPending: boolean;
};

export type FriendProfile = Profile & {
  isFriend: boolean;
  streak: number;
  completedCount: number;
  sharedChallenges: {
    challengeId: string;
    title: string;
    icon: ChallengeIconKey;
    tint: ChallengeTintKey;
    durationDays: number;
    /** 0 = henüz başlamadı */
    dayIndex: number;
    daysDone: number;
  }[];
};

export type PokeMessage = {
  key: string;
  tone: PokeTone;
  sortOrder: number;
  text: string;
  isActive: boolean;
};

export type SendPokeInput = {
  recipientId: string;
  tone: PokeTone;
  messageKey: string;
  challengeId?: string;
};

export type Poke = {
  id: string;
  senderId: string;
  recipientId: string;
  challengeId: string | null;
  tone: PokeTone;
  messageKey: string;
  createdAt: Timestamp;
};

/** Aktivite akışı (notifications); actor null ise mesajı Diken söylüyor */
export type ActivityItem = {
  id: string;
  kind: NotificationKind;
  actor: PersonLite | null;
  challengeId: string | null;
  challengeTitle: string | null;
  /** Dürtmelerde mesaj metni */
  pokeText: string | null;
  friendshipId: string | null;
  payload: Record<string, unknown>;
  createdAt: Timestamp;
  readAt: Timestamp | null;
};

export type BlockedUser = PersonLite & { blockedAt: Timestamp };

export type ReportInput = {
  target: ReportTarget;
  reason: ReportReason;
  details?: string;
  alsoBlock?: boolean;
  /** user/photo/challenge şikayetinde kişi (davet koduyla challenge şikayetinde boş bırakılabilir) */
  userId?: string;
  checkinId?: string;
  challengeId?: string;
  inviteCode?: string;
};
