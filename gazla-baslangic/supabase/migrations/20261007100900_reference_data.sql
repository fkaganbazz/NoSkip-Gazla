-- Gazla veri modeli · 10/11 — uygulamanın dayandığı referans veri (prod'da da gerekli).
--
-- Dürtme mesajları: design/Poke.dc.html. Katalog: PickChallenge, Explore, ChallengePreview,
-- InviteLanding, NumberEntry, Today ve Garden ekranlarındaki örnekler.
-- İngilizce metinler (NoSkip) istemcideki kopyalarıyla aynı: dürtme mesajları src/content/pokes.ts
-- (`textEn`), şablonlar src/data/mock/seedEn.ts (`templateEn`). Zorluk değeri tasarımda görünmeyen
-- şablonlar için tahminidir: plank, okuma, harcama, şekersiz (supabase/README.md).

insert into public.poke_messages (key, tone, sort_order, text_tr, text_en) values
  ('almost_there',      'hype',  0, 'Az kaldı, bırakma!',                'So close, don''t quit!'),
  ('streak_going_well', 'hype',  1, 'Serin çok iyi gidiyor',             'Your streak is on fire'),
  ('finish_together',   'hype',  2, 'Beraber bitireceğiz',               'We''ll finish together'),
  ('take_five',         'hype',  3, '5 dakikanı ayır, hallet',           '5 minutes, get it done'),
  ('proud_of_you',      'hype',  4, 'Seninle gurur duyuyorum',           'So proud of you'),
  ('diken_waiting',     'hype',  5, 'Diken seni bekliyor',               'Diken''s waiting for you'),
  ('cactus_faster',     'roast', 0, 'Kaktüs bile senden hızlı büyüyor',  'Even cacti grow faster than you'),
  ('phone_in_hand',     'roast', 1, 'Telefon elinde, challenge nerede?', 'Phone in hand, but no challenge?'),
  ('diken_thirsty',     'roast', 2, 'Diken susuz kaldı, haberin olsun',  'Diken''s thirsty, just saying'),
  ('today_tomorrow',    'roast', 3, 'Bugün mü, yarın mı, seneye mi?',    'Today, tomorrow, or next year?'),
  ('streak_crying',     'roast', 4, 'Serin şu an ağlıyor',               'Your streak is crying'),
  ('i_did_it',          'roast', 5, 'Ben yaptım. Sen?',                  'I did mine. You?');

-- allowed_durations: ChallengePreview'da seçilebilen süreler (kahvesiz tasarımdaki gibi 7/10/30). Sabah
-- alışkanlığı, okuma ve artan plank kısa sürede oturmaz (10/30); zor sosyal ve tuhaf olanlar kısa (7/10).
-- İngilizce kısa ad da cümle içinde kullanılır ("coffee detox is waiting for you", "7-day plank"):
-- küçük harfli, tekil ad öbeği. number_unit_en yalnızca sayı türünde ('sn' → 'sec').
insert into public.challenge_templates (
  slug, title_tr, short_title_tr, description_tr, title_en, short_title_en, description_en,
  category, difficulty, task_type, default_duration_days, allowed_durations, icon, tint,
  number_unit, number_unit_en, number_base_target, number_daily_increment, number_step, number_max,
  onboarding_order
) values
  ('kahvesiz', '7 gün kahvesiz', 'kahvesiz',
   'Kahveyi bir süreliğine bırak. İlk üç gün zor geçer, sonrası kolaylaşır. Söz vermiyoruz ama muhtemelen.',
   '7-day coffee detox', 'coffee detox',
   'Quit coffee for a while. The first three days are rough, then it gets easier. No promises, but probably.',
   'food_drink', 'medium', 'check', 7, '{7,10,30}', 'coffee', 'butter', null, null, null, 0, null, null, 1),
  ('telefonsuz-sabah', 'Uyanınca 1 saat telefonsuz', 'telefonsuz sabah', null,
   'Phone-free first hour', 'phone-free morning', null,
   'detox', 'medium', 'check', 30, '{10,30}', 'phoneOff', 'lilac', null, null, null, 0, null, null, 2),
  ('iltifat', 'Her gün birine iltifat et', 'iltifat', null,
   'A compliment a day', 'compliment duty', null,
   'social_courage', 'hard', 'check', 7, '{7,10}', 'chatHeart', 'peach', null, null, null, 0, null, null, 3),
  ('plank', 'Plank: her gün +5 saniye', 'plank', null,
   'Plank: +5 seconds a day', 'plank', null,
   'sport', 'medium', 'number', 10, '{10,30}', 'timer', 'green', 'sn', 'sec', 60, 5, 5, 600, 4),
  ('20-sayfa', 'Her gün 20 sayfa oku', 'okuma', null,
   'Read 20 pages a day', 'reading', null,
   'reading', 'easy', 'photo', 30, '{10,30}', 'book', 'rose', null, null, null, 0, null, null, 5),
  ('harcamasiz', 'Gereksiz harcama yok', null, null,
   'No pointless spending', null, null,
   'money', 'medium', 'check', 7, '{7,10,30}', 'wallet', 'teal', null, null, null, 0, null, null, 6),
  ('ters-el', 'Ters elle diş fırçala', null, null,
   'Brush teeth, wrong hand', null, null,
   'quirky', 'easy', 'check', 10, '{7,10}', 'toothbrush', 'sky', null, null, null, 0, null, null, null),
  ('sekersiz', '10 gün şekersiz', 'şekersiz', null,
   '10-day sugar detox', 'sugar detox', null,
   'food_drink', 'medium', 'check', 10, '{7,10,30}', 'candy', 'butter', null, null, null, 0, null, null, null);
