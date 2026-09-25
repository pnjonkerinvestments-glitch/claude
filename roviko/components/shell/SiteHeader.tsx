'use client';
import React from 'react';
import { BookOpen, ChevronRight, Compass, Flame, HelpCircle, Home, LogIn, Menu, Settings2, Swords, Trophy, UserRound, Users, Play, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BRAND } from '@/lib/config';
import { useApp } from '../app/context';
import { A, Avatar, Logo } from '../app/shared';

const NAV = [
  { href: '/', key: 'play', icon: Play, match: (p: string) => p === '/' || p === '/daily' || p.startsWith('/duel') || p.startsWith('/game') || p.startsWith('/puzzle') || p.startsWith('/rank/') },
  { href: '/explore', key: 'explore', icon: Compass, match: (p: string) => p === '/explore' },
  { href: '/multiplayer', key: 'navMultiplayer', icon: Swords, match: (p: string) => p === '/multiplayer' || p === '/friends' || p.startsWith('/room') },
] as const;

/**
 * The menu behind the burger: your account, friends and settings, plus the pages that are not
 * in the tab bar. Language, theme and sound live on the settings page.
 */
function AppMenu() {
  const { t, boot, bootLoaded, setModal } = useApp();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const u = boot.user;
  const item = (href: string, Icon: typeof Users, label: string, note?: string) => <A href={href} onClick={close}><Icon size={19} aria-hidden="true"/><span><strong>{label}</strong>{note && <small>{note}</small>}</span><ChevronRight size={17} aria-hidden="true" className="menu-chevron"/></A>;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button className="icon-btn nav-icon" aria-label={t('menuOpen')}><Menu size={21} aria-hidden="true"/></button></PopoverTrigger>
    <PopoverContent align="end" className="settings-menu app-menu">
      {bootLoaded && <div className="app-menu-user">
        <Avatar id={u.avatar}/>
        <span><strong>{u.name}</strong><small>{u.guest ? t('menuGuest') : u.email}</small></span>
        {u.guest && <button className="btn primary btn-sm" onClick={() => { close(); setModal('login'); }}><LogIn size={15} aria-hidden="true"/>{t('signIn')}</button>}
      </div>}
      <nav className="settings-links app-menu-links" aria-label={t('navMore')}>
        {item('/account', UserRound, t('myAccount'), t('myAccountNote'))}
        {item('/friends', Users, t('friendsList'), t('menuFriendsNote'))}
        {item('/settings', Settings2, t('settingsTitle'), t('menuSettingsNote'))}
        <hr/>
        {item('/leaderboard', Trophy, t('leaderboard'))}
        <A href="/" onClick={() => { close(); try { sessionStorage.setItem('roviko:tour-open', '1'); } catch { /* ignore */ } window.dispatchEvent(new Event('roviko:tour')); }}><Compass size={19} aria-hidden="true"/><span><strong>{t('menuTour')}</strong><small>{t('menuTourNote')}</small></span><ChevronRight size={17} aria-hidden="true" className="menu-chevron"/></A>
        {item('/how-to-play', HelpCircle, t('howToLink'))}
        {item('/scoring', Sparkles, t('scoringLink'))}
      </nav>
    </PopoverContent>
  </Popover>;
}

export function SiteHeader({ path, hideTabs }: { path: string; hideTabs: boolean }) {
  const { t, boot, bootLoaded } = useApp();
  const streak = boot.stats.dailyStreak ?? 0;
  const passportActive = path === '/profile';
  return <>
    <header className={"topbar" + (hideTabs ? " is-game" : "")}>
      <div className="topbar-inner">
        <A href="/" className="topbar-logo" aria-label={BRAND.name}><Logo/></A>
        <nav className="topnav" aria-label={t('navigationLabel')}>
          {NAV.map(item => { const active = item.match(path); return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>{t(item.key)}</A>; })}
        </nav>
        <div className="topbar-right">
          {bootLoaded && <A href="/profile" className={'streak-chip' + (streak > 0 ? ' is-on' : '')} aria-label={streak > 0 ? t('statusStreak').replace('{n}', String(streak)) : t('statusStreakZero')}><Flame size={17} strokeWidth={2.4} aria-hidden="true"/><b>{streak}</b></A>}
          <AppMenu/>
          <A href="/profile" className={'passport-link' + (passportActive ? ' is-active' : '')} aria-current={passportActive ? 'page' : undefined} aria-label={t('navPassport')}>
            {bootLoaded && !boot.user.guest ? <Avatar id={boot.user.avatar}/> : <span className="passport-icon" aria-hidden="true"><BookOpen size={18}/></span>}
            <span className="passport-label">{bootLoaded && !boot.user.guest ? boot.user.name : t('navPassport')}</span>
          </A>
        </div>
      </div>
    </header>
    {/* On phones the top bar is hidden in games; screens without their own exit (lobby, match results) still get a way home. */}
    {hideTabs && <A href="/" className="game-home-fab" aria-label={t('backHome')}><Home size={20} aria-hidden="true"/></A>}
    {!hideTabs && <nav className="tabbar" aria-label={t('navigationLabel')}>
      {[...NAV, { href: '/profile', key: 'navPassport', icon: BookOpen, match: (p: string) => p === '/profile' }].map(item => { const active = item.match(path); const Icon = item.icon; return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}><Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true"/><span>{t(item.key)}</span></A>; })}
    </nav>}
  </>;
}
