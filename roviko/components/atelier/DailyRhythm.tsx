import React from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import type { Locale } from '@/i18n/messages';

type Day = { date: string; completed: boolean };
type Topic = { emoji: string; label: Record<Locale, string> };

/** Saved daily completions only; a quiet invitation, with nothing to lose. */
export function DailyRhythm({ week, date, tomorrowTopic, locale, t, frozen = [] }: {
  week: Day[];
  /** Days on which a streak freeze kept the streak alive. */
  frozen?: string[];
  date: string;
  tomorrowTopic: Topic;
  locale: Locale;
  t: (key: string) => string;
}) {
  const completed = week.filter(day => day.completed).length;
  return <div className="daily-return-shelf">
    <section className="discovery-week" aria-label={t('discoveryWeek')}>
      <div className="discovery-week-heading"><strong>{t('discoveryWeek')}</strong><span>{t('weekPlayed').replace('{n}', String(completed))}</span></div>
      <ol className="week-stamps">
        {week.map(day => {
          const value = new Date(day.date + 'T12:00:00Z');
          const label = value.toLocaleDateString(locale, { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' });
          const saved = !day.completed && frozen.includes(day.date);
          return <li key={day.date} className={(day.completed ? 'played ' : '') + (saved ? 'frozen ' : '') + (day.date === date ? 'is-today' : '')}>
            <time dateTime={day.date} aria-current={day.date === date ? 'date' : undefined} aria-label={label + ' · ' + t(day.completed ? 'dailyDoneState' : saved ? 'freezeDay' : 'puzzleOpen')}>
              <span className="week-day" aria-hidden="true">{value.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</span>
              <span className="week-stamp" aria-hidden="true">{day.completed ? <Check size={17} strokeWidth={2.5}/> : saved ? <ShieldCheck size={16} strokeWidth={2.5}/> : value.getUTCDate()}</span>
            </time>
          </li>;
        })}
      </ol>
    </section>
    <aside className="tomorrow-preview" aria-label={t('tomorrowInCompare')}>
      <span className="tomorrow-emoji" aria-hidden="true">{tomorrowTopic.emoji}</span>
      <div><span className="tomorrow-kicker"><Sparkles size={13} aria-hidden="true"/>{t('tomorrowInCompare')}</span><strong>{tomorrowTopic.label[locale]}</strong><p>{t('tomorrowInvitation')}</p></div>
    </aside>
  </div>;
}
