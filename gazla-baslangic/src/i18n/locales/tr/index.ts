/** Sözlük: her ad alanı kendi dosyasında (ekran grubu başına). Yeni ad alanını buraya ekle. */
import { common } from './common';
import { auth } from './auth';
import { onboarding } from './onboarding';
import { invite } from './invite';
import { today } from './today';
import { checkin } from './checkin';
import { moments } from './moments';
import { streakLost } from './streakLost';
import { adConsent } from './adConsent';
import { explore } from './explore';
import { create } from './create';
import { challenge } from './challenge';
import { friends } from './friends';
import { poke } from './poke';
import { activity } from './activity';
import { garden } from './garden';
import { report } from './report';
import { profile } from './profile';
import { settings } from './settings';
import { components } from './components';
import { tabs } from './tabs';
import { notifications } from './notifications';
import { errors } from './errors';
import { serverErrors } from './serverErrors';

export const tr = {
  common,
  auth,
  onboarding,
  invite,
  today,
  checkin,
  moments,
  streakLost,
  adConsent,
  explore,
  create,
  challenge,
  friends,
  poke,
  activity,
  garden,
  report,
  profile,
  settings,
  components,
  tabs,
  notifications,
  errors,
  serverErrors,
};

/** Bütün metinler (Türkçe sözlüğün biçimi; İngilizce aynı biçimde olmak zorunda) */
export type Messages = typeof tr;
