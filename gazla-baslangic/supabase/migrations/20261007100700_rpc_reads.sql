-- Gazla veri modeli · 8/10 — ekranların okuduğu RPC'ler ve yetki temizliği.
--
-- Hesaplanan değerler (seri, gün numarası, hedef, sıra) burada üretilir; istemci tablolardan
-- kendisi hesaplamaz. Zaman parametreli app.* sürümleri testler ve zamanlanmış işler içindir.

-- Bugün ekranı -------------------------------------------------------------------------------

create function app.today_tasks(p_user uuid, p_at timestamptz)
returns table (
  challenge_id uuid, title text, short_title text, task_type public.task_type,
  icon text, tint text, local_date date, day_index integer, duration_days integer,
  done boolean, value numeric, photo_path text, note text, target numeric, number_unit text,
  member_count integer
)
language sql stable security definer set search_path = '' as $$
  with t as (select (app.open_dates(p_user, p_at))[1] as today)
  select c.id, c.title, c.short_title, c.task_type, c.icon, c.tint, t.today,
         (t.today - c.start_date + 1)::int,
         c.duration_days::int,
         k.id is not null,
         k.value, k.photo_path, k.note,
         app.number_target(c.id, (t.today - c.start_date + 1)::int),
         c.number_unit,
         app.active_member_count(c.id)
  from t
  join public.challenge_members m on m.user_id = p_user and m.status = 'active'
  join public.challenges c on c.id = m.challenge_id
  left join public.checkins k
    on k.user_id = p_user and k.challenge_id = c.id and k.local_date = t.today
  where t.today between greatest(c.start_date, m.joined_on) and c.end_date
  order by m.joined_at, c.id
$$;

create function public.my_today()
returns table (
  challenge_id uuid, title text, short_title text, task_type public.task_type,
  icon text, tint text, local_date date, day_index integer, duration_days integer,
  done boolean, value numeric, photo_path text, note text, target numeric, number_unit text,
  member_count integer
)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := app.require_user();
begin
  -- Süresi dolan challenge'ları kapat (bahçe, bitirme bildirimi)
  perform app.finalize_user(v_uid, now());
  return query select * from app.today_tasks(v_uid, now());
end
$$;

-- Seri özeti: Bugün kahraman kartı, Bahçe, widget
create function app.streak_summary(p_user uuid, p_at timestamptz)
returns table (
  current_streak integer, longest_streak integer, stage public.diken_stage, wilted boolean,
  done_today integer, total_today integer, free_rescue_available boolean
)
language sql stable security definer set search_path = '' as $$
  with s as (select app.user_streak(p_user, p_at) as cur),
  today as (
    select count(*)::int as total, (count(*) filter (where tt.done))::int as done
    from app.today_tasks(p_user, p_at) tt
  )
  select s.cur,
         greatest(app.user_longest_streak(p_user, p_at), s.cur),
         public.diken_stage_for(s.cur),
         exists (select 1 from app.pending_rescues(p_user, p_at)),
         today.done, today.total,
         app.free_rescue_available(p_user, p_at)
  from s, today
$$;

create function public.my_streak()
returns table (
  current_streak integer, longest_streak integer, stage public.diken_stage, wilted boolean,
  done_today integer, total_today integer, free_rescue_available boolean
)
language sql stable security definer set search_path = '' as $$
  select * from app.streak_summary(app.require_user(), now())
$$;

-- StreakLost ekranı
create function public.my_pending_rescues()
returns table (
  challenge_id uuid, title text, missed_date date, streak_before integer, expires_at timestamptz,
  free_rescue_available boolean
)
language sql stable security definer set search_path = '' as $$
  with u as (select app.require_user() as uid)
  select pr.challenge_id, c.title, pr.missed_date, pr.streak_before, pr.expires_at,
         app.free_rescue_available(u.uid, now())
  from u
  cross join app.pending_rescues(u.uid, now()) pr
  join public.challenges c on c.id = pr.challenge_id
  order by pr.streak_before desc
$$;

-- Detail ekranı: grup, seriye göre sıralı -----------------------------------------------------

create function app.challenge_board(p_viewer uuid, p_challenge uuid, p_at timestamptz)
returns table (
  user_id uuid, display_name text, username text, avatar_path text, avatar_tint text,
  role public.member_role, streak integer, days_done integer, done_today boolean, rank integer
)
language sql stable security definer set search_path = '' as $$
  with members as (
    select m.user_id, m.role, m.joined_at, p.display_name, p.username::text as username,
           p.avatar_path, p.avatar_tint,
           app.challenge_streak(m.user_id, p_challenge, p_at) as streak,
           app.days_done(m.user_id, p_challenge) as days_done,
           app.is_covered(m.user_id, p_challenge, (app.open_dates(m.user_id, p_at))[1]) as done_today
    from public.challenge_members m
    join public.profiles p on p.id = m.user_id
    where m.challenge_id = p_challenge and m.status = 'active'
      and (m.user_id = p_viewer or not app.is_blocked(p_viewer, m.user_id))
  )
  select members.user_id, members.display_name, members.username, members.avatar_path,
         members.avatar_tint, members.role, members.streak, members.days_done, members.done_today,
         (row_number() over (order by members.streak desc, members.days_done desc, members.joined_at))::int
  from members
  where app.is_member(p_viewer, p_challenge)
  order by 10
$$;

create function public.challenge_board(p_challenge uuid)
returns table (
  user_id uuid, display_name text, username text, avatar_path text, avatar_tint text,
  role public.member_role, streak integer, days_done integer, done_today boolean, rank integer
)
language sql stable security definer set search_path = '' as $$
  select * from app.challenge_board(app.require_user(), p_challenge, now())
$$;

-- Arkadaşlar ekranı ve Bugün'deki arkadaş şeridi ------------------------------------------------
-- Arkadaşın durumu kendi yerel gününe göre. Ortak olmayan challenge'ların adı gösterilmez.

create function app.friends_today(p_viewer uuid, p_at timestamptz)
returns table (
  user_id uuid, display_name text, username text, avatar_path text, avatar_tint text,
  harsh_mode boolean, streak integer, done_today boolean, active_challenges integer,
  shared_challenge_id uuid, shared_challenge_title text
)
language sql stable security definer set search_path = '' as $$
  with friends as (
    select case when f.requester_id = p_viewer then f.addressee_id else f.requester_id end as friend_id
    from public.friendships f
    where f.status = 'accepted' and p_viewer in (f.requester_id, f.addressee_id)
  ),
  stats as (
    select fr.friend_id,
           (select count(*)::int from app.today_tasks(fr.friend_id, p_at)) as total,
           (select count(*)::int from app.today_tasks(fr.friend_id, p_at) tt where tt.done) as done
    from friends fr
    where not app.is_blocked(p_viewer, fr.friend_id)
  )
  select p.id, p.display_name, p.username::text, p.avatar_path, p.avatar_tint, p.harsh_mode,
         app.user_streak(p.id, p_at),
         case when s.total = 0 then null else s.done = s.total end,
         s.total,
         sc.id, sc.title
  from stats s
  join public.profiles p on p.id = s.friend_id
  left join lateral (
    select c.id, c.title
    from public.challenge_members a
    join public.challenge_members b on b.challenge_id = a.challenge_id
    join public.challenges c on c.id = a.challenge_id
    where a.user_id = p_viewer and b.user_id = p.id and a.status = 'active' and b.status = 'active'
      and app.local_date(p.id, p_at) between c.start_date and c.end_date
    order by b.joined_at
    limit 1
  ) as sc on true
  order by (case when s.total = 0 then null else s.done = s.total end) nulls last, p.display_name
$$;

create function public.friends_today()
returns table (
  user_id uuid, display_name text, username text, avatar_path text, avatar_tint text,
  harsh_mode boolean, streak integer, done_today boolean, active_challenges integer,
  shared_challenge_id uuid, shared_challenge_title text
)
language sql stable security definer set search_path = '' as $$
  select * from app.friends_today(app.require_user(), now())
$$;

-- Bahçe: tüm günleri kapsanarak bitirilen challenge'lar; kaktüs aşaması süreye göre --------------

create function public.my_garden()
returns table (
  challenge_id uuid, title text, short_title text, duration_days integer,
  stage public.diken_stage, finished_at timestamptz, final_rescues integer, final_rank integer
)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.short_title, c.duration_days::int,
         public.diken_stage_for(c.duration_days), m.finished_at, m.final_rescues::int, m.final_rank::int
  from public.challenge_members m
  join public.challenges c on c.id = m.challenge_id
  where m.user_id = app.require_user()
    and m.finished_at is not null
    and m.final_days_done >= c.duration_days
  order by m.finished_at desc
$$;

-- Keşfet / ChallengePreview: kaç kişi şu an yapıyor, hangi arkadaşlar ------------------------------

create function public.template_stats(p_template uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with viewer as (select auth.uid() as uid),
  running as (
    select distinct m.user_id
    from public.challenges c
    join public.challenge_members m on m.challenge_id = c.id and m.status = 'active'
    where c.template_id = p_template
      and current_date between c.start_date - 1 and c.end_date + 1
  ),
  friends as (
    select p.display_name, p.avatar_path, p.avatar_tint
    from running r
    cross join viewer v
    join public.profiles p on p.id = r.user_id
    where v.uid is not null and app.are_friends(v.uid, r.user_id) and not app.is_blocked(v.uid, r.user_id)
    order by p.display_name
  )
  select jsonb_build_object(
    'active_count', (select count(*) from running),
    'friends_count', (select count(*) from friends),
    'friends', coalesce((select jsonb_agg(to_jsonb(f)) from (select * from friends limit 2) f), '[]'::jsonb)
  )
$$;

-- InviteLanding (oturum açmadan): yalnızca davet kartında görünen alanlar ------------------------

create function public.get_invite_preview(p_code text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when i.code is null then null else jsonb_build_object(
    'inviter', jsonb_build_object(
      'display_name', ip.display_name, 'avatar_path', ip.avatar_path, 'avatar_tint', ip.avatar_tint
    ),
    'challenge', jsonb_build_object(
      'title', c.title, 'duration_days', c.duration_days, 'task_type', c.task_type,
      'start_date', c.start_date, 'end_date', c.end_date, 'icon', c.icon, 'tint', c.tint,
      'invite_message', c.invite_message
    ),
    'member_count', app.active_member_count(c.id),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('initial', left(mp.display_name, 1), 'avatar_tint', mp.avatar_tint)
                       order by mm.joined_at)
      from (
        select m.user_id, m.joined_at from public.challenge_members m
        where m.challenge_id = c.id and m.status = 'active'
        order by m.joined_at limit 5
      ) mm
      join public.profiles mp on mp.id = mm.user_id
    ), '[]'::jsonb),
    'already_member', auth.uid() is not null and app.is_active_member(auth.uid(), c.id)
  ) end
  from (select 1) as one
  left join public.challenge_invites i on i.code = p_code and i.revoked_at is null
  left join public.challenges c on c.id = i.challenge_id
  left join public.profiles ip on ip.id = i.inviter_id
  where i.code is null
     or (app.is_active_member(i.inviter_id, i.challenge_id)
         and (auth.uid() is null or not app.is_blocked(auth.uid(), i.inviter_id)))
  limit 1
$$;

-- Zamanlanmış işler (service role) ----------------------------------------------------------------

-- Diken bildirimi şimdi gönderilebilir mi: günde en fazla 2, sessiz saatler dışında (yerel)
create function app.can_send_diken_push(p_user uuid, p_at timestamptz) returns boolean
language sql stable security definer set search_path = '' as $$
  with t as (select (p_at at time zone app.user_timezone(p_user)) as local_ts)
  select not (t.local_ts::time >= app.quiet_hours_start() or t.local_ts::time < app.quiet_hours_end())
     and (
       select count(*) from public.notifications n
       where n.recipient_id = p_user and n.actor_id is null and n.pushed_at is not null
         and n.local_date = t.local_ts::date
     ) < app.diken_daily_limit()
  from t
$$;

create function public.can_send_diken_push(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.can_send_diken_push(p_user, now())
$$;

-- Süresi dolan tüm üyelikleri kapatır (pg_cron ile saatlik çağrılabilir)
create function public.finish_due_challenges() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select m.user_id, m.challenge_id
    from public.challenge_members m
    join public.challenges c on c.id = m.challenge_id
    where m.status = 'active' and m.finished_at is null and c.end_date < current_date
  loop
    if app.finalize_member(r.user_id, r.challenge_id, now()) then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end
$$;

-- Yetkiler ------------------------------------------------------------------------------------
-- Supabase yeni fonksiyonlara varsayılan olarak PUBLIC/anon/authenticated çalıştırma yetkisi
-- verir. Burada açıkça daraltılır.

-- Yazan ya da zamanı parametre alan app yardımcıları API rollerine kapalı (yalnızca definer
-- fonksiyonlar içinden çağrılır). RLS'te kullanılan okuma yardımcıları açık kalır.
revoke execute on function
  app.apply_rescue(uuid, uuid, date, public.rescue_method, text, timestamptz),
  app.finalize_member(uuid, uuid, timestamptz),
  app.finalize_user(uuid, timestamptz),
  app.do_send_poke(uuid, uuid, public.poke_tone, text, uuid, timestamptz),
  app.do_invite(uuid, uuid, uuid[], timestamptz),
  app.do_create_challenge(uuid, uuid, text, public.task_type, integer, date, time, text, text,
                          numeric, numeric, numeric, numeric, uuid[], timestamptz),
  app.do_respond_to_invite(uuid, uuid, boolean, timestamptz),
  app.do_leave_challenge(uuid, uuid, timestamptz),
  app.do_join_by_invite(uuid, text, timestamptz),
  app.do_checkin(uuid, uuid, numeric, text, text, date, timestamptz),
  app.do_undo_checkin(uuid, uuid, date, timestamptz),
  app.today_tasks(uuid, timestamptz),
  app.streak_summary(uuid, timestamptz),
  app.challenge_board(uuid, uuid, timestamptz),
  app.friends_today(uuid, timestamptz),
  app.pending_rescues(uuid, timestamptz),
  app.user_day_status(uuid, timestamptz),
  app.user_streak(uuid, timestamptz),
  app.user_longest_streak(uuid, timestamptz),
  app.challenge_streak(uuid, uuid, timestamptz),
  app.covered_run_ending(uuid, uuid, date),
  app.covered_dates(uuid, uuid),
  app.days_done(uuid, uuid),
  app.can_send_diken_push(uuid, timestamptz),
  app.random_code(integer)
from public, anon, authenticated;

-- Public RPC'ler: varsayılan yetkiyi kaldır, sonra rol rol aç
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.diken_stage_for(integer) to anon, authenticated;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
grant execute on function public.template_stats(uuid) to anon, authenticated;

grant execute on function
  public.is_username_available(text),
  public.complete_profile(text, text, integer, text, text),
  public.search_profiles(text, integer),
  public.send_friend_request(uuid),
  public.accept_friend_request(uuid),
  public.send_poke(uuid, public.poke_tone, text, uuid),
  public.submit_report(uuid, public.report_reason, text, boolean, public.report_target, uuid, uuid),
  public.mark_notifications_read(uuid[]),
  public.register_push_token(text, text),
  public.create_challenge(uuid, text, public.task_type, integer, date, time, text, text, numeric,
                          numeric, numeric, numeric, uuid[]),
  public.invite_to_challenge(uuid, uuid[]),
  public.respond_to_invite(uuid, boolean),
  public.leave_challenge(uuid),
  public.create_invite(uuid),
  public.revoke_invite(uuid),
  public.join_challenge_by_invite(text),
  public.checkin(uuid, numeric, text, text, date),
  public.undo_checkin(uuid, date),
  public.rescue_streak(uuid, date),
  public.my_today(),
  public.my_streak(),
  public.my_pending_rescues(),
  public.challenge_board(uuid),
  public.friends_today(),
  public.my_garden()
to authenticated;

-- Yalnızca sunucu (Edge Function / pg_cron)
grant execute on function
  public.grant_ad_rescue(uuid, uuid, date, text),
  public.can_send_diken_push(uuid),
  public.finish_due_challenges()
to service_role;

-- Bundan sonra eklenecek fonksiyonlar da varsayılan olarak kapalı başlasın. PUBLIC'e verilen
-- yetki şemaya özel değil, globaldir; anon/authenticated'a verilen ise Supabase'in public şeması
-- varsayılanıdır. (app şemasındaki açık varsayılan yetkiler RLS yardımcıları için korunur.)
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
