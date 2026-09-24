'use client';
import React from 'react';
import { BookOpen, Compass, Flame, HelpCircle, LogIn, Moon, Settings2, Sun, Trophy, Users, Volume2, VolumeX, Play, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BRAND } from '@/lib/config';
import type { Locale } from '@/i18n/messages';
import { useApp } from '../app/context';
import { A, Avatar, Logo } from '../app/shared';

const NAV = [
  { href: '/', key: 'play', icon: Play, match: (p: string) => p === '/' || p === '/daily' || p === '/duel' || p.startsWith('/game') || p.startsWith('/puzzle') || p.startsWith('/rank/') },
  { href: '/explore', key: 'explore', icon: Compass, match: (p: string) => p === '/explore' },
  { href: '/multiplayer', key: 'navFriends', icon: Users, match: (p: string) => p === '/multiplayer' || p === '/friends' || p.startsWith('/room') },
] as const;
const LOCALES: [Locale, string][] = [['en', 'English'], ['nl', 'Nederlands'], ['es', 'Español']];

/** Language, theme and sound in one small menu, plus the pages that are not in the main navigation. */
function SettingsMenu() {
  const { t, locale, setLocale, theme, setTheme, muted, toggleSound, boot, setModal } = useApp();
  return <Popover>
    <PopoverTrigger asChild><button className="icon-btn nav-icon" aria-label={t('settingsTitle')}><Settings2 size={20} aria-hidden="true"/></button></PopoverTrigger>
    <PopoverContent align="end" className="settings-menu">
      <p className="settings-label" id="settings-language">{t('settingsLanguage')}</p>
      <div className="segmented" role="group" aria-labelledby="settings-language">{LOCALES.map(([code, label]) => <button key={code} aria-pressed={locale === code} lang={code} onClick={() => setLocale(code)}>{label}</button>)}</div>
      <p className="settings-label" id="settings-theme">{t('settingsTheme')}</p>
      <div className="segmented" role="group" aria-labelledby="settings-theme">
        <button aria-pressed={theme !== 'dark'} onClick={() => setTheme('light')}><Sun size={16} aria-hidden="true"/>{t('settingsLight')}</button>
        <button aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={16} aria-hidden="true"/>{t('settingsDark')}</button>
      </div>
      <button className="settings-row" role="switch" aria-checked={!muted} onClick={toggleSound}>{muted ? <VolumeX size={18} aria-hidden="true"/> : <Volume2 size={18} aria-hidden="true"/>}<span>{t('settingsSound')}</span><span className="switch-dot" aria-hidden="true"/></button>
      <hr/>
      <nav className="settings-links" aria-label={t('navMore')}>
        <A href="/how-to-play"><HelpCircle size={18} aria-hidden="true"/>{t('howToLink')}</A>
        <A href="/scoring"><Sparkles size={18} aria-hidden="true"/>{t('scoringLink')}</A>
        <A href="/leaderboard"><Trophy size={18} aria-hidden="true"/>{t('leaderboard')}</A>
        {boot.user.guest && <button onClick={() => setModal('login')}><LogIn size={18} aria-hidden="true"/>{t('signIn')}</button>}
      </nav>
    </PopoverContent>
  </Popover>;
}

export function SiteHeader({ path, hideTabs }: { path: string; hideTabs: boolean }) {
  const { t, boot, bootLoaded } = useApp();
  const streak = boot.stats.dailyStreak ?? 0;
  const passportActive = path === '/profile';
  return <>
    <header className="topbar">
      <div className="topbar-inner">
        <A href="/" className="topbar-logo" aria-label={BRAND.name}><Logo/></A>
        <nav className="topnav" aria-label={t('navigationLabel')}>
          {NAV.map(item => { const active = item.match(path); return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>{t(item.key)}</A>; })}
        </nav>
        <div className="topbar-right">
          {bootLoaded && <A href="/profile" className={'streak-chip' + (streak > 0 ? ' is-on' : '')} aria-label={streak > 0 ? t('statusStreak').replace('{n}', String(streak)) : t('statusStreakZero')}><Flame size={17} strokeWidth={2.4} aria-hidden="true"/><b>{streak}</b></A>}
          <SettingsMenu/>
          <A href="/profile" className={'passport-link' + (passportActive ? ' is-active' : '')} aria-current={passportActive ? 'page' : undefined} aria-label={t('navPassport')}>
            {bootLoaded && !boot.user.guest ? <Avatar id={boot.user.avatar}/> : <span className="passport-icon" aria-hidden="true"><BookOpen size={18}/></span>}
            <span className="passport-label">{bootLoaded && !boot.user.guest ? boot.user.name : t('navPassport')}</span>
          </A>
        </div>
      </div>
    </header>
    {!hideTabs && <nav className="tabbar" aria-label={t('navigationLabel')}>
      {[...NAV, { href: '/profile', key: 'navPassport', icon: BookOpen, match: (p: string) => p === '/profile' }].map(item => { const active = item.match(path); const Icon = item.icon; return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}><Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true"/><span>{t(item.key)}</span></A>; })}
    </nav>}
  </>;
}
