'use client';
import React from 'react';
import { Languages, Moon, Music, Sun, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { Locale } from '@/i18n/messages';
import { useApp } from '../app/context';
import { PageHeader, SectionHeader } from '../ds/States';
import { NativeReminder } from '../atelier/NativeReminder';

const LOCALES: [Locale, string][] = [['en', 'English'], ['nl', 'Nederlands'], ['es', 'Español']];

/** Sound, music, language, theme, the daily reminder (in the app) and optional measurements. */
export function SettingsPage() {
  const { t, locale, setLocale, theme, setTheme, muted, toggleSound, music, toggleMusic, measurement, setMeasurement } = useApp();
  return <div className="page settings-page">
    <PageHeader kicker={t('menuSettingsNote')} title={t('settingsTitle')}/>

    <section className="page-section" aria-labelledby="settings-sound">
      <SectionHeader id="settings-sound" title={t('settingsSoundTitle')}/>
      <div className="settings-card">
        <div className="settings-card-row"><Volume2 size={19} aria-hidden="true"/><label htmlFor="set-effects"><strong>{t('settingsEffects')}</strong><small>{t('settingsEffectsCopy')}</small></label><Switch id="set-effects" checked={!muted} onCheckedChange={toggleSound}/></div>
        <div className="settings-card-row"><Music size={19} aria-hidden="true"/><label htmlFor="set-music"><strong>{t('settingsMusic')}</strong><small>{t('settingsMusicCopy')}</small></label><Switch id="set-music" checked={!!music} onCheckedChange={toggleMusic}/></div>
      </div>
    </section>

    <section className="page-section" aria-labelledby="settings-look">
      <SectionHeader id="settings-look" title={t('settingsLookTitle')}/>
      <div className="settings-card settings-card-pad">
        <p className="settings-label" id="settings-language"><Languages size={17} aria-hidden="true"/>{t('settingsLanguage')}</p>
        <div className="segmented" role="group" aria-labelledby="settings-language">{LOCALES.map(([code, label]) => <button key={code} aria-pressed={locale === code} lang={code} onClick={() => setLocale(code)}>{label}</button>)}</div>
        <p className="settings-label" id="settings-theme">{t('settingsTheme')}</p>
        <div className="segmented" role="group" aria-labelledby="settings-theme">
          <button aria-pressed={theme !== 'dark'} onClick={() => setTheme('light')}><Sun size={16} aria-hidden="true"/>{t('settingsLight')}</button>
          <button aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={16} aria-hidden="true"/>{t('settingsDark')}</button>
        </div>
      </div>
    </section>

    <NativeReminder t={t}/>

    <section className="page-section" aria-labelledby="settings-privacy">
      <SectionHeader id="settings-privacy" title={t('privacy')}/>
      <div className="settings-card">
        <div className="settings-card-row"><span className="row-icon" aria-hidden="true"/><label htmlFor="metrics-choice"><strong>{t('optionalMetrics')}</strong><small>{t('optionalMetricsCopy')}</small></label><Switch id="metrics-choice" checked={measurement} onCheckedChange={setMeasurement}/></div>
      </div>
    </section>
  </div>;
}
