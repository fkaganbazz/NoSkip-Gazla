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
export type AvatarTintKey = 'peach' | 'lavender' | 'mint' | 'butter' | 'sky';
export type Locale = 'tr' | 'en';
/** Create "Kimler görebilir": Davetliler / Arkadaşlarım (challenges.visibility) */
export type ChallengeVisibility = 'invited' | 'friends';
/** Kullanıcının yerel gününe göre, sunucudan (challenge_detail) */
export type ChallengeStatus = 'upcoming' | 'active' | 'finished';
/** Ayarlar "Gün bitişi toleransı" (user_settings.day_end_grace_hours) */
export type DayEndGraceHours = 0 | 1 | 2;

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
  /**
   * Giriş sağlayıcısından gelen ad (Google; Apple yalnızca ilk girişte verir ve kullanıcı
   * meta verisine yazılır). Profile adımında görünen ad önerisi; yoksa null.
   */
  displayNameHint?: string | null;
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
  /** Gün, ertesi gece yarısından bu kadar saat sonra kapanır (varsayılan 2) */
  dayEndGraceHours: DayEndGraceHours;
};

export type ProfileUpdate = Partial<Pick<Profile, 'username' | 'displayName' | 'avatarTint' | 'harshMode'>> & {
  /** Yeni avatar: yerel dosya adresi (yüklenir) ya da null (kaldırılır) */
  avatarFileUri?: string | null;
};

export type SettingsUpdate = Partial<
  Pick<
    UserSettings,
    'timezone' | 'locale' | 'pokePushEnabled' | 'dailyReminderTime' | 'discoverability' | 'dayEndGraceHours'
  >
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

/** Şablonlu challenge'ın hazır süreleri (challenges_template_duration) */
export type TemplateDuration = 7 | 10 | 30;

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
  defaultDurationDays: TemplateDuration;
  /** Seçilebilen hazır süreler, artan (challenge_templates.allowed_durations; varsayılanı içerir) */
  allowedDurations: TemplateDuration[];
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  number: NumberSettings | null;
  /** PickChallenge sırası (null = onboarding'de yok) */
  onboardingOrder: number | null;
  /** "Haftanın challenge'ı" haftası (pazartesi) */
  featuredWeek: LocalDate | null;
  /** Şu an yapan kişi sayısı (template_popularity; template_stats.activeCount ile aynı tanım) */
  activeCount: number;
  /** Keşfet "Popüler" sırası: 1 en popüler (yapan sayısı, eşitlikte onboarding sırası) */
  popularity: number;
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
  visibility: ChallengeVisibility;
  /** Kullanıcının gününe göre durum: başlamadı / sürüyor (son gün toleransta da) / bitti */
  status: ChallengeStatus;
  /** Kullanıcının gününe göre gün numarası: 0 = başlamadı, en çok durationDays */
  dayIndex: number;
  /** Aktif üye sayısı */
  memberCount: number;
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
  /** Varsayılan 'invited' (yalnızca davetliler) */
  visibility?: ChallengeVisibility;
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
  /** Etkin hatırlatma saati 'HH:MM': kişisel saat, yoksa grubun saati (null = hatırlatma yok) */
  reminderTime: string | null;
  /** Kişisel hatırlatma saati 'HH:MM'; null = grubun saati (Detail "Hatırlatma saatini değiştir") */
  personalReminderTime: string | null;
  /** "Challenge bitti" ekranı gösterildi (markFinishSeen) */
  finishSeenAt: Timestamp | null;
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
  /** Katılınca / zaten üyeyse açılacak challenge; oturum yokken null */
  challengeId: string | null;
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
  /** Challenge'daki en uzun ardışık seri (kurtarılan günler dahil) */
  longestStreak: number;
  /** Bahçedeki en uzun seri olan bitki (tek; eşitlikte en az kurtarma, sonra en yeni) → çiçek + gözlük */
  isLongest: boolean;
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
  /** Ortak challenge'ın kısa adı (sharedChallengeId ile aynı challenge; yoksa null) */
  challengeShortTitle: string | null;
};

export type FriendRequest = {
  id: string;
  person: PersonLite;
  direction: 'incoming' | 'outgoing';
  createdAt: Timestamp;
  /** Ortak arkadaş sayısı ("@kerem.a · 3 ortak") */
  mutualCount: number;
};

export type SearchResult = PersonLite & {
  isFriend: boolean;
  requestPending: boolean;
  /** Ortak arkadaş sayısı */
  mutualCount: number;
};

/** Arkadaşın "Arkadaşlarım" görünürlüklü, katılınabilir challenge'ı (joinFriendChallenge) */
export type JoinableChallenge = {
  challengeId: string;
  title: string;
  shortTitle: string | null;
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  taskType: TaskType;
  durationDays: number;
  startDate: LocalDate;
  endDate: LocalDate;
  /** Kullanıcının gününe göre; 0 = henüz başlamadı */
  dayIndex: number;
  memberCount: number;
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
  /** Arkadaşın davetsiz katılabileceğin challenge'ları (yalnızca arkadaşa; ortak üyeye boş) */
  joinableChallenges: JoinableChallenge[];
};

export type PokeMessage = {
  key: string;
  tone: PokeTone;
  sortOrder: number;
  text: string;
  isActive: boolean;
};

/** Poke sayfası: alıcıya bugün (alıcının günü) gönderilen ve kalan dürtme hakkı */
export type PokeStatus = {
  /** "Laf sok" yalnızca açıksa */
  harshMode: boolean;
  /** Geri alınanlar da sayılır */
  sentToday: number;
  dailyLimit: number;
  /** 0 ise gönder butonu pasif */
  remaining: number;
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

/** Aktivite sayfası (30'ar; en yeniden eskiye) */
export type ActivityPageParams = {
  /** Önceki sayfanın nextCursor'ı; verilmezse en yeniler */
  before?: string;
  /** Varsayılan 30 */
  limit?: number;
};

export type ActivityPage = {
  items: ActivityItem[];
  /** Sonraki (daha eski) sayfa için; null = son sayfa */
  nextCursor: string | null;
};

export type BlockedUser = PersonLite & { blockedAt: Timestamp };

// Rozetler (badges, my_badges) ---------------------------------------------------------------------

export type BadgeKey =
  | 'ilk_30_gun'
  | 'laf_ustasi'
  | 'erkenci'
  | 'yuz_gun'
  | 'maratoncu'
  | 'bahcivan'
  | 'sampiyon'
  | 'gaz_pedali'
  | 'son_dakika'
  | 'gece_kusu'
  | 'sosyal_kaktus'
  | 'objektif';

/**
 * Rozet ikonu (çizgi SVG, ekran tarafı çizer). Garden.dc.html'de path'i olanlar: star, speech, sun
 * (kilitli rozetin kilidi de orada). Uygulamada karşılığı olanlar (`src/components/icons`): streak →
 * StreakIcon, calendar → CalendarIcon, sprout → SproutIcon, hand → HandIcon, clock → ClockIcon,
 * friends → FriendsIcon, camera → CameraIcon. Tasarımda olmayanlar: trophy, moon.
 */
export type BadgeIconKey =
  | 'star'
  | 'speech'
  | 'sun'
  | 'streak'
  | 'calendar'
  | 'sprout'
  | 'trophy'
  | 'hand'
  | 'clock'
  | 'moon'
  | 'friends'
  | 'camera';

/** Rozet dairesi rengi (Garden.dc.html): yellow #FFC83D, orange #FF5A1F, mint #8BE0AE */
export type BadgeTintKey = 'yellow' | 'orange' | 'mint';

/** Bahçem "Rozetler n / 12": tüm rozetler katalog sırasıyla; kilitlilerde earnedAt null */
export type Badge = {
  key: BadgeKey;
  sortOrder: number;
  title: string;
  description: string;
  icon: BadgeIconKey;
  tint: BadgeTintKey;
  earnedAt: Timestamp | null;
};

// NumberEntry ve bitiş ekranı ----------------------------------------------------------------------

/** NumberEntry "Dün / En iyin / Grupta en iyi" (number_stats) */
export type NumberStats = {
  /** Girilen gün (varsayılan bugün; toleransta dün) */
  localDate: LocalDate;
  dayIndex: number;
  target: number | null;
  unit: string | null;
  /** O gün kaydedilmiş değerin */
  myValue: number | null;
  /** Dünkü değerin */
  yesterday: number | null;
  /** O gün hariç en iyi değerin */
  best: number | null;
  /** Grubun o günkü en iyisi (sen dahil; engelli ve ayrılmış üyeler hariç) */
  groupBest: { value: number; person: PersonLite } | null;
};

/** Bugün açılışında bir kez gösterilecek "Challenge bitti" (my_unseen_finished) */
export type FinishedChallenge = {
  challengeId: string;
  title: string;
  shortTitle: string | null;
  icon: ChallengeIconKey;
  tint: ChallengeTintKey;
  taskType: TaskType;
  durationDays: number;
  /** Kendi sorumlu olduğun gün sayısı (sonradan katılan için süreden az) — "30/30 GÜN" paydası */
  requiredDays: number;
  daysDone: number;
  rescues: number;
  /** Grupta sıra */
  rank: number;
  /** Tüm günlerini kapsadın: bahçeye kaktüs eklendi ("Efsane!") */
  completed: boolean;
  stage: DikenStage;
  finishedAt: Timestamp;
};

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
