'use client';
import { plural } from '@/lib/plural';
import React from 'react';
import { ChevronRight, Home, LogIn, Menu } from 'lucide-react';
import { RovikoIcon, type RovikoIconName } from '../ds/RovikoIcons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BRAND } from '@/lib/config';
import { useApp } from '../app/context';
import { A, Avatar, Logo } from '../app/shared';
import { FlameMark } from '../ds/Coin';
import { useFriendRequests } from '../friends/Friends';

/** A red count on Multiplayer when friend requests wait (1.28). */
function RequestBadge({ n, label }: { n: number; label: string }) {
  return n > 0 ? <span className="nav-badge" role="status" aria-label={label}>{n > 9 ? '9+' : n}</span> : null;
}

const NAV = [
  { href: '/', key: 'play', icon: 'play' as RovikoIconName, match: (p: string) => p === '/' || p === '/daily' || p.startsWith('/duel') || p.startsWith('/game') || p.startsWith('/puzzle') || p.startsWith('/rank/') },
  { href: '/explore', key: 'explore', icon: 'explore' as RovikoIconName, match: (p: string) => p === '/explore' },
  { href: '/multiplayer', key: 'navMultiplayer', icon: 'multiplayer' as RovikoIconName, match: (p: string) => p === '/multiplayer' || p === '/friends' || p.startsWith('/room') },
] as const;

/**
 * The menu behind the burger: your account, friends and settings, plus the pages that are not
 * in the tab bar. Language, theme and sound live on the settings page.
 */
function AppMenu() {
  const { t, boot, bootLoaded, setModal } = useApp();
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  const u = boot.user, requests = useFriendRequests();
  const item = (href: string, icon: RovikoIconName, label: string, note?: string) => <A href={href} onClick={close}><RovikoIcon name={icon} size={22}/><span><strong>{label}</strong>{note && <small>{note}</small>}</span><ChevronRight size={17} aria-hidden="true" className="menu-chevron"/></A>;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button className="icon-btn nav-icon" aria-label={t('menuOpen')}><Menu size={21} aria-hidden="true"/></button></PopoverTrigger>
    <PopoverContent align="end" className="settings-menu app-menu">
      {bootLoaded && <div className={'app-menu-user' + (u.guest ? ' is-guest' : '')}>
        <div className="app-menu-who"><Avatar id={u.avatar}/><span className="app-menu-name"><strong>{u.name}</strong><small>{u.guest ? t('menuGuest') : u.email}</small></span></div>
        {u.guest && <div className="app-menu-cta">
          <button className="btn primary" onClick={() => { close(); setModal('signup'); }}>{t('signUp')}</button>
          <button className="btn ghost" onClick={() => { close(); setModal('login'); }}><LogIn size={16} aria-hidden="true"/>{t('signIn')}</button>
        </div>}
      </div>}
      <nav className="settings-links app-menu-links" aria-label={t('navMore')}>
        {item('/account', 'account', t('myAccount'), t('myAccountNote'))}
        {item('/friends', 'friends', t('friendsList'), requests ? t(requests === 1 ? 'navRequests_one' : 'navRequests').replace('{n}', String(requests)) : t('menuFriendsNote'))}
        {item('/settings', 'settings', t('settingsTitle'), t('menuSettingsNote'))}
        <hr/>
        {item('/leaderboard', 'trophy', t('leaderboard'))}
        <A href="/" onClick={() => { close(); try { sessionStorage.setItem('roviko:tour-open', '1'); } catch { /* ignore */ } window.dispatchEvent(new Event('roviko:tour')); }}><RovikoIcon name="tour" size={22}/><span><strong>{t('menuTour')}</strong><small>{t('menuTourNote')}</small></span><ChevronRight size={17} aria-hidden="true" className="menu-chevron"/></A>
        {item('/how-to-play', 'help', t('howToLink'))}
        {item('/scoring', 'scoring', t('scoringLink'))}
      </nav>
    </PopoverContent>
  </Popover>;
}

export function SiteHeader({ path, hideTabs }: { path: string; hideTabs: boolean }) {
  const { t, boot, bootLoaded } = useApp();
  const requests = useFriendRequests(), badgeLabel = t(requests === 1 ? 'navRequests_one' : 'navRequests').replace('{n}', String(requests));
  const streak = boot.stats.dailyStreak ?? 0;
  const passportActive = path === '/profile';
  return <>
    <header className={"topbar" + (hideTabs ? " is-game" : "")}>
      <div className="topbar-inner">
        <A href="/" className="topbar-logo" aria-label={BRAND.name}><Logo/></A>
        <nav className="topnav" aria-label={t('navigationLabel')}>
          {NAV.map(item => { const active = item.match(path); return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>{t(item.key)}{item.key === 'navMultiplayer' && <RequestBadge n={requests} label={badgeLabel}/>}</A>; })}
        </nav>
        <div className="topbar-right">
          {bootLoaded && <A href="/profile" className={'streak-chip streak-pill' + (streak > 0 ? ' is-on' : '')}><FlameMark size={20} off={streak === 0}/><b>{streak > 0 ? plural(t, 'streakPill', streak) : t('streakPillZero')}</b></A>}
          <AppMenu/>
          <A href="/profile" className={'passport-link' + (passportActive ? ' is-active' : '')} aria-current={passportActive ? 'page' : undefined} aria-label={t('navPassport')}>
            {bootLoaded && !boot.user.guest ? <Avatar id={boot.user.avatar}/> : <span className="passport-icon" aria-hidden="true"><RovikoIcon name="passport" size={22}/></span>}
            <span className="passport-label">{bootLoaded && !boot.user.guest ? boot.user.name : t('navPassport')}</span>
          </A>
        </div>
      </div>
    </header>
    {/* On phones the top bar is hidden in games; screens without their own exit (lobby, match results) still get a way home. */}
    {hideTabs && <A href="/" className="game-home-fab" aria-label={t('backHome')}><Home size={20} aria-hidden="true"/></A>}
    {!hideTabs && <nav className="tabbar" aria-label={t('navigationLabel')}>
      {[...NAV, { href: '/profile', key: 'navPassport', icon: 'passport' as RovikoIconName, match: (p: string) => p === '/profile' }].map(item => { const active = item.match(path); return <A key={item.key} href={item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}><span className="tab-icon-wrap"><RovikoIcon name={item.icon} size={26} className="tab-icon"/>{item.key === 'navMultiplayer' && <RequestBadge n={requests} label={badgeLabel}/>}</span><span>{t(item.key)}</span></A>; })}
    </nav>}
  </>;
}
