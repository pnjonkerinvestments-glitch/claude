'use client';
import { CompetitionPanel, DailyScoreRule } from './atelier/Competition';
import { SpanishInfo } from './SpanishInfo';
import { withSpanish, spanishCountry, spanishCapital, spanishContent } from '../i18n/content';
import { MosaicSources } from './puzzles/MosaicSources';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { ArrowRight, ArrowLeft, Compass, Globe2, Flag, MapPin, Route, ListOrdered, Building2, Users, Sun, Moon, Volume2, VolumeX, ChevronDown, Flame, Trophy, Zap, Clock, Check, Copy, Link as LinkIcon, Plus, Star, Medal, Target, ArrowUpRight, Search, Settings2, LogOut, Download, Trash2, ShieldCheck, LockKeyhole, Menu, X, CheckCircle2, Mountain, Send, Navigation, Rocket, Leaf, Anchor, Sunrise, Bird, Heart, Ship, BookOpen, Crown, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Toaster, toast } from 'sonner';
import { BRAND, DEFAULT_SETTINGS, MODES, MODE_EMOJIS, REGIONS } from '@/lib/config';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { messages, errorMessage, type Locale } from '@/i18n/messages';
import { api, post, copyText, formatScore, sound, readPreference, writePreference, metric } from '@/lib/client';
import { PassportCollection } from './atelier/PassportCollection';
import { NextDiscovery } from './atelier/NextDiscovery';
import { DailyLoop } from './atelier/DailyLoop';
import { returnDestination, navigationState } from '@/lib/navigation';
import { JourneyRoute } from './game/JourneyRoute';
import { Question } from './game/Question';
import { SoloResults } from './game/SoloResults';
import { PuzzleDeck, openPuzzle } from './puzzles/PuzzleDeck';
import { HowToPlayButton, HowToPlayPage } from './atelier/HowToPlay';
import { GameIcon } from './atelier/GameIcon';
import { RankGame } from './puzzles/RankGame';
import { PuzzleGame } from './puzzles/PuzzleGame';
import { DuelGame } from './puzzles/DuelGame';
import { evaluateLearning } from '@/lib/game-engine/learning';
import { pageTitle } from '@/lib/page-title';
import { shareResult } from '@/lib/share';
import { createRoomClient } from '@/lib/realtime/room-client';
const icons: any = { trail: Compass, capitals: Building2, flags: Flag, pinpoint: MapPin, borders: Route, order: ListOrdered, mixed: Globe2, daily: Sunrise };
const avatars = [Compass, Rocket, Mountain, Anchor, Leaf, Bird, Sunrise, Ship];
const PUBLIC_BOOT = { user: { id: '', name: 'Explorer', avatar: 0, guest: true, discoverable: true, friendCode: '' }, stats: { games: 0, score: 0, xp: 0, level: 1, levelProgress: 0, accuracy: 0, averageTime: 0, wins: 0, dailyStreak: 0, dailyCount: 0, dailyDone: false, bestStreak: 0, achievements: [], recent: [], weak: [], modes: [] }, community: { games: 0, players: 0 }, countryCount: 195, leaders: [], googleEnabled: false, isAdmin: false };
const AppContext = createContext<any>(null);
function useApp() { return useContext(AppContext); }
function Avatar({ id = 0, size = '', name }: { id?: number; size?: string; name?: string }) {
    const emoji = ['🧭', '🚀', '🏔️', '⚓', '🌿', '🦜', '🌅', '⛵'][id % 8] ?? '🧭';
    return <span className={'avatar avatar-' + id + ' ' + size} aria-label={name}><span className="avatar-emoji" aria-hidden="true">{emoji}</span></span>;
}
function ModeEmoji({ mode }: { mode: string }) { return <GameIcon mode={mode} className="mode-emoji"/>; }
function Logo() { return <span className="logo"><img src="/globe-logo.webp" alt=""/><span>{BRAND.name.toLowerCase()}<span className="logo-period">.</span></span></span>; }
function A({ href, children, className = '', ...rest }: any) { const { go } = useApp(); return <a href={href} className={className} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    go(href);
} }} {...rest}>{children}</a>; }
function Choice({ label, value, onChange, options, disabled = false }: {
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    options: any[];
    disabled?: boolean;
}) { return <label className="field"><span>{label}</span><Select value={String(value)} onValueChange={onChange} disabled={disabled}><SelectTrigger className="select-trigger" aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem key={typeof o === 'string' ? o : o.value} value={String(typeof o === 'string' ? o : o.value)}>{typeof o === 'string' ? o : o.label}</SelectItem>)}</SelectContent></Select></label>; }
function GameSettings({ value, onChange, multiplayer = false, disabled = false }: any) { const { t } = useApp(); const set = (k: string, v: any) => onChange({ ...value, [k]: v }); return <div className="settings-grid">{multiplayer && <Choice label={t('play')} value={value.mode} disabled={disabled} onChange={v => set('mode', v)} options={['mixed', ...MODES].map(v => ({ value: v, label: t(v) }))}/>}{multiplayer ? <fieldset className="round-options" disabled={disabled}><legend>{t('rounds')}</legend><div>{[5,10,15,20].map(n=><button type="button" key={n} aria-pressed={value.count===n} className={'btn '+(value.count===n?'primary':'secondary')} onClick={()=>set('count',n)}>{n}</button>)}</div></fieldset> : <Choice label={t('rounds')} value={value.count} disabled={disabled} onChange={v => set('count', +v)} options={[5, 10, 15, 20].map(v => ({ value: v, label: v + ' ' + t('questions') }))}/>}{multiplayer && <Choice label={t('timer')} value={value.timer} disabled={disabled} onChange={v => set('timer', +v)} options={[5, 10, 15, 30, 0].map(v => ({ value: v, label: v ? v + ' sec' : t('unlimited') }))}/>}<Choice label={t('difficulty')} value={value.difficulty} disabled={disabled} onChange={v => set('difficulty', v)} options={['easy', 'medium', 'hard', 'mixed'].map(v => ({ value: v, label: t(v) }))}/><Choice label={t('region')} value={value.region} disabled={disabled} onChange={v => set('region', v)} options={REGIONS.map(v => ({ value: v, label: t(v) }))}/>{multiplayer && value.mode === 'mixed' && <fieldset className="enabled-modes" disabled={disabled}><legend>{t('includedModes')}</legend><p>{t('includedModesHelp')}</p>{MODES.map(m=>{const included=value.enabledModes??[...MODES];const checked=included.includes(m);return <label key={m}><input type="checkbox" checked={checked} disabled={disabled||(checked&&included.length===1)} onChange={()=>set('enabledModes',checked?included.filter((x:string)=>x!==m):[...included,m])}/><ModeEmoji mode={m}/><span><strong>{t(m)}</strong><small>{t(m+'Hint')}</small></span></label>;})}<small>{t('keepOneMode')}</small></fieldset>}{!multiplayer && value.mode === 'capitals' && <div className="switch-field"><div><label htmlFor="typed-choice">{t('typed')}</label><p>{t('typedHelp')}</p></div><Switch id="typed-choice" checked={!!value.typed} onCheckedChange={v => set('typed', v)}/></div>}</div>; }
function Empty({ title, copy, icon: Icon = Compass, children }: any) { return <div className="empty-state"><span className="empty-icon"><Icon size={30}/></span><h3>{title}</h3>{copy && <p>{copy}</p>}{children}</div>; }
function Loading() { const { t } = useApp(); return <div className="loading"><span className="loading-compass"><Compass size={36}/></span><p>{t('loading')}</p></div>; }
function useClock() { const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(id); }, []); return now; }
function seconds(ms: number) { return Math.max(0, Math.ceil(ms / 1000)); }
function prettyTime(ms: number) { const total = Math.round(ms / 1000); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; }
export default function RovikoApp({ initialPath = '/' }: {
    initialPath?: string;
}) {
    const [path, setPath] = useState(initialPath), [locale, setLocale] = useState<Locale>('en'), [theme, setTheme] = useState('light'), [muted, setMuted] = useState(true), [boot, setBoot] = useState<any>(PUBLIC_BOOT), [fatal, setFatal] = useState(''), [modal, setModal] = useState<string | null>(null), [mode, setMode] = useState('flags'), [setup, setSetup] = useState<any>({ ...DEFAULT_SETTINGS, mode: 'flags' }), [busy, setBusy] = useState(false), [mobileNav, setMobileNav] = useState(false);
    const starting = useRef(false);
    const [region, setRegionState] = useState('World');
    const setRegion = (value: string) => { if (REGIONS.includes(value)) { setRegionState(value); writePreference('rv_region',value); } };
    const [measurement, setMeasurement] = useState(false);
    const [manualCopy, setManualCopy] = useState<string | null>(null);
    const [report, setReport] = useState<any>(null);
    const [bootLoaded, setBootLoaded] = useState(false);
    const bootRequest = useRef<Promise<any> | null>(null);
    const t = useCallback((k: string) => (messages[locale] as any)[k] ?? (messages.en as any)[k] ?? k, [locale]);
    const fail = useCallback((e: any) => toast.error(t(errorMessage(e?.message ?? ''))), [t]);
    const refresh = useCallback(() => { if (!bootRequest.current) {
        bootRequest.current = api('/bootstrap').then(b => { setBoot(b); setBootLoaded(true); setFatal(''); return b; }).catch((e: any) => { setFatal(e.message); }).finally(() => { bootRequest.current = null; });
    } return bootRequest.current; }, []);
    useEffect(() => { setPath(window.location.pathname); const savedRegion=readPreference('rv_region','World'); setRegionState(REGIONS.includes(savedRegion) ? savedRegion : 'World'); setMeasurement(readPreference('rv_metrics','off') === 'on'); const savedLocale=readPreference('rv_locale','en'); setLocale(savedLocale === 'nl' || savedLocale === 'es' ? savedLocale : 'en'); setTheme(readPreference('rv_theme', 'light') || 'light'); setMuted(readPreference('rv_sound', 'off') !== 'on'); refresh(); const pop = () => setPath(window.location.pathname); window.addEventListener('popstate', pop); if ('serviceWorker' in navigator)
        navigator.serviceWorker.register('/sw.js').catch(() => { }); return () => window.removeEventListener('popstate', pop); }, [refresh]);
    useEffect(() => { document.documentElement.dataset.theme = theme; writePreference('rv_theme', theme); }, [theme]);
    useEffect(() => { document.documentElement.lang = locale; writePreference('rv_locale', locale); }, [locale]);
    useEffect(() => { if (!path.startsWith('/game/') && !path.startsWith('/puzzle/')) document.title = pageTitle(path, t); }, [path, t]);
    const go = useCallback((href: string) => { window.history.pushState(navigationState(window.location.pathname, window.scrollY, window.history.state, href), '', href); setPath(href.split('?')[0]); setMobileNav(false); setModal(null); window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
    const backToStart = () => { const back=returnDestination(window.history.state); go(back.path); requestAnimationFrame(() => window.scrollTo({top:back.scroll,behavior:'instant'})); };
    const start = async (settings: any, practice = false) => { if (starting.current) return; starting.current=true; setBusy(true); try {
        if (!boot.user.id)
            await refresh();
        const game = await post('/games', { settings: { ...settings, timer: 0 }, practice, competition:['daily','daily-trail'].includes(settings.mode) });
        go('/game/' + game.id);
    }
    catch (e) {
        fail(e);
    }
    finally {
        starting.current=false; setBusy(false);
    } };
    const playMode = (m: string) => { setMode(m); setSetup({ ...DEFAULT_SETTINGS, mode: m, region, timer: 0 }); setModal('game'); };
    const copy = async (value: string) => { try {
        await copyText(value);
        toast.success(t('copied'));
    }
    catch {
        setManualCopy(value);
    } };
    useEffect(() => { if (bootLoaded) { const mode = new URLSearchParams(location.search).get('shared'); if (mode) metric('shared_result_opened', mode); } }, [bootLoaded]);
    const ctx = { backToStart, region, setRegion, measurement, setMeasurement: (on: boolean) => { setMeasurement(on); writePreference('rv_metrics',on ? 'on':'off'); document.cookie = 'rv_metrics=' + (on ? 'on':'off') + '; Path=/; SameSite=Lax; Max-Age=31536000' + (location.protocol === 'https:' ? '; Secure':''); }, t, locale, theme, go, boot, refresh, modal, setModal, playMode, start, busy, setBusy, fail, copy, muted, report: setReport };
    const gamePath = path.startsWith('/rank/') || path.startsWith('/game/') || path.startsWith('/room/') || path.startsWith('/puzzle/') || path === '/duel';
    return <AppContext.Provider value={ctx}><a className="skip-link" href="#main">{t('play')}</a><header className="site-header"><div className="nav-inner"><A href="/" aria-label={BRAND.name}><Logo /></A><nav className={mobileNav ? 'main-nav mobile-open' : 'main-nav'} aria-label={t('navigationLabel')}>{[['/', 'play'], ['/multiplayer', 'withFriends'], ['/explore', 'explore'], ['/how-to-play', 'howTo']].map(([href, key]) => <A href={href} key={key} aria-current={path === href || (key === 'play' && (path.startsWith('/game') || path.startsWith('/puzzle') || path === '/daily' || path === '/duel')) || (key === 'withFriends' && path.startsWith('/room')) ? 'page' : undefined} className={(path === href || (key === 'play' && (path.startsWith('/game') || path.startsWith('/puzzle') || path === '/daily' || path === '/duel')) || (key === 'withFriends' && path.startsWith('/room')) ? 'active ' : '') + (key === 'daily' ? 'daily-nav' : '')}>{key === 'withFriends' && <Users size={16}/>}<span>{t(key)}</span>{key === 'daily' && <span className="nav-dot"/>}</A>)}<div className="mobile-settings"><button onClick={() => { setMuted(v => !v); writePreference('rv_sound', muted ? 'on' : 'off'); if (muted)
        sound('correct'); }}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>} {t(muted ? 'soundOff' : 'soundOn')}</button>{boot.user.guest && <button className="mobile-sign-in" onClick={()=>{setModal('login');setMobileNav(false);}}>{t('signIn')}</button>}</div></nav><div className="nav-actions"><label className="language-picker"><span className="language-code" aria-hidden="true">{locale.toUpperCase()}</span><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="en">EN · English</option><option value="nl">NL · Nederlands</option><option value="es">ES · Español</option></select><ChevronDown size={12} aria-hidden="true"/></label><button className="icon-btn theme-button" aria-label={t('theme')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-btn sound-button" aria-label={t('sound')} onClick={() => { setMuted(v => !v); writePreference('rv_sound', muted ? 'on' : 'off'); if (muted)
        sound('correct'); toast(t(muted ? 'soundOn' : 'soundOff')); }}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>{boot && !boot.user.guest ? <A href="/profile" className="profile-nav"><Avatar id={boot.user.avatar}/><span>{boot.user.name}</span></A> : <button className="btn sign-in" onClick={() => setModal('login')}>{t('signIn')}<ArrowUpRight size={15}/></button>}<button className="icon-btn mobile-menu" aria-label={t('menuLabel')} aria-expanded={mobileNav} onClick={() => setMobileNav(v => !v)}>{mobileNav ? <X size={21}/> : <Menu size={21}/>}</button></div></div></header>
 <main id="main" className={'site-main ' + (gamePath ? 'game-main' : '')}>{fatal ? <Empty title={t('connectionError')} copy={t(errorMessage(fatal))}><button className="btn primary" onClick={refresh}>{t('retry')}</button></Empty> : !bootLoaded && ['/game/', '/puzzle/', '/rank/', '/room/', '/profile', '/friends', '/admin', '/leaderboard'].some(v => path.startsWith(v)) ? <Loading /> : path === '/' ? <Home /> : path === '/multiplayer' ? <MultiplayerLanding /> : path.startsWith('/room/') ? <RoomScreen key={path} code={path.split('/')[2]}/> : path.startsWith('/game/') ? <SoloScreen key={path} id={path.split('/')[2]}/> : path.startsWith('/rank/') ? <RankGame key={path} id={path.split('/')[2]} app={ctx}/> : path.startsWith('/puzzle/') ? <PuzzleGame key={path} id={path.split('/')[2]} app={ctx}/> : path === '/daily' ? <DailyScreen /> : path === '/duel' ? <DuelScreen /> : path === '/how-to-play' ? <HowToScreen /> : path === '/leaderboard' ? <Rankings /> : path === '/profile' ? <Profile /> : path === '/friends' ? <Friends /> : path === '/explore' ? <Explore /> : path === '/admin' ? <Admin /> : ['/privacy', '/terms', '/sources'].includes(path) ? <InfoPage kind={path.slice(1)}/> : <SEOPage slug={path.slice(1)}/>}</main>
 {!gamePath && <footer className="site-footer"><div><A href="/"><Logo /></A><span>{t('footerCopy')}</span></div><nav><A href="/leaderboard">{t('leaderboard')}</A><A href="/sources">{t('sources')}</A><A href="/privacy">{t('privacy')}</A><A href="/terms">{t('terms')}</A>{boot?.isAdmin && <A href="/admin">{t('admin')}</A>}</nav><span className="copyright">© {new Date().getFullYear()} {BRAND.name}</span></footer>}
 <Dialog open={modal === 'game'} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><div className={'mode-symbol tone-' + mode}><ModeEmoji mode={mode}/></div><DialogTitle className="modal-title">{t(mode)}</DialogTitle><DialogDescription>{t(mode + 'Desc')}</DialogDescription><p className="solo-pace-note"><span aria-hidden="true">🌿</span>{t('soloNote')}</p><GameSettings value={setup} onChange={setSetup}/><button className="btn primary wide" disabled={busy} onClick={() => start(setup)}>{busy ? t('loading') : t('startGame')}<ArrowRight size={18}/></button></DialogContent></Dialog>
 <Dialog open={manualCopy !== null} onOpenChange={v => !v && setManualCopy(null)}><DialogContent className="app-modal"><DialogTitle>{t('manualCopyTitle')}</DialogTitle><DialogDescription>{t('manualCopyHelp')}</DialogDescription><textarea className="text-input manual-share" aria-label={t('share')} readOnly value={manualCopy ?? ''} onFocus={e => e.target.select()}/><button className="btn secondary" onClick={() => setManualCopy(null)}>{t('done')}</button></DialogContent></Dialog>
 <AuthModal /><CreateRoomModal /><ReportModal value={report} onClose={() => setReport(null)}/><Toaster theme={theme as any} position="bottom-center" richColors/></AppContext.Provider>;
}
function Home() {
    const app = useApp(), { t, start, playMode, setModal, busy, region, setRegion, boot } = app;
    return <div className="home-page play-home atelier-home">
        <PuzzleDeck app={app} welcome/>
        <section id="modes" className="quick-games"><div className="atelier-section-heading"><h2>{t('chooseGame')}</h2><div className="quick-controls"><Choice label={t('region')} value={region} onChange={setRegion} options={REGIONS.map(v => ({ value: v, label: v === 'World' ? t('allRegions') : t(v) }))}/><button className="btn secondary surprise-button" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: MODES[Math.floor(Math.random()*MODES.length)], region, count:5 })}><span aria-hidden="true">✦</span>{t('surpriseMe')}</button></div></div>
        {boot.stats.weak?.length > 0 && <button className="review-card" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed', region }, true)}><span className="review-card-icon" aria-hidden="true"><RotateCcw size={22} strokeWidth={2.2}/></span><span className="review-card-copy"><strong>{t('reviewCardTitle')}</strong><small>{t('reviewCardCopy').replace('{n}', String(new Set(boot.stats.weak.map((w: { country_id: string }) => w.country_id)).size))}</small></span><span className="btn secondary review-card-cta">{t('reviewCardCta')}<ArrowRight size={17}/></span></button>}
        <div className="quick-game-grid">{MODES.map(mode => <article className={'quick-game-card tone-' + mode} key={mode}><button className="quick-game-start" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode, region })}><ModeEmoji mode={mode}/><span><strong>{t(mode)}</strong><small>{t('category'+mode)}</small></span><ArrowRight size={18}/></button><button className="icon-btn quick-game-settings" disabled={busy} aria-label={t('gameSettings').replace('{game}',t(mode))} onClick={() => playMode(mode)}><Settings2 size={18}/></button></article>)}</div></section>
        <section className="atelier-social"><div className="avatar-stack"><Avatar id={0}/><Avatar id={1}/><Avatar id={4}/></div><div><h2>{t('socialTitle')}</h2><p>{t('socialCopy')}</p></div><div className="social-actions"><button className="btn primary" onClick={() => setModal('room')}><Users size={18}/>{t('createRoom')}</button><A className="btn secondary" href="/multiplayer">{t('joinRoom')}</A></div></section>
    </div>;
}
function JoinForm({ compact = false }: {
    compact?: boolean;
}) { const { t, go, fail } = useApp(); const [code, setCode] = useState(''), [busy, setBusy] = useState(false); const join = async (e: any) => { e.preventDefault(); if (!/^[A-Z2-9]{5}$/.test(code)) {
    toast.error(t('invalidCode'));
    return;
} setBusy(true); try {
    await post('/rooms/' + code + '/join');
    go('/room/' + code);
}
catch (e) {
    fail(e);
}
finally {
    setBusy(false);
} }; return <form onSubmit={join} className={'join-form ' + (compact ? 'compact' : '')}><label className="sr-only" htmlFor={compact ? 'compact-code' : 'room-code'}>{t('roomCode')}</label><input id={compact ? 'compact-code' : 'room-code'} placeholder={t('codePlaceholder')} value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))} maxLength={5} autoComplete="off" spellCheck={false}/><button className="btn" disabled={busy || code.length !== 5}>{t('join')}<ArrowRight size={16}/></button></form>; }
function MultiplayerLanding() { const { t, setModal, locale } = useApp(); return <div className="multiplayer-page"><div className="page-heading centered"><span className="eyebrow"><Users size={16}/>{t('multiplayer')}</span><h1>{t('roomTitle')}</h1><p>{t('roomCopy')}</p><HowToPlayButton mode="room" t={t} locale={locale} link/></div><div className="multiplayer-options"><section className="panel create-panel"><div className="avatar-stack big"><Avatar id={0}/><Avatar id={1}/><Avatar id={4}/></div><h2>{t('createRoom')}</h2><p>{t('lobbyCopy')}</p><button className="btn primary wide" onClick={() => setModal('room')}><Plus size={20}/>{t('createRoom')}</button></section><section className="panel join-panel"><span className="big-icon"><LinkIcon size={34}/></span><h2>{t('joinRoom')}</h2><p>{t('joinHelp')}</p><JoinForm /></section></div><p className="center-note"><ShieldCheck size={16}/>{t('guestNote')}</p></div>; }
function CreateRoomModal() { const { modal, setModal, t, boot, refresh, go, fail } = useApp(); const [name, setName] = useState(''), [avatar, setAvatar] = useState(0), [busy, setBusy] = useState(false); useEffect(() => { if (modal === 'room') {
    setName(boot?.user.name ?? '');
    setAvatar(boot?.user.avatar ?? 0);
} }, [modal, boot?.user]); const create = async (e: any) => { e.preventDefault(); setBusy(true); try {
    await api('/profile', { method: 'PATCH', body: JSON.stringify({ name, avatar, discoverable: boot.user.discoverable }) });
    await refresh();
    const r = await post('/rooms', { settings: DEFAULT_SETTINGS });
    go('/room/' + r.code);
}
catch (e) {
    fail(e);
}
finally {
    setBusy(false);
} }; return <Dialog open={modal === 'room'} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><span className="mode-symbol tone-capitals"><Users size={28}/></span><DialogTitle className="modal-title">{t('createRoom')}</DialogTitle><DialogDescription>{t('roomCopy')}</DialogDescription><form onSubmit={create} className="form-stack"><label className="field"><span>{t('displayName')}</span><input className="text-input" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/><small>{t('nameHint')}</small></label><AvatarPicker value={avatar} onChange={setAvatar}/><button className="btn primary wide" disabled={busy}>{busy ? t('loading') : t('createRoom')}<ArrowRight size={18}/></button></form></DialogContent></Dialog>; }
function AvatarPicker({ value, onChange }: any) { const { t } = useApp(); return <fieldset className="avatar-picker"><legend>{t('avatar')}</legend><div>{avatars.map((Icon, i) => <button type="button" key={i} className={value === i ? 'selected' : ''} aria-label={t('avatar') + ' ' + (i + 1)} aria-pressed={value === i} onClick={() => onChange(i)}><Avatar id={i}/>{value === i && <Check size={12}/>}</button>)}</div></fieldset>; }
function AuthModal() { const { modal, setModal, t, refresh, boot, fail } = useApp(); const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState(''), [busy, setBusy] = useState(false); const signup = modal === 'signup'; useEffect(() => { if (signup)
    setName(boot?.user.name ?? ''); }, [signup, boot?.user.name]); const submit = async (e: any) => { e.preventDefault(); setBusy(true); try {
    await post('/auth/' + (signup ? 'signup' : 'login'), { email, password, ...(signup ? { name } : {}) });
    await refresh();
    setModal(null);
    setPassword('');
    toast.success(t('accountSaved'));
}
catch (e) {
    fail(e);
}
finally {
    setBusy(false);
} }; return <Dialog open={['login', 'signup'].includes(modal)} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><Logo /><DialogTitle className="modal-title">{t('accountTitle')}</DialogTitle><DialogDescription>{t('accountCopy')}</DialogDescription><form onSubmit={submit} className="form-stack">{signup && <label className="field"><span>{t('name')}</span><input className="text-input" autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/></label>}<label className="field"><span>{t('email')}</span><input className="text-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label className="field"><span>{t('password')}</span><input className="text-input" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={128} required/>{signup && <small>{t('passwordHint')}</small>}</label><button className="btn primary wide" disabled={busy}>{busy ? t('loading') : t(signup ? 'signUp' : 'signIn')}<ArrowRight size={18}/></button></form>{boot?.googleEnabled && <a className="btn secondary" href="/api/auth/google" target="_top">{t('continueGoogle')}</a>}<div className="auth-switch">{t(signup ? 'haveAccount' : 'newAccount')}<button className="text-link" onClick={() => setModal(signup ? 'login' : 'signup')}>{t(signup ? 'signIn' : 'signUp')}</button></div></DialogContent></Dialog>; }
function GameTop({ round, total, score, deadline, serverOffset = 0, streak = 0, onBack }: any) { const { t } = useApp(); const now = useClock() + serverOffset; const sec = deadline ? seconds(deadline - now) : null; return <div className="game-top"><button className="icon-btn exit-game" aria-label={t('back')} onClick={onBack}><X size={20}/></button><div className="round-progress"><span>{t('round')} <b>{round + 1}</b><span className="muted"> / {total}</span></span><Progress value={(round + 1) / total * 100} className="game-progress"/></div><span className={'game-timer ' + (sec !== null && sec < 6 ? 'urgent' : '')}><Clock size={18}/>{sec === null ? '∞' : sec}<small>{sec !== null ? 's' : ''}</small></span><div className="game-score"><Zap size={18}/><strong>{formatScore(score)}</strong></div>{streak > 1 && <span className="game-streak"><Flame size={17}/>{streak}</span>}</div>; }
function SoloScreen({ id }: { id: string }) {
    const { t, go, backToStart, fail, muted, report, refresh, locale } = useApp();
    const [game, setGame] = useState<any>(null), [saving, setSaving] = useState(false), [advancing, setAdvancing] = useState(false), [error, setError] = useState('');
    const [autoNext, setAutoNext] = useState(() => readPreference('rv_auto_next', readPreference('rv_compare_auto','off')) === 'on');
    const hintSave = useRef<Promise<any> | null>(null);
    const sending = useRef(false), moving = useRef(false), pendingSave = useRef<Promise<any> | null>(null);
    const load = useCallback(() => { setError(''); api('/games/' + id).then(setGame).catch(e => setError(e.message)); }, [id]);
    useEffect(load, [load]);
    useEffect(() => { if (game) document.title = t(game.competition?.mode==='trail'?'dailyTrail':game.daily ? 'dailyTitle' : game.settings.mode) + ' | ' + BRAND.name; }, [game?.settings?.mode, game?.daily, locale]);
    const answer = useCallback(async (value: any) => {
        if (sending.current || !game || game.phase !== 'question') return;
        sending.current = true;
        setSaving(true);
        const immediate = game.question.solution ? evaluateLearning(game.question.solution, value, game.streak) : null;
        if (immediate) {
            setGame({ ...game, phase: 'reveal', feedback: immediate, streak: immediate.streak, bestStreak: Math.max(game.bestStreak, immediate.streak) });
            if (!muted) sound(immediate.correct ? 'correct' : 'incorrect');
        }
        const request = (hintSave.current ?? Promise.resolve()).catch(() => {}).then(() => post('/games/' + id + '/answer', { round: game.round, answer: value }));
        pendingSave.current = request;
        try {
            const saved = await request;
            setGame(saved);
            if (!immediate && !muted) sound(saved.feedback.correct ? 'correct' : 'incorrect');
        } catch (e) { fail(e); load(); }
        finally { sending.current = false; pendingSave.current = null; setSaving(false); }
    }, [game, id, muted, fail, load]);
    useEffect(() => { if (game?.phase === 'finished') refresh(); }, [game?.phase, refresh]);
    const next = async () => {
        if (moving.current) return;
        moving.current = true; setAdvancing(true);
        try {
            if (pendingSave.current) await pendingSave.current;
            setGame(await post('/games/' + id + '/next'));
        } catch (e) { fail(e); load(); }
        finally { moving.current = false; setAdvancing(false); }
    };
    const nextRound = useRef(next); nextRound.current=next;
    useEffect(() => {
        if (!autoNext || game?.phase !== 'reveal' || !game.feedback?.correct || saving || advancing || error) return;
        const timeout=setTimeout(()=>{if(document.visibilityState==='visible')nextRound.current();},3000);
        return ()=>clearTimeout(timeout);
    }, [autoNext,game?.phase,game?.round,saving,advancing,error]);
    if (error) return <Empty title={t(errorMessage(error))}><button className="btn secondary" onClick={load}>{t('retry')}</button></Empty>;
    if (!game) return <Loading/>;
    if (game.phase === 'finished') return <Results result={game}/>;
    const revealed = game.phase === 'reveal';
    const guide = game.settings.mode === 'daily-trail' ? 'trail' : game.daily ? 'daily' : game.settings.mode === 'mixed' ? game.question.mode : game.settings.mode;
    return <div className="solo-game learning-game" data-mode={game.daily ? 'daily' : game.settings.mode}><div className="solo-top"><button className="icon-btn" aria-label={t('back')} onClick={backToStart}><X size={20}/></button><span className="solo-mode"><ModeEmoji mode={game.question.mode}/><strong>{t(game.question.mode)}</strong></span><div className="solo-round"><span>{t('round')} <b>{game.round + 1}</b> / {game.total}</span>{game.streak > 1 && <span className="solo-streak">🔥 {game.streak}</span>}</div><HowToPlayButton key={guide} mode={guide} t={t} locale={locale} auto={game.settings.mode !== 'mixed'}/><Progress value={(game.round + (revealed ? 1 : 0)) / game.total * 100} className="solo-progress"/></div>
        <div className="game-region"><Globe2 size={15}/>{t('activeRegion').replace('{region}',t(game.settings.region))}{game.practice && <span> · {t('reviewRoundLabel')}</span>}</div><div className="auto-next-wrap"><label className="auto-next"><input type="checkbox" checked={autoNext} onChange={e=>{setAutoNext(e.target.checked);writePreference('rv_auto_next',e.target.checked?'on':'off');}}/>{t('autoNextAll')}</label>{autoNext && <small>{t('autoNextExplain')}</small>}</div>
        {game.competition && <DailyScoreRule mode={game.competition.mode} score={game.score} t={t}/>}
        {game.daily && game.settings.mode==='daily' && <JourneyRoute compact t={t} step={game.round}/>}<div className="game-body"><Question key={game.question.id} question={game.question} feedback={game.feedback} locked={revealed || saving} onAnswer={answer} competitive={false} onHint={(count: number) => { const round = game.round; return hintSave.current = (hintSave.current ?? Promise.resolve()).catch(() => {}).then(() => post('/games/' + id + '/hint', { round, count })).then(g => { if (!sending.current) setGame((current:any) => current.round === round && current.phase === 'question' ? g : current); }).catch(fail); }} t={t} locale={locale} onReport={() => report(game.question)}/>{revealed && <div className="solo-next-row"><span className="save-status" role="status">{saving ? t('saving') : '✓ ' + t('saved')}</span><button className="btn primary next-button" onClick={next} disabled={advancing} aria-busy={advancing}>{t(game.round + 1 === game.total ? 'finish' : 'next')}<ArrowRight size={19}/></button></div>}</div>
    </div>;
}
function DuelScreen() { const app = useApp(); return <DuelGame app={app}/>; }
function HowToScreen() {
    const app = useApp(), { t, locale, go, start, region, setModal, busy, fail } = app;
    const onPlay = (mode: string) => {
        if (mode === 'duel') go('/duel');
        else if (mode === 'mystery') go('/daily');
        else if (mode === 'room') setModal('room');
        else if (mode === 'daily' || mode === 'trail') start({ ...DEFAULT_SETTINGS, mode: mode === 'trail' ? 'daily-trail' : 'daily' });
        else if (mode === 'rank' || mode === 'compare' || mode === 'mosaic') openPuzzle(app, mode).catch(fail);
        else start({ ...DEFAULT_SETTINGS, mode, region });
    };
    return <HowToPlayPage t={t} locale={locale} onPlay={onPlay} busy={busy}/>;
}
function DailyScreen() {
    const app = useApp();
    return <div className="daily-hub"><PuzzleDeck app={app} dailyPage welcome/></div>;
}
function Results({ result, multiplayer = false, room, send }: any) {
    const app = useApp(), { t, locale, start, go, backToStart, copy, boot, fail } = app;
    const list = result.answers ?? result.results ?? [];
    const correct = list.filter((a: any) => a.correct).length;
    const score = result.score;
    const wrong = list.filter((a: any) => !a.correct);
    const share = () => copy(shareResult({ mode: multiplayer ? 'multiplayer' : result.competition?.mode ?? (result.daily ? 'daily' : result.settings?.mode) ?? 'mixed', label: t(multiplayer ? 'multiplayer' : result.competition?.mode==='trail'?'dailyTrail':result.daily ? 'dailyTitle' : result.settings?.mode ?? 'mixed'), date: result.daily, correct, total: list.length, answers: list.map((a:any) => !!a.correct), detail:result.competition?score.toLocaleString(locale)+' '+t('points'):undefined, origin: window.location.origin }));
    const winners = room?.players ?? [];
    if (!multiplayer) return <SoloResults result={result} t={t} locale={locale} dailyStreak={boot.stats.dailyStreak} onAgain={() => start({ ...result.settings, mode: result.competition?.mode==='trail'?'trail':result.daily ? 'mixed' : result.settings.mode })} onShare={share} onHome={backToStart} followUp={<>{result.competition && <CompetitionPanel app={app} date={result.daily} mode={result.competition.mode}/>} {result.daily && <DailyLoop app={app}/>}<NextDiscovery result={result} t={t} go={go} fail={fail}/></>}/>;
    return <div className="results-page"><span className="result-emblem">{multiplayer ? <Trophy size={40}/> : result.daily ? <Sunrise size={40}/> : <Compass size={40}/>}</span><span className="eyebrow">{multiplayer ? t('multiplayer') : result.daily ? t('daily') : t(result.settings?.mode ?? 'mixed')}</span><h1>{t(multiplayer ? 'podium' : result.daily ? 'dailyResult' : 'yourResult')}</h1><p className="results-subtitle">{t(multiplayer ? 'podiumCopy' : 'resultCopy')}</p>{multiplayer && <div className="podium">{winners.slice(0, 3).map((p: any, i: number) => <div key={p.id} className={'podium-player place-' + (i + 1)}>{i === 0 && <Crown className="podium-crown" size={27}/>}<Avatar id={p.avatar} size="large"/><strong>{p.name}</strong><span>{formatScore(p.score)} {t('points')}</span><div className="podium-step"><span>{p.rank ?? i + 1}</span></div></div>)}</div>}
 {!multiplayer && <div className="result-score"><span>{formatScore(score)}</span><small>{t('points')}</small>{score > result.personalBest && <div className="record-chip"><Star size={14}/>{t('newRecord')}</div>}</div>}
 <div className="result-stats"><div><Target size={20}/><strong>{list.length ? Math.round(correct / list.length * 100) : 0}%</strong><span>{t('accuracy')}</span></div><div><Clock size={20}/><strong>{prettyTime(list.reduce((n: number, a: any) => n + a.responseTime, 0))}</strong><span>{t('time')}</span></div><div><Flame size={20}/><strong>{result.bestStreak ?? Math.max(0, ...list.map((a: any) => a.streak))}</strong><span>{t('bestStreak')}</span></div><div><Zap size={20}/><strong>+{result.xp ?? Math.round(score / 25) + list.length * 10}</strong><span>{t('xpEarned')}</span></div></div>
 {result.daily && <p className="daily-comparison">{result.percentile !== null && result.percentile !== undefined ? `${t('dailyPercentile')}: ${result.percentile}` : t('dailyFirst')} · <Flame size={15}/>{boot.stats.dailyStreak} {t('days')}</p>}
 <div className="results-actions">{multiplayer ? room.host === boot.user.id ? <button className="btn primary" onClick={() => send('rematch')}><RefreshCw size={17}/>{t('rematch')}</button> : <p className="muted">{t('waitingHost')}</p> : <button className="btn primary" onClick={() => start({ ...result.settings, mode: result.competition?.mode==='trail'?'trail':result.daily ? 'mixed' : result.settings.mode })}><RefreshCw size={17}/>{t('playAgain')}</button>}<button className="btn secondary" onClick={share}><ArrowUpRight size={17}/>{t('share')}</button><button className="btn ghost" onClick={() => go('/')}>{t('home')}</button></div>
 {multiplayer && <LiveRanking players={winners}/>}<section className="review-section"><h2>{t('review')}</h2>{wrong.length ? <><p>{t('reviewCopy')}</p><div className="review-list">{wrong.map((a: any, i: number) => <div key={i}><span className={'review-mode tone-' + a.mode}>{React.createElement(icons[a.mode] ?? Compass, { size: 20 })}</span><div><strong>{a.answerLabel[locale]}</strong><p>{a.fact[locale]}</p></div><CheckCircle2 size={18}/></div>)}</div></> : <div className="perfect-note"><CheckCircle2 size={22}/>{t('perfect')}</div>}</section></div>;
}
function RoomScreen({ code }: {
    code: string;
}) {
    const { t, boot, fail, copy, go, locale, report, muted, refresh } = useApp();
    const [room, setRoom] = useState<any>(null), [connected, setConnected] = useState(false), [error, setError] = useState(''), [offset, setOffset] = useState(0), [pending, setPending] = useState(false), [settingsBusy, setSettingsBusy] = useState(false);
    const channel = useRef<ReturnType<typeof createRoomClient> | null>(null);
    const hadConnectionLoss = useRef(false);
    const answerPending = useRef(false);
    const acknowledgement = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const preferences = useRef({ fail, muted });
    preferences.current = { fail, muted };
    const now = useClock() + offset;
    const latest = useRef<any>(null);
    useEffect(() => {
        const client = createRoomClient({
            join: () => post('/rooms/' + code + '/join'),
            open: () => new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/rooms/${code}/socket`),
            status: (online, reason) => { setConnected(online); setError(reason); if (reason) { hadConnectionLoss.current = true; metric('room_connection_failed','multiplayer',code); } else if (online && hadConnectionLoss.current) { metric('room_reconnected','multiplayer',code); hadConnectionLoss.current = false; } },
            rejected: reason => { preferences.current.fail(new Error(reason)); answerPending.current = false; setPending(false); clearTimeout(acknowledgement.current); },
            state: (data, source) => {
                data = withSpanish(data);
                if (data.phase === 'reveal' && latest.current?.phase !== 'reveal' && !preferences.current.muted)
                    sound(data.feedback?.correct ? 'correct' : 'incorrect');
                // An HTTP reconnect snapshot also resolves an answer whose acknowledgement was lost.
                if (source === 'snapshot' || data.answered || data.phase !== 'question' || data.round !== latest.current?.round || data.matchId !== latest.current?.matchId) { answerPending.current = false; setPending(false); clearTimeout(acknowledgement.current); }
                setRoom(data); latest.current = data; setOffset(data.serverTime - Date.now());
            }
        });
        channel.current = client; void client.start();
        return () => { client.stop(); clearTimeout(acknowledgement.current); };
    }, [code]);
    useEffect(() => { if (room?.phase === 'finished') refresh(); }, [room?.phase, refresh]);
    const send = (type: string, extra: any = {}) => {
        if (!channel.current?.send(type, extra)) { toast.error(t('reconnecting')); return false; }
        return true;
    };
    const answer = (value: any) => {
        if (answerPending.current || room.answered || !connected) return;
        answerPending.current = true; setPending(true);
        if (!send('answer', { answer: value, round: room.round, matchId: room.matchId })) {
            answerPending.current = false; setPending(false); return;
        }
        acknowledgement.current = setTimeout(() => { setError('ANSWER_UNCONFIRMED'); channel.current?.retry(); }, 6000);
    };
    const leave = async () => { try {
        await post('/rooms/' + code + '/leave');
        go('/multiplayer');
    }
    catch (e) {
        fail(e);
    } };
    if (error && !room)
        return <Empty title={t(errorMessage(error))}><button className="btn primary" onClick={() => channel.current?.retry()}>{t('retry')}</button><button className="btn ghost" onClick={() => go('/multiplayer')}>{t('back')}</button></Empty>;
    if (!room)
        return <Loading />;
    const isHost = room.host === boot.user.id;
    const self = room.players.find((p: any) => p.id === boot.user.id);
    if (room.phase === 'finished')
        return <Results result={{ ...room, answers: room.results }} multiplayer room={room} send={send}/>;
    return <div className="room-screen">{!connected && <div className="connection-banner" role="status"><RefreshCw size={16}/>{t(error ? errorMessage(error) : 'reconnecting')}<button className="btn secondary" onClick={() => channel.current?.retry()}>{t('retry')}</button></div>}{room.phase === 'lobby' ? <><div className="room-page-heading"><div><span className="eyebrow"><Users size={15}/>{t('multiplayer')}</span><h1>{t('yourLobby')}</h1><p>{t('lobbyCopy')}</p></div><button className="btn ghost" onClick={leave}><LogOut size={16}/>{t('leaveRoom')}</button></div><div className="lobby-grid"><section className="panel lobby-players"><div className="room-code-panel"><div><span className="eyebrow">{t('roomCode')}</span><button className="room-code" onClick={() => copy(code)} aria-label={t('copyCode')}>{code}<Copy size={22}/></button></div><button className="btn secondary" onClick={() => copy(location.origin + '/room/' + code)}><LinkIcon size={17}/>{t('copyLink')}</button></div><div className="small-heading"><h3>{t('players')}<span className="count-chip">{room.players.length} / 12</span></h3><span className="live-chip">{connected && <span />}{t(connected ? 'connected' : 'reconnecting')}</span></div><div className="lobby-player-list">{room.players.map((p: any) => <div className="lobby-player" key={p.id}><Avatar id={p.avatar}/><div><strong>{p.name}{p.id === boot.user.id && <small> ({t('you')})</small>}</strong><span>{p.id === room.host ? <><Crown size={13}/>{t('host')}</> : !p.connected ? t('reconnecting') : p.ready ? t('ready') : t('notReady')}</span></div>{p.ready ? <CheckCircle2 size={20} className="ready-icon"/> : p.id === room.host ? <Crown size={19} className="host-icon"/> : <span className="waiting-dot"/>}</div>)}</div><div className="invite-seat"><Plus size={20}/><span>{t('roomCopy')}</span></div><div className="lobby-controls"><button className={'btn ' + (self?.ready ? 'ready-btn' : 'secondary')} disabled={!connected} onClick={() => send('ready', { ready: !self?.ready })}><Check size={17}/>{t(self?.ready ? 'notReadyButton' : 'setReady')}</button>{isHost ? <button className="btn primary" disabled={!connected || settingsBusy} onClick={() => send('start')}>{t('startGame')}<ArrowRight size={18}/></button> : <span className="muted">{t('waitingHost')}</span>}</div><p className="lobby-footnote">{t('soloTest')}</p></section><aside className="panel room-settings"><h2><Settings2 size={20}/>{t('settings')}</h2><GameSettings value={room.settings} multiplayer disabled={!isHost || settingsBusy} onChange={async (v: any) => { if(settingsBusy)return;setSettingsBusy(true);try {
        const r = await post('/rooms/' + code + '/settings', { settings: v });
        setRoom(r);
    }
    catch (e) {
        fail(e);
    } finally { setSettingsBusy(false); } }}/><div className="room-rules"><ShieldCheck size={18}/><p>{t('lobbyRules')}</p></div></aside></div></> : <><GameTop round={room.round} total={room.total} score={room.score} deadline={room.phase === 'question' ? room.deadline : null} serverOffset={offset} onBack={leave}/><div className="live-game-layout"><div className="game-body live-game-body">{room.phase === 'countdown' ? <div className="countdown-stage"><span className="eyebrow">{t('countdown')}</span><strong key={seconds(room.startAt - now)}>{Math.max(1, seconds(room.startAt - now))}</strong><p>{t(room.question?.mode ?? 'mixed')}</p><span>{room.round + 1} / {room.total}</span></div> : <Question key={room.matchId + ':' + room.round} question={room.question} feedback={room.phase === 'reveal' ? room.feedback : null} locked={room.phase !== 'question' || room.answered || pending || !connected} busy={pending} onAnswer={answer} t={t} locale={locale} onReport={() => report(room.question)}/>}{room.phase === 'question' && room.answersCompleteAt && <p className="locked-note" role="status">{t('allAnsweredReveal')}</p>}{room.phase === 'reveal' && <div className="next-countdown">{t('nextRound')} <strong>{seconds(room.revealUntil - now)}</strong></div>}{isHost && room.settings.timer === 0 && room.phase === 'question' && <button className="btn secondary" onClick={() => send('advance')}>{t('endRound')}</button>}</div><aside className="live-ranking-panel"><div className="room-mini-code"><Users size={15}/>{code}<button className="icon-btn" aria-label={t('copyCode')} onClick={() => copy(code)}><Copy size={14}/></button></div><LiveRanking players={room.players} showStatus={room.phase === 'question'}/></aside></div></>}</div>;
}
function LiveRanking({ players, showStatus = false }: any) { const { t, boot } = useApp(); return <div className="live-ranking"><h3><Trophy size={18}/>{t('roomRanking')}</h3>{players.map((p: any, i: number) => <div key={p.id} className={'live-rank-row ' + (p.id === boot.user.id ? 'is-you' : '')}><span className="rank-num">{p.rank ?? i + 1}</span><Avatar id={p.avatar}/><div className="rank-person"><strong>{p.name}</strong><span>{p.streak > 1 ? <><Flame size={12}/>{p.streak}</> : p.delta ? '+' + formatScore(p.delta) : '—'}</span></div><span className="rank-score">{formatScore(p.score)}</span>{showStatus && p.answered && <CheckCircle2 size={16} className="ready-icon"/>}</div>)}</div>; }
function ReportModal({ value, onClose }: any) { const { t, fail } = useApp(); const [category, setCategory] = useState('wrong'), [detail, setDetail] = useState(''), [busy, setBusy] = useState(false); useEffect(() => { setCategory('wrong'); setDetail(''); }, [value]); const submit = async (e: any) => { e.preventDefault(); setBusy(true); try {
    await post('/reports', { questionId: value.id, template: value.mode, category, detail });
    toast.success(t('reportThanks'));
    onClose();
}
catch (e) {
    fail(e);
}
finally {
    setBusy(false);
} }; return <Dialog open={!!value} onOpenChange={v => !v && onClose()}><DialogContent className="app-modal"><DialogTitle className="modal-title">{t('reportTitle')}</DialogTitle><DialogDescription>{t('reportCopy')}</DialogDescription><form className="form-stack" onSubmit={submit}><Choice label={t('report')} value={category} onChange={setCategory} options={['wrong', 'outdated', 'translation', 'map', 'other'].map(v => ({ value: v, label: t(v) }))}/><label className="field"><span>{t('details')}</span><textarea className="text-input" maxLength={500} rows={4} value={detail} onChange={e => setDetail(e.target.value)}/></label><button className="btn primary" disabled={busy}>{t('sendReport')}<Send size={17}/></button></form></DialogContent></Dialog>; }
function Rankings() { const app=useApp();const { t, fail, boot } = app; const [rankingError, setRankingError] = useState(false), [rankingRetry, setRankingRetry] = useState(0); const [period, setPeriod] = useState('all'), [category, setCategory] = useState('wins'), [entries, setEntries] = useState<any[] | null>(null); useEffect(() => { setEntries(null); setRankingError(false); api(`/leaderboard?period=${period}&category=${category}`).then(r => setEntries(r.entries)).catch(() => setRankingError(true)); }, [period, category, rankingRetry]); return <div className="rankings-page"><div className="page-heading"><span className="eyebrow"><Trophy size={16}/>{t('leaderboard')}</span><h1>{t('leaderboardTitle')}</h1><p>{t('leaderboardSub')}</p></div><CompetitionPanel app={app}/><h2 className="ranking-multiplayer-heading">{t('multiplayer')}</h2><div className="ranking-filters"><Tabs value={period} onValueChange={setPeriod}><TabsList className="app-tabs"><TabsTrigger value="daily">{t('dailyPeriod')}</TabsTrigger><TabsTrigger value="weekly">{t('weekly')}</TabsTrigger><TabsTrigger value="all">{t('allTime')}</TabsTrigger></TabsList></Tabs><Choice label={t('score')} value={category} onChange={setCategory} options={['wins', 'score', 'xp'].map(v => ({ value: v, label: t(v === 'score' ? 'totalScore' : v) }))}/></div><section className="panel leaderboard-table"><div className="table-heading"><span>{t('rank')}</span><span>{t('player')}</span><span>{t(category === 'score' ? 'totalScore' : category)}</span></div>{rankingError ? <Empty title={t('connectionError')}><button className="btn secondary" onClick={() => setRankingRetry(n => n+1)}>{t('retry')}</button></Empty> : entries === null ? <Loading /> : entries.length ? entries.map((p, i) => <div key={p.id} className={'leaderboard-row ' + (p.id === boot.user.id ? 'is-you' : '')}><span className={'leader-rank rank-' + (i + 1)}>{i < 3 ? <Medal size={23}/> : String(i + 1).padStart(2, '0')}</span><div><Avatar id={p.avatar}/><strong>{p.name}{p.id === boot.user.id && <small> · {t('you')}</small>}</strong></div><strong>{formatScore(p.score)}</strong></div>) : <Empty title={t('noResults')} copy={t('noResultsCopy')} icon={Trophy}><A href="/" className="btn primary">{t('playNow')}<ArrowRight size={17}/></A></Empty>}</section><p className="center-note"><ShieldCheck size={16}/>{t('communitySub')}</p></div>; }
function Profile() {
    const { t, boot, refresh, setModal, fail, go, start, copy, locale, measurement, setMeasurement } = useApp();
    const s = boot.stats, u = boot.user;
    const [edit, setEdit] = useState(false), [name, setName] = useState(u.name), [avatar, setAvatar] = useState(u.avatar), [discoverable, setDiscoverable] = useState(u.discoverable), [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false);
    const save = async (e: any) => { e.preventDefault(); setBusy(true); try {
        await api('/profile', { method: 'PATCH', body: JSON.stringify({ name, avatar, discoverable }) });
        await refresh();
        setEdit(false);
    }
    catch (e) {
        fail(e);
    }
    finally {
        setBusy(false);
    } };
    return <div className="profile-page"><div className="page-heading"><span className="eyebrow"><BookOpen size={16}/>{t('profile')}</span><h1>{t('passportTitle')}</h1><p>{t('passportSub')}</p></div><section className="passport-header panel"><Avatar id={u.avatar} size="large"/><div className="passport-name"><h2>{u.name}</h2><span>{t('level')} {s.level} · {t(s.level >= 100 ? 'master' : s.level >= 50 ? 'cartographer' : s.level >= 25 ? 'navigator' : s.level >= 10 ? 'explorerLevel' : 'beginner')}</span><Progress value={s.levelProgress} className="xp-progress"/><small>{formatScore(s.xp)} {t('multiplayerXP')}</small></div><button className="btn secondary" onClick={() => setEdit(true)}><Settings2 size={17}/>{t('editProfile')}</button></section>{u.guest && <div className="guest-banner"><p><ShieldCheck size={19}/>{t('guestPassport')}</p><button className="btn primary" onClick={() => setModal('signup')}>{t('signUp')}<ArrowRight size={17}/></button></div>}
 <PassportCollection stats={s} t={t} locale={locale} onStart={() => start({...DEFAULT_SETTINGS,mode:'flags',count:5})}/>
 <div className="profile-stats">{[[Compass, s.games, 'gamesPlayed'], [Target, s.accuracy + '%', 'accuracy'], [Trophy, s.wins, 'wins'], [Flame, s.dailyStreak, 'dailyStreak'], [Zap, formatScore(s.score), 'multiplayerPoints'], [CheckCircle2, s.correct ?? 0, 'correctAnswers']].map(([Icon, value, key]: any) => <div className="panel stat-card" key={key}><Icon size={20}/><strong>{value}</strong><span>{t(key)}</span></div>)}</div><div className="profile-action-grid"><section className="panel practice-card"><span className="mode-symbol tone-trail"><Route size={26}/></span><h2>{t('practice')}</h2><p>{t(s.reviews?.length ? 'practiceCopy' : 'emptyPractice')}</p><button className="btn secondary" onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed' }, true)}>{t('playNow')}<ArrowRight size={17}/></button></section><section className="panel friend-promo"><div className="avatar-stack"><Avatar id={1}/><Avatar id={2}/><Avatar id={6}/></div><h2>{t('friends')}</h2><p>{t('friendsEmpty')}</p><A href="/friends" className="btn secondary">{t('friends')}<ArrowRight size={17}/></A></section></div>
 <section className="review-section"><div className="section-heading"><h2>{t('reviewKnowledge')}</h2><span>{s.discovered ?? 0} {t('countriesDiscovered')}</span></div>{s.reviews?.length ? <div className="review-grid">{s.reviews.map((r:any) => <article className="review-card" key={r.key}>{r.content.country?.flag && <img className="review-country-flag" src={r.content.country.flag} alt="" width="36" height="26"/>}<strong>{r.content.country?.name?.[locale] ?? r.content.countries?.find((c:any) => c.id===r.country_id)?.name?.[locale] ?? r.content.answerLabel?.[locale] ?? r.country_id}</strong><span>{t(r.mode)}{r.content.topic && ' · ' + r.content.topic.label[locale]}</span><p>{r.content.fact?.[locale] ?? r.content.topic?.explanation[locale] ?? t('reviewClue')}</p><button className="btn secondary" onClick={async () => { try { const game = await post('/practice/' + encodeURIComponent(r.key)); go(game.href); } catch (e) { fail(e); } }}>{t('reviewAgain')}<ArrowRight size={16}/></button></article>)}</div> : <p className="muted">{t('emptyPractice')}</p>}</section>
 <section className="achievements-section"><div className="section-heading"><h2>{t('achievements')}</h2><span className="muted">{s.achievements.length} / {ACHIEVEMENTS.length} {t('unlocked')}</span></div><div className="achievement-grid">{ACHIEVEMENTS.map((a, i) => { const earned = s.achievements.includes(a.id); const Icon = [Compass, Mountain, Star, Flag, Trophy, Sunrise][i % 6]; return <div className={'achievement ' + (earned ? 'earned' : '')} key={a.id}><span className="achievement-badge"><span className="achievement-emoji" aria-hidden="true">{['🧭','🏔️','⭐','🚩','🏆','☀️'][i % 6]}</span>{!earned && <LockKeyhole size={12} className="achievement-lock"/>}</span><strong>{a[locale as Locale]}</strong><small>{earned ? <><Check size={12}/>{t('unlocked')}</> : a.target + ' ' + t(({ games: 'gamesPlayed', correct: 'correctAnswer', xp: 'xp', bestStreak: 'streak', dailyCount: 'daily', dailyStreak: 'dailyStreak', wins: 'wins', multiGames: 'multiplayer', perfect: 'perfect' } as any)[a.metric] ?? a.metric)}</small></div>; })}</div></section>
 <section className="panel recent-section"><h2>{t('recentGames')}</h2>{s.recent.length ? s.recent.map((g: any) => <div className="recent-game" key={g.id}><span className={'mode-symbol small tone-' + g.mode}><ModeEmoji mode={g.mode}/></span><div><strong>{t(g.mode)}</strong><span>{new Date(g.created_at).toLocaleDateString(locale)}</span></div><span>{t(g.multiplayer ? 'multiplayer' : 'soloLearning')}</span><strong>{g.multiplayer ? formatScore(g.score) : `${g.correct}/${g.total}`} <small>{t(g.multiplayer ? 'points' : 'correctAnswers')}</small></strong></div>) : <Empty title={t('noGames')}/>}</section>
 <div className="switch-field metrics-choice"><label htmlFor="metrics-choice">{t('optionalMetrics')}<p>{t('optionalMetricsCopy')}</p></label><Switch id="metrics-choice" checked={measurement} onCheckedChange={setMeasurement}/></div><div className="account-actions"><a href="/api/export" className="text-link" download><Download size={16}/>{t('export')}</a>{!u.guest && <button className="text-link" onClick={async () => { try {
        await post('/auth/logout');
        await refresh();
        go('/');
    }
    catch (e) {
        fail(e);
    } }}><LogOut size={16}/>{t('logout')}</button>}<button className="text-link danger" onClick={() => setDeleting(true)}><Trash2 size={16}/>{t('deleteAccount')}</button></div>
 <Dialog open={edit} onOpenChange={setEdit}><DialogContent className="app-modal"><DialogTitle className="modal-title">{t('editProfile')}</DialogTitle><DialogDescription>{t('nameHint')}</DialogDescription><form onSubmit={save} className="form-stack"><label className="field"><span>{t('displayName')}</span><input className="text-input" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/></label><AvatarPicker value={avatar} onChange={setAvatar}/><div className="switch-field"><label htmlFor="discoverable">{t('discoverable')}</label><Switch id="discoverable" checked={discoverable} onCheckedChange={setDiscoverable}/></div><button type="button" className="friend-code-display" onClick={() => copy(u.friendCode)}><span>{t('friendCode')}</span><b>{u.friendCode}</b><Copy size={16}/></button><button className="btn primary" disabled={busy}>{t('save')}<Check size={17}/></button></form></DialogContent></Dialog>
 <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent className="app-modal"><AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('deleteCopy')}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction className="delete-button" onClick={async () => { try {
        await api('/profile', { method: 'DELETE' });
        await refresh();
        go('/');
    }
    catch (e) {
        fail(e);
    } }}>{t('deleteConfirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
function Friends() { const { t, boot, setModal, fail, copy } = useApp(); const [friends, setFriends] = useState<any[]>([]), [code, setCode] = useState(''), [busy, setBusy] = useState(false); const load = () => { if (!boot.user.guest)
    api('/friends').then(r => setFriends(r.friends)).catch(fail); }; useEffect(load, [boot.user.id, boot.user.guest]); const action = async (id: string, status: string) => { try {
    await post('/friends/' + id, { status });
    load();
}
catch (e) {
    fail(e);
} }; return <div className="friends-page"><div className="page-heading"><span className="eyebrow"><Users size={16}/>{t('friends')}</span><h1>{t('friendsTitle')}</h1></div>{boot.user.guest ? <Empty icon={Users} title={t('accountRequired')} copy={t('guestPassport')}><button className="btn primary" onClick={() => setModal('signup')}>{t('signUp')}</button></Empty> : <><div className="friend-actions panel"><button className="friend-code-display" onClick={() => copy(boot.user.friendCode)}><span>{t('friendCode')}</span><b>{boot.user.friendCode}</b><Copy size={16}/></button><form className="friend-code-form" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
    await post('/friends', { code });
    setCode('');
    toast.success(t('friendSaved'));
    load();
}
catch (e) {
    fail(e);
}
finally {
    setBusy(false);
} }}><label className="sr-only" htmlFor="friend-code">{t('friendCode')}</label><input className="text-input" id="friend-code" placeholder={t('friendPlaceholder')} maxLength={8} minLength={8} value={code} onChange={e => setCode(e.target.value.toUpperCase())} required/><button className="btn primary" disabled={busy}><Plus size={18}/>{t('addFriend')}</button></form></div>{friends.filter(f => f.status !== 'blocked').length ? <div className="friend-list">{friends.filter(f => f.status !== 'blocked').map(f => <div className="panel friend-card" key={f.id}><Avatar id={f.avatar} size="large"/><div><h3>{f.name}</h3><p>{formatScore(f.score)} {t('multiplayerPoints')}</p></div>{f.status === 'pending' ? f.to_id === boot.user.id ? <div className="friend-button-row"><button className="btn primary" onClick={() => action(f.id, 'accepted')}>{t('accept')}</button><button className="btn secondary" onClick={() => action(f.id, 'rejected')}>{t('decline')}</button></div> : <span className="muted">{t('pending')}</span> : <button className="btn secondary" onClick={() => setModal('room')}><Users size={17}/>{t('createRoom')}</button>}<button className="text-link muted" onClick={() => action(f.id, 'blocked')}>{t('block')}</button></div>)}</div> : <Empty icon={Users} title={t('friendsEmpty')} copy={t('friendsEmptyCopy')}/>}</>}</div>; }
function Explore() { const { t, locale } = useApp(); const [data, setData] = useState<any[]>([]), [query, setQuery] = useState(''), [region, setRegion] = useState('World'), [selected, setSelected] = useState<any>(null), [error, setError] = useState(false), [reload, setReload] = useState(0); useEffect(() => { setError(false); fetch('/data/countries.json', { signal: AbortSignal.timeout(10000) }).then(r => r.json()).then(setData).catch(() => setError(true)); }, [reload]); const visible = data.filter(c => (region === 'World' || c.region === region) && [c.name, c.nl, spanishCountry(c.name), ...c.capitals, ...c.capitals.map(spanishCapital)].join(' ').toLowerCase().includes(query.toLowerCase())); return <div className="explore-page"><div className="page-heading"><span className="eyebrow"><Globe2 size={16}/>{t('explore')}</span><h1>{t('exploreTitle')}</h1><p>{t('exploreSub')}</p></div><div className="explore-filters"><label className="search-box"><Search size={19}/><input aria-label={t('searchCountries')} placeholder={t('searchCountries')} value={query} onChange={e => setQuery(e.target.value)}/></label><Choice label={t('region')} value={region} onChange={setRegion} options={REGIONS.map(v => ({ value: v, label: t(v) }))}/></div>{error ? <Empty title={t('connectionError')}><button className="btn secondary" onClick={() => setReload(n => n+1)}>{t('retry')}</button></Empty> : !data.length ? <Loading /> : visible.length ? <div className="country-grid">{visible.map(c => <button className="country-card" key={c.id} onClick={() => setSelected(c)}><img src={c.flag} alt="" loading="lazy"/><div><strong>{locale === 'es' ? spanishCountry(c.name) : locale === 'nl' ? c.nl : c.name}</strong><span>{c.capitals.map((n:string)=>locale === 'es' ? spanishCapital(n) : n).join(' / ')}</span></div><ArrowUpRight size={17}/></button>)}</div> : <Empty title={t('exploreEmpty')}/>}<A href="/sources" className="text-link data-notice">{t('dataNotice')}<ArrowUpRight size={15}/></A><Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}><DialogContent className="app-modal country-modal">{selected && <><img src={selected.flag} alt="" className="country-detail-flag"/><DialogTitle className="modal-title">{locale === 'es' ? spanishCountry(selected.name) : locale === 'nl' ? selected.nl : selected.name}</DialogTitle><DialogDescription>{selected.official}</DialogDescription><dl className="country-facts">{[['capital', selected.capitals.map((n:string)=>locale==='es'?spanishCapital(n):n).join(' / ')], ['region', t(selected.region)], ['area', formatScore(selected.area) + ' km²'], ['currency', selected.currencies.map((n:string)=>locale==='es'?spanishContent(n):n).join(', ')], ['languages', selected.languages.map((n:string)=>locale==='es'?spanishContent(n):n).join(', ')], ['landBorders', selected.borders.map((id: string) => { const c = data.find(c => c.id === id); return c ? (locale === 'es' ? spanishCountry(c.name) : locale === 'nl' ? c.nl : c.name) : id; }).join(', ') || t('noBorder')]].map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl><A href="/sources" className="text-link">{t('sources')}<ArrowUpRight size={15}/></A></>}</DialogContent></Dialog></div>; }
function Admin() { const { t, boot, fail, locale } = useApp(); const [data, setData] = useState<any>(null), [loadError, setLoadError] = useState(false); const load = () => { setLoadError(false); return api('/admin').then(setData).catch(() => setLoadError(true)); }; useEffect(() => { if (boot.isAdmin)
    load(); }, [boot.isAdmin]); const action = async (action: string, id: string) => { try {
    await post('/admin', { action, id });
    load();
}
catch (e) {
    fail(e);
} }; if (!boot.isAdmin)
    return <Empty icon={LockKeyhole} title={t('adminRestricted')}/>; return <div><div className="page-heading"><span className="eyebrow">{t('admin')}</span><h1>{t('adminTitle')}</h1></div>{data ? <><p className="muted">{data.countryCount} · {data.dailySeed}</p><section className="admin-daily"><h2>{t('adminDaily')}</h2><p>{t('adminHistory')}</p>{data.dailyContent?.map((day:any) => <details key={day.date+day.kind}><summary>{day.date} · {t(day.kind.replace('puzzle:',''))} · {day.dataset_version}</summary>{day.content.questions?.map((q:any) => <article className="admin-report" key={q.id}><div><strong>{q.prompt?.[locale] ?? q.topic?.prompt[locale]}</strong><p>{q.answerLabel?.[locale] ?? q.countries?.map((c:any) => c.name[locale] + ': ' + c.value).join(' / ')}</p><small>{q.id}</small></div><button className="btn secondary" onClick={() => action('disable',q.id)}>{t('disable')}</button></article>)}{day.content.board && <article className="admin-report"><div><strong>{day.content.board.countries.map((c:any) => c.name[locale]).join(' · ')}</strong><p>{day.content.board.tiles.filter((tile:any)=>tile.kind==='fact').map((tile:any)=>tile.text[locale]).join(' / ')}</p></div><button className="btn secondary" onClick={() => action('disable',day.content.board.id)}>{t('disable')}</button></article>}</details>)}</section><section className="panel"><h2>{t('measuredEvents')}</h2><p>{t('metricsSample')}</p>{data.funnel?.length ? data.funnel.map((e:any) => <p key={e.event}>{e.event}: {e.count}</p>) : <p>{t('noResults')}</p>}</section><section className="panel admin-panel">{data.reports.length ? data.reports.map((r: any) => <div className="admin-report" key={r.id}><div><strong>{r.question_id}</strong><p>{t(r.category)} · {r.detail}</p><small>{r.status}</small></div><button className="btn secondary" onClick={() => action('resolve', r.id)}>{t('resolve')}</button><button className="btn secondary" onClick={() => action('disable', r.question_id)}>{t('disable')}</button></div>) : <Empty title={t('reportsEmpty')}/>}</section>{data.suspicious.map((r: any) => <div className="panel admin-report" key={r.id}><strong>{r.name}</strong><span>{r.score}</span><button className="btn secondary" onClick={() => action('block', r.user_id)}>{t('blockUser')}</button></div>)}</> : loadError ? <Empty title={t('connectionError')}><button className="btn secondary" onClick={load}>{t('retry')}</button></Empty> : <Loading />}</div>; }
function InfoPage({ kind }: {
    kind: string;
}) { const { t, locale } = useApp(); const nl = locale === 'nl'; if(locale === 'es')return <SpanishInfo kind={kind}/>; return <article className="info-page"><A href="/" className="text-link"><ArrowLeft size={16}/>{t('back')}</A><h1>{t(kind === 'sources' ? 'sourceTitle' : kind === 'privacy' ? 'privacyTitle' : 'termsTitle')}</h1>{kind === 'sources' ? <><p>{nl ? 'Onze vragen worden opgebouwd uit open geografische gegevens. De database gebruikt 193 VN-lidstaten en de twee waarnemersstaten.' : 'Our questions are generated from open geographic data. The country collection uses 193 UN members and two observer states.'}</p><div className="source-card"><h2>World countries · 5.1.0</h2><p>Mohammed Le Doze & contributors · ODbL 1.0 · 2026-09-08</p><p>Contains information from World countries, made available under the Open Database License.</p><a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">github.com/mledoze/countries ↗</a><a href="/data/countries.json" download>{t('sourceDownload')} ↓</a><a href="/data/boundaries.json" download>{t('mapBoundaryData')} ↓</a><a href="/licenses/countries-ODbL.txt">ODbL 1.0</a></div><div className="source-card"><h2>World Development Indicators · 2023</h2><p>The World Bank · CC BY 4.0 · 2026-09-09</p><p>{nl ? 'Tien indicatoren voor bevolking, steden, levensverwachting, vruchtbaarheid, bbp, bos, landbouw, export en internet. Bronnen: World Bank, nationale statistiekbureaus, VN-bevolkingsdivisie, Eurostat, OESO, FAO en ITU; exacte bronvermelding per indicator in het downloadbestand. Gefilterd op 2023 en onze landenselectie. Geen vervangende waarden voor ontbrekende cijfers; alleen de weergave wordt afgerond.' : 'Ten indicators covering population, cities, life expectancy, fertility, GDP, forests, agriculture, exports and internet use. Providers include the World Bank, national statistical offices, UN Population Division, Eurostat, OECD, FAO and ITU; exact provider credits are retained per indicator in the download. Filtered to 2023 and our country roster. Missing observations are omitted; only display values are rounded.'}</p><a href="https://datacatalog.worldbank.org/search/dataset/0037712/world-development-indicators" target="_blank" rel="noreferrer">The World Bank: World Development Indicators ↗</a><a href="https://www.worldbank.org/ext/en/legal/terms-conditions/datasets" target="_blank" rel="noreferrer">CC BY 4.0 + World Bank terms ↗</a><a href="/data/comparisons.json" download>{t('sourceDownload')} ↓</a><a href="/data/silhouettes.json" download>{nl ? 'Afgeleide silhouetten · ODbL 1.0' : 'Derived silhouettes · ODbL 1.0'} ↓</a></div><MosaicSources locale={nl ? 'nl' : 'en'}/><div className="source-card"><h2>Natural Earth · world-atlas 2.0.2</h2><p>{nl ? 'Kaartgegevens in het publieke domein. World-atlas is ISC-gelicenseerd. Vereenvoudigde geometrie op schaal 1:110 miljoen; zeer kleine landen zijn niet altijd zichtbaar.' : 'Public domain map data. World-atlas is ISC licensed. Simplified geometry at 1:110 million scale; very small countries may not be visible.'}</p><p>Made with Natural Earth. world-atlas © Michael Bostock.</p><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth ↗</a><a href="/licenses/world-atlas-ISC.txt">ISC</a></div><div className="source-card"><h2>flag-icons · 7.5.0</h2><p>© Panayiotis Lipiridis · MIT</p><a href="https://github.com/lipis/flag-icons" target="_blank" rel="noreferrer">github.com/lipis/flag-icons ↗</a><a href="/licenses/flags-MIT.txt">MIT</a></div><h2>{nl ? 'Geografische keuzes' : 'Geographic choices'}</h2><p>{nl ? 'Een kaart is een leermiddel, geen politieke uitspraak. Omstreden hoofdstadvragen en een selectie gevoelige grensvragen zijn uitgesloten. Nieuwe Pinpoint-spellen toetsen aan vereenvoudigde landsgrenzen, met 25 km tolerantie. Oudere sessies behouden hun aangegeven regel met een representatief punt. Vergelijkingsvragen gebruiken cijfers uit 2023. Silhouetten tonen vereenvoudigde hoofdlandmassa’s; kleine en verafgelegen eilanden kunnen ontbreken.' : 'A map is a learning tool, not a political statement. Disputed capital questions and selected sensitive border questions are excluded. New Pinpoint games use simplified country boundaries with a 25 km tolerance. Older sessions retain their stated representative-point rule. Comparison questions use 2023 observations. Silhouettes show simplified main landmasses; small and remote islands may be omitted.'}</p><h2>{nl ? 'Vormgeving en code' : 'Design and code'}</h2><p>{nl ? 'Eigen productontwerp, teksten, vraaggenerator en wereldbol-merkteken. De wereldbol is een originele, gegenereerde illustratie en wordt niet als quizkaart gebruikt. De vier dagspelillustraties en de paspoortstempels zijn voor Roviko ontworpen. Iconen: Lucide (ISC). Lettertypen: Nunito, Fredoka, Manrope en Outfit (SIL Open Font License).' : 'Original product design, copy, question generator and globe brand mark. The globe is an original generated illustration, and is not used as a quiz map. The four daily-game illustrations and passport stamps were designed for Roviko. Icons: Lucide (ISC). Fonts: Nunito, Fredoka, Manrope and Outfit (SIL Open Font License).'}</p><div className="source-card"><h2>{t('sourceAssetLicenses')}</h2><p>Nunito Project Authors · Fredoka Project Authors · Manrope Project Authors · Outfit Project Authors · Lucide contributors</p><a href="/fonts/nunito-LICENSE">Nunito · OFL 1.1</a><a href="/fonts/fredoka-LICENSE">Fredoka · OFL 1.1</a><a href="/fonts/manrope-LICENSE">Manrope · OFL 1.1</a><a href="/fonts/outfit-LICENSE">Outfit · OFL 1.1</a><a href="/licenses/lucide-ISC.txt">Lucide · ISC</a></div></> : kind === 'privacy' ? <><p className="policy-note">{t('privacyNote')}</p><h2>{nl ? 'Wat we bewaren' : 'What we keep'}</h2><p>{nl ? 'Bij gastspel bewaren we een willekeurige sessiecode, je gekozen spelersnaam, spelresultaten en voortgang. Bij een account komen daar je e-mailadres en een gezouten wachtwoordhash bij. We bewaren nooit je leesbare wachtwoord.' : 'Guest play stores a random session identifier, your chosen display name, results and progress. Accounts also store your email and a salted password hash. We never store your readable password.'}</p><h2>{nl ? 'Functionele opslag' : 'Essential storage'}</h2><p>{nl ? 'Een functionele cookie houdt je ingelogd. Thema, taal en geluidsvoorkeur blijven lokaal in je browser. Er zijn geen advertentietrackers. Je kunt in je paspoort optionele productmetingen aanzetten. Die bewaren gebeurtenistypen en afgeschermde identificaties, zonder je naam, e-mailadres, IP-adres of antwoorden. De voorkeurcookie bevat alleen aan of uit. Scores en namen verschijnen in spelrooms en ranglijsten.' : 'An essential cookie keeps your session signed in. Theme, language and sound preferences stay in your browser. There are no advertising trackers. You can enable optional product measurement in your passport. It stores event types and pseudonymous digests, without your name, email, IP address or answers. Its preference cookie contains only on or off. Scores and display names appear in game rooms and rankings.'}</p><h2>{nl ? 'Jouw keuzes' : 'Your choices'}</h2><p>{nl ? 'In je paspoort kun je vriendschapsverzoeken uitschakelen, je gegevens downloaden en je account verwijderen. Gastvoortgang is verbonden aan de sessiecookie. Sessies verlopen na 30 dagen. Rooms verlopen na 30 minuten zonder actieve spelers.' : 'In your passport you can disable friend requests, download your data and delete your account. Guest progress is tied to the session cookie. Sessions expire after 30 days. Rooms expire after 30 minutes without active players.'}</p><A href="/profile" className="btn secondary">{t('profile')}<ArrowRight size={16}/></A><h2>{nl ? 'Voor commerciële ingebruikname' : 'Before commercial launch'}</h2><p>{nl ? 'De beheerder moet nog de verwerkingsverantwoordelijke, contactgegevens, bewaartermijnen en toepasselijke voorwaarden vaststellen en deze concepttekst juridisch laten beoordelen.' : 'The operator must establish the data controller, contact details, retention schedule and applicable terms, and have this draft reviewed before commercial launch.'}</p></> : <><p className="policy-note">{t('privacyNote')}</p><h2>{nl ? 'Speel eerlijk' : 'Play fairly'}</h2><p>{nl ? 'Gebruik een vriendelijke spelersnaam. Manipuleer geen scores, automatiseer geen ranglijstinzendingen en verstoor geen rooms van anderen. Accounts bij ernstige overtredingen kunnen worden geblokkeerd.' : 'Choose a friendly display name. Do not manipulate scores, automate ranking entries or disrupt other players’ rooms. Serious abuse may result in an account being blocked.'}</p><h2>{nl ? 'Leer met een open blik' : 'Learn with an open mind'}</h2><p>{nl ? 'Geografische kennis kan veranderen. Meld een vraag als je een fout ziet. Kaarten zijn vereenvoudigd; landsgrenzen geven geen standpunt over soevereiniteit weer.' : 'Geographic knowledge can change. Report a question if you spot an error. Maps are simplified and boundaries do not express a position on sovereignty.'}</p><h2>{nl ? 'Gratis spelen' : 'Free to play'}</h2><p>{nl ? 'De huidige spellen zijn gratis. Er zijn geen betalingen of koopbare kennisvoordelen. Bronlicenties blijven van toepassing op de geografische data en gebruikte open assets.' : 'The current games are free. There are no payments or purchasable answer advantages. Source licences continue to apply to geographic data and open assets.'}</p><A href="/sources" className="text-link">{t('sources')}<ArrowUpRight size={16}/></A></>}</article>; }
function SEOPage({ slug }: {
    slug: string;
}) { const { t, start } = useApp(); const modes: Record<string, string> = { 'world-geography-quiz': 'mixed', 'flags-quiz': 'flags', 'capitals-quiz': 'capitals', 'country-map-quiz': 'pinpoint', 'europe-geography-quiz': 'mixed', 'africa-geography-quiz': 'mixed' }; const m = modes[slug]; if (!m)
    return <Empty title="404"><A href="/" className="btn primary">{t('home')}</A></Empty>; const region = slug.startsWith('europe') ? 'Europe' : slug.startsWith('africa') ? 'Africa' : 'World'; return <div className="seo-page"><span className={'mode-symbol tone-' + m}>{React.createElement(icons[m], { size: 34 })}</span><h1>{t(m)} · {t(region)}</h1><p>{t(m === 'mixed' ? 'modeSub' : m + 'Desc')}</p><button className="btn primary" onClick={() => start({ ...DEFAULT_SETTINGS, mode: m, region })}>{t('playNow')}<ArrowRight size={18}/></button></div>; }
