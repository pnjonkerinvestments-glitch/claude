'use client';
import React, { useEffect, useState } from 'react';
import { RovikoIcon } from '../ds/RovikoIcons';
import { isNativeApp } from '@/lib/haptics';
import { readPreference, writePreference } from '@/lib/client';
import { Switch } from '@/components/ui/switch';
import type { Locale } from '@/i18n/messages';
import { useApp } from '../app/context';
import { PageHeader, SectionHeader } from '../ds/States';
import { NativeReminder } from '../atelier/NativeReminder';

const LOCALES: [Locale, string][] = [['en', 'English'], ['nl', 'Nederlands'], ['es', 'Español']];

/** Sound, music, language, theme, the daily reminder (in the app) and optional measurements. */
export function SettingsPage() {
  const { t, locale, setLocale, muted, toggleSound, music, toggleMusic, measurement, setMeasurement } = useApp();
  // Vibration only exists in the iOS/Android app; decided after mounting so the server render stays the same.
  const [app, setApp] = useState(false), [haptics, setHaptics] = useState(true);
  useEffect(() => { setApp(isNativeApp()); setHaptics(readPreference('rv_haptics', 'on') === 'on'); }, []);
  const toggleHaptics = (on: boolean) => { setHaptics(on); writePreference('rv_haptics', on ? 'on' : 'off'); };
  return <div className="page settings-page trip-page">
    <PageHeader title={t('settingsTitle')} lead={t('menuSettingsNote')}/>

    <section className="page-section" aria-labelledby="settings-sound">
      <SectionHeader id="settings-sound" title={t('settingsSoundTitle')}/>
      <div className="settings-card">
        <div className="settings-card-row"><RovikoIcon name="sound" size={22} className="row-icon"/><label htmlFor="set-effects"><strong>{t('settingsEffects')}</strong><small>{t('settingsEffectsCopy')}</small></label><Switch id="set-effects" checked={!muted} onCheckedChange={toggleSound}/></div>
        <div className="settings-card-row"><RovikoIcon name="music" size={22} className="row-icon"/><label htmlFor="set-music"><strong>{t('settingsMusic')}</strong><small>{t('settingsMusicCopy')}</small></label><Switch id="set-music" checked={!!music} onCheckedChange={toggleMusic}/></div>
        {app && <div className="settings-card-row"><RovikoIcon name="phone" size={22} className="row-icon"/><label htmlFor="set-haptics"><strong>{t('settingsHaptics')}</strong><small>{t('settingsHapticsCopy')}</small></label><Switch id="set-haptics" checked={haptics} onCheckedChange={toggleHaptics}/></div>}
      </div>
    </section>

    <section className="page-section" aria-labelledby="settings-look">
      <SectionHeader id="settings-look" title={t('settingsLookTitle')}/>
      <div className="settings-card settings-card-pad">
        <p className="settings-label" id="settings-language"><RovikoIcon name="language" size={22}/>{t('settingsLanguage')}</p>
        <div className="segmented" role="group" aria-labelledby="settings-language">{LOCALES.map(([code, label]) => <button key={code} aria-pressed={locale === code} lang={code} onClick={() => setLocale(code)}>{label}</button>)}</div>
      </div>
    </section>

    <NativeReminder t={t}/>

    <section className="page-section" aria-labelledby="settings-privacy">
      <SectionHeader id="settings-privacy" title={t('privacy')}/>
      <div className="settings-card">
        <div className="settings-card-row"><RovikoIcon name="chart" size={22} className="row-icon"/><label htmlFor="metrics-choice"><strong>{t('optionalMetrics')}</strong><small>{t('optionalMetricsCopy')}</small></label><Switch id="metrics-choice" checked={measurement} onCheckedChange={setMeasurement}/></div>
      </div>
    </section>
  </div>;
}
