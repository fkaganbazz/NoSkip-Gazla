-- Supabase güvenlik denetimi (function_search_path_mutable): sabit ve yardımcı app.* fonksiyonlarına boş
-- search_path. Gövdeleri yalnızca yerleşik fonksiyon ve sabit kullanır (pg_catalog her zaman çözülür).
alter function app.ad_rescue_failure_ttl() set search_path = '';
alter function app.badge_goal(text) set search_path = '';
alter function app.challenge_invite_daily_limit() set search_path = '';
alter function app.contact_hash_limit() set search_path = '';
alter function app.contact_lookup_daily_limit() set search_path = '';
alter function app.day_ending_time() set search_path = '';
alter function app.default_timezone() set search_path = '';
alter function app.diken_daily_limit() set search_path = '';
alter function app.diken_push_window() set search_path = '';
alter function app.early_bird_window() set search_path = '';
alter function app.friend_request_daily_limit() set search_path = '';
alter function app.grace_period() set search_path = '';
alter function app.is_reserved_display_name(text) set search_path = '';
alter function app.is_reserved_username(text) set search_path = '';
alter function app.max_active_challenges() set search_path = '';
alter function app.max_members() set search_path = '';
alter function app.min_age() set search_path = '';
alter function app.poke_daily_limit() set search_path = '';
alter function app.poke_undo_window() set search_path = '';
alter function app.quiet_hours_end() set search_path = '';
alter function app.quiet_hours_start() set search_path = '';
alter function app.report_daily_limit() set search_path = '';
alter function app.rescue_window() set search_path = '';
alter function app.streak_broken_time() set search_path = '';
