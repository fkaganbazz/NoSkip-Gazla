-- Gazla veri modeli · 10/10 — uygulamanın dayandığı referans veri (prod'da da gerekli).
--
-- Dürtme mesajları: design/Poke.dc.html. Katalog: PickChallenge, Explore, ChallengePreview,
-- InviteLanding, NumberEntry, Today ve Garden ekranlarındaki örnekler.
-- İngilizce metinler henüz tasarlanmadı (null). Zorluk değeri tasarımda görünmeyen şablonlar için
-- tahminidir: plank, okuma, harcama, şekersiz (supabase/README.md).

insert into public.poke_messages (key, tone, sort_order, text_tr) values
  ('almost_there',      'hype',  0, 'Az kaldı, bırakma!'),
  ('streak_going_well', 'hype',  1, 'Serin çok iyi gidiyor'),
  ('finish_together',   'hype',  2, 'Beraber bitireceğiz'),
  ('take_five',         'hype',  3, '5 dakikanı ayır, hallet'),
  ('proud_of_you',      'hype',  4, 'Seninle gurur duyuyorum'),
  ('diken_waiting',     'hype',  5, 'Diken seni bekliyor'),
  ('cactus_faster',     'roast', 0, 'Kaktüs bile senden hızlı büyüyor'),
  ('phone_in_hand',     'roast', 1, 'Telefon elinde, challenge nerede?'),
  ('diken_thirsty',     'roast', 2, 'Diken susuz kaldı, haberin olsun'),
  ('today_tomorrow',    'roast', 3, 'Bugün mü, yarın mı, seneye mi?'),
  ('streak_crying',     'roast', 4, 'Serin şu an ağlıyor'),
  ('i_did_it',          'roast', 5, 'Ben yaptım. Sen?');

insert into public.challenge_templates (
  slug, title_tr, short_title_tr, description_tr, category, difficulty, task_type,
  default_duration_days, icon, tint, number_unit, number_base_target, number_daily_increment,
  number_step, number_max, onboarding_order
) values
  ('kahvesiz', '7 gün kahvesiz', 'kahvesiz',
   'Kahveyi bir süreliğine bırak. İlk üç gün zor geçer, sonrası kolaylaşır. Söz vermiyoruz ama muhtemelen.',
   'food_drink', 'medium', 'check', 7, 'coffee', 'butter', null, null, 0, null, null, 1),
  ('telefonsuz-sabah', 'Uyanınca 1 saat telefonsuz', 'telefonsuz sabah', null,
   'detox', 'medium', 'check', 30, 'phoneOff', 'lilac', null, null, 0, null, null, 2),
  ('iltifat', 'Her gün birine iltifat et', 'iltifat', null,
   'social_courage', 'hard', 'check', 7, 'chatHeart', 'peach', null, null, 0, null, null, 3),
  ('plank', 'Plank: her gün +5 saniye', 'plank', null,
   'sport', 'medium', 'number', 10, 'timer', 'green', 'sn', 60, 5, 5, 600, 4),
  ('20-sayfa', 'Her gün 20 sayfa oku', 'okuma', null,
   'reading', 'easy', 'photo', 30, 'book', 'rose', null, null, 0, null, null, 5),
  ('harcamasiz', 'Gereksiz harcama yok', null, null,
   'money', 'medium', 'check', 7, 'wallet', 'teal', null, null, 0, null, null, 6),
  ('ters-el', 'Ters elle diş fırçala', null, null,
   'quirky', 'easy', 'check', 10, 'toothbrush', 'sky', null, null, 0, null, null, null),
  ('sekersiz', '10 gün şekersiz', 'şekersiz', null,
   'food_drink', 'medium', 'check', 10, 'candy', 'butter', null, null, 0, null, null, null);
