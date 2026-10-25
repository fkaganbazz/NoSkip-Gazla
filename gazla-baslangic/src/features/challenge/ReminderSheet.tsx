import { useMemo } from 'react';

import OptionSheet from '@/components/OptionSheet';
import { reminderTimes } from '@/features/settings/logic';
import { useT } from '@/i18n';

import { hhmm } from './logic';

/** "Grubun saati" seçeneğinin değeri: kişisel saat silinir (`time: null`) */
const GROUP = 'group';

type Props = {
  visible: boolean;
  /** Grubun hatırlatma saati 'HH:MM' (challenges.reminder_time; null = grupta hatırlatma yok) */
  groupTime: string | null;
  /** Kişisel saat 'HH:MM' (null = grubun saati kullanılıyor) */
  personalTime: string | null;
  /** Seçilen saat; null = grubun saatine dön */
  onSelect: (time: string | null) => void;
  onClose: () => void;
};

/**
 * Detail "…" → Hatırlatma saatini değiştir. Ayarlar'daki saat seçiciyle aynı dil ve aynı saatler (ortak
 * `OptionSheet`, `reminderTimes`): en üstte "Grubun saati (HH:MM)" (kişisel saati sıfırlar), altında 08:00–23:00
 * arası 30 dakikalık adımlar. Seçince kapanır.
 */
export default function ReminderSheet({ visible, groupTime, personalTime, onSelect, onClose }: Props) {
  const t = useT();
  const options = useMemo(
    () => [
      {
        value: GROUP,
        label: t.challenge.reminderSheet.groupTime(groupTime ? hhmm(groupTime) : null),
        detail: t.challenge.reminderSheet.groupTimeDetail,
      },
      ...reminderTimes(personalTime).map((time) => ({ value: time, label: time })),
    ],
    [groupTime, personalTime, t],
  );

  return (
    <OptionSheet
      visible={visible}
      title={t.challenge.reminderSheet.title}
      options={options}
      value={personalTime ? hhmm(personalTime) : GROUP}
      onSelect={(value) => onSelect(value === GROUP ? null : value)}
      onClose={onClose}
    />
  );
}
