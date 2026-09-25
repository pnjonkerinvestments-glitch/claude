'use client';
import { DailyScoreRule } from './atelier/Competition';
import { withSpanish } from '../i18n/content';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { ArrowRight, Compass, Globe2, Flag, MapPin, Route, ListOrdered, Building2, Users, Flame, Trophy, Zap, Clock, Check, Copy, Link as LinkIcon, Star, Target, ArrowUpRight, Settings2, LogOut, ShieldCheck, LockKeyhole, X, CheckCircle2, Send, Sunrise, Crown, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Toaster, toast } from 'sonner';
import { BRAND, DEFAULT_SETTINGS, MODES, REGIONS } from '@/lib/config';
import { messages, errorMessage, type Locale } from '@/i18n/messages';
import { api, post, copyText, formatScore, sound, readPreference, writePreference, metric } from '@/lib/client';
import { NextDiscovery } from './atelier/NextDiscovery';
import { DailyResult } from './atelier/DailyResult';
import { returnDestination, navigationState } from '@/lib/navigation';
import { GameHeader, editionLabel } from './game/GameHeader';
import { musicPlaying, startMusic, stopMusic } from '@/lib/audio';
import { Question } from './game/Question';
import { SoloResults } from './game/SoloResults';
import { PuzzleDeck, openPuzzle } from './puzzles/PuzzleDeck';
import { HowToPlayButton, HowToPlayPage } from './atelier/HowToPlay';
import { GameIcon } from './atelier/GameIcon';
const RankGame = React.lazy(() => import('./puzzles/RankGame').then(m => ({ default: m.RankGame })));
const PuzzleGame = React.lazy(() => import('./puzzles/PuzzleGame').then(m => ({ default: m.PuzzleGame })));
const DuelGame = React.lazy(() => import('./puzzles/DuelGame').then(m => ({ default: m.DuelGame })));
import { evaluateLearning } from '@/lib/game-engine/learning';
import { pageTitle } from '@/lib/page-title';
import { shareResult } from '@/lib/share';
import { createRoomClient } from '@/lib/realtime/room-client';
import { AppContext, useApp } from './app/context';
import { SiteHeader } from './shell/SiteHeader';
import { ErrorState, PageHeader } from './ds/States';
import { HomePage } from './home/HomePage';
const ScoringPage = React.lazy(() => import('./pages/ScoringPage').then(m => ({ default: m.ScoringPage })));
const ExplorePage = React.lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })));
const RankingsPage = React.lazy(() => import('./pages/RankingsPage').then(m => ({ default: m.RankingsPage })));
const PassportPage = React.lazy(() => import('./pages/PassportPage').then(m => ({ default: m.PassportPage })));
import { MultiplayerPage, RoomProblem } from './pages/MultiplayerPage';
import { AccountPage } from './pages/AccountPage';
import { SettingsPage } from './pages/SettingsPage';
import { LobbyComputer, QuickSearch, removeComputer } from './multiplayer/Computer';
import { PlayerActions } from './multiplayer/PlayerActions';
const InfoPage = React.lazy(() => import('./pages/InfoPages').then(m => ({ default: m.InfoPage })));
import { FriendsPage, InvitePanel, InviteInbox, usePresence } from './friends/Friends';
import { A, Avatar, AvatarPicker, Choice, Empty, Loading, Logo, ModeEmoji } from './app/shared';
const icons: any = { trail: Compass, capitals: Building2, flags: Flag, pinpoint: MapPin, borders: Route, order: ListOrdered, mixed: Globe2, daily: Sunrise };
const PUBLIC_BOOT = { user: { id: '', name: 'Explorer', avatar: 0, guest: true, discoverable: true, friendCode: '' }, stats: { games: 0, score: 0, xp: 0, level: 1, levelProgress: 0, accuracy: 0, averageTime: 0, wins: 0, dailyStreak: 0, dailyCount: 0, dailyDone: false, bestStreak: 0, achievements: [], recent: [], weak: [], modes: [] }, community: { games: 0, players: 0 }, countryCount: 195, leaders: [], googleEnabled: false, isAdmin: false };
function GameSettings({ value, onChange, multiplayer = false, disabled = false }: any) { const { t } = useApp(); const set = (k: string, v: any) => onChange({ ...value, [k]: v }); return <div className="settings-grid">{multiplayer && <fieldset className="mode-picker" disabled={disabled}><legend>{t('play')}</legend><div>{['mixed', ...MODES].map(v => <button type="button" key={v} aria-pressed={value.mode === v} className="mode-pick" onClick={() => set('mode', v)}><GameIcon mode={v} size="sm"/><span>{t(v)}</span></button>)}</div></fieldset>}{multiplayer ? <fieldset className="round-options" disabled={disabled}><legend>{t('rounds')}</legend><div>{[5,10,15,20].map(n=><button type="button" key={n} aria-pressed={value.count===n} className={'btn '+(value.count===n?'primary':'secondary')} onClick={()=>set('count',n)}>{n}</button>)}</div></fieldset> : <Choice label={t('rounds')} value={value.count} disabled={disabled} onChange={v => set('count', +v)} options={[5, 10, 15, 20].map(v => ({ value: v, label: v + ' ' + t('questions') }))}/>}{multiplayer && <Choice label={t('timer')} value={value.timer} disabled={disabled} onChange={v => set('timer', +v)} options={[5, 10, 15, 30, 0].map(v => ({ value: v, label: v ? v + ' sec' : t('unlimited') }))}/>}<Choice label={t('difficulty')} value={value.difficulty} disabled={disabled} onChange={v => set('difficulty', v)} options={['easy', 'medium', 'hard', 'mixed'].map(v => ({ value: v, label: t(v) }))}/><Choice label={t('region')} value={value.region} disabled={disabled} onChange={v => set('region', v)} options={REGIONS.map(v => ({ value: v, label: t(v) }))}/>{multiplayer && value.mode === 'mixed' && <fieldset className="enabled-modes" disabled={disabled}><legend>{t('includedModes')}</legend><p>{t('includedModesHelp')}</p>{MODES.map(m=>{const included=value.enabledModes??[...MODES];const checked=included.includes(m);return <label key={m}><input type="checkbox" checked={checked} disabled={disabled||(checked&&included.length===1)} onChange={()=>set('enabledModes',checked?included.filter((x:string)=>x!==m):[...included,m])}/><ModeEmoji mode={m}/><span><strong>{t(m)}</strong><small>{t(m+'Hint')}</small></span></label>;})}<small>{t('keepOneMode')}</small></fieldset>}{!multiplayer && value.mode === 'capitals' && <div className="switch-field"><div><label htmlFor="typed-choice">{t('typed')}</label><p>{t('typedHelp')}</p></div><Switch id="typed-choice" checked={!!value.typed} onCheckedChange={v => set('typed', v)}/></div>}</div>; }
function useClock() { const [now, setNow] = useState(Date.now()); useEffect(() => { const id = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(id); }, []); return now; }
function seconds(ms: number) { return Math.max(0, Math.ceil(ms / 1000)); }
function prettyTime(ms: number) { const total = Math.round(ms / 1000); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; }
export default function RovikoApp({ initialPath = '/' }: {
    initialPath?: string;
}) {
    const [path, setPath] = useState(initialPath), [locale, setLocale] = useState<Locale>('en'), [theme, setTheme] = useState('light'), [muted, setMuted] = useState(true), [music, setMusic] = useState(false), [boot, setBoot] = useState<any>(PUBLIC_BOOT), [fatal, setFatal] = useState(''), [modal, setModal] = useState<string | null>(null), [mode, setMode] = useState('flags'), [setup, setSetup] = useState<any>({ ...DEFAULT_SETTINGS, mode: 'flags' }), [busy, setBusy] = useState(false);
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
    useEffect(() => { setPath(window.location.pathname); const savedRegion=readPreference('rv_region','World'); setRegionState(REGIONS.includes(savedRegion) ? savedRegion : 'World'); setMeasurement(readPreference('rv_metrics','off') === 'on'); const savedLocale=readPreference('rv_locale','en'); setLocale(savedLocale === 'nl' || savedLocale === 'es' ? savedLocale : 'en'); setTheme(readPreference('rv_theme', 'light') || 'light'); setMuted(readPreference('rv_sound', 'off') !== 'on'); setMusic(readPreference('rv_music', 'off') === 'on'); refresh(); const pop = () => setPath(window.location.pathname); window.addEventListener('popstate', pop); if ('serviceWorker' in navigator)
        navigator.serviceWorker.register('/sw.js').catch(() => { }); return () => window.removeEventListener('popstate', pop); }, [refresh]);
    useEffect(() => { document.documentElement.dataset.theme = theme; writePreference('rv_theme', theme); }, [theme]);
    useEffect(() => { document.documentElement.lang = locale; writePreference('rv_locale', locale); }, [locale]);
    // Inside the App Store / Google Play app (Capacitor) or an installed home-screen app the page runs full screen:
    // mark it once so the layout can drop web-only parts (footer, skip link). `?app=1` previews this in a browser.
    useEffect(() => { let app = false; try { if (new URLSearchParams(location.search).get('app') === '1') sessionStorage.setItem('rv_app', '1'); app = sessionStorage.getItem('rv_app') === '1'; } catch { /* storage unavailable */ } const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }; if (app || w.Capacitor?.isNativePlatform?.() || window.matchMedia?.('(display-mode: standalone)').matches) document.documentElement.classList.add('is-app'); }, []);
    useEffect(() => { if (!path.startsWith('/game/') && !path.startsWith('/puzzle/')) document.title = pageTitle(path, t); }, [path, t]);
    const go = useCallback((href: string) => { window.history.pushState(navigationState(window.location.pathname, window.scrollY, window.history.state, href), '', href); setPath(href.split(/[?#]/)[0]); setModal(null); const hash = href.split('#')[1]; window.scrollTo({ top: 0, behavior: 'instant' }); if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' }), 350); }, []);
    const backToStart = () => { const back=returnDestination(window.history.state); go(back.path); requestAnimationFrame(() => window.scrollTo({top:back.scroll,behavior:'instant'})); };
    const start = async (settings: any, practice = false) => { if (starting.current) return; starting.current=true; setBusy(true); try {
        if (!boot.user.id)
            await refresh();
        const game = await post('/games', { settings: { ...settings, timer: 0 }, practice, competition:['daily','daily-trail'].includes(settings.mode) });
        // Start loading the first flag now, in parallel with opening the game screen.
        const q = game.question; if (q?.mode === 'flags' && (q.flagUrl || q.flag)) { const img = new Image(); img.src = q.flagUrl ?? '/api/flag/' + encodeURIComponent(q.flag); }
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
    const toggleSound = () => { setMuted(v => !v); writePreference('rv_sound', muted ? 'on' : 'off'); if (muted) sound('correct'); };
    // Music needs a tap before a browser plays it: start on the switch, or on the first tap of a visit when it was on before.
    const toggleMusic = () => { const on = !music; setMusic(on); writePreference('rv_music', on ? 'on' : 'off'); if (on) startMusic(); else stopMusic(); };
    useEffect(() => { if (!music || musicPlaying()) return; const first = () => startMusic(); window.addEventListener('pointerdown', first, { once: true }); return () => window.removeEventListener('pointerdown', first); }, [music]);
    const ctx = { bootLoaded, setLocale, setTheme, toggleSound, music, toggleMusic, backToStart, region, setRegion, measurement, setMeasurement: (on: boolean) => { setMeasurement(on); writePreference('rv_metrics',on ? 'on':'off'); document.cookie = 'rv_metrics=' + (on ? 'on':'off') + '; Path=/; SameSite=Lax; Max-Age=31536000' + (location.protocol === 'https:' ? '; Secure':''); }, t, locale, theme, go, boot, refresh, modal, setModal, playMode, start, busy, setBusy, fail, copy, muted, report: setReport };
    const gamePath = path.startsWith('/rank/') || path.startsWith('/game/') || path.startsWith('/room/') || path.startsWith('/puzzle/') || path === '/duel' || path === '/duel/practice';
    return <AppContext.Provider value={ctx}><a className="skip-link" href="#main">{t('skipToContent')}</a><SiteHeader path={path} hideTabs={gamePath}/>
 <main id="main" className={'site-main ' + (gamePath ? 'game-main' : '')}><React.Suspense fallback={<Loading variant={gamePath ? 'game' : 'page'}/>}>{fatal ? <ErrorState title={t('stateErrorTitle')} copy={t(errorMessage(fatal))} onRetry={refresh} retryLabel={t('retry')}/> : !bootLoaded && ['/game/', '/puzzle/', '/rank/', '/room/', '/profile', '/friends', '/account', '/admin', '/leaderboard'].some(v => path.startsWith(v)) ? <Loading variant={gamePath ? 'game' : path === '/leaderboard' || path === '/friends' ? 'list' : path === '/profile' ? 'passport' : 'page'}/> : path === '/' ? <HomePage /> : path === '/scoring' ? <ScoringPage /> : path === '/multiplayer' ? <MultiplayerPage /> : path.startsWith('/room/') ? <RoomScreen key={path} code={path.split('/')[2]}/> : path.startsWith('/game/') ? <SoloScreen key={path} id={path.split('/')[2]}/> : path.startsWith('/rank/') ? <RankGame key={path} id={path.split('/')[2]} app={ctx}/> : path.startsWith('/puzzle/') ? <PuzzleGame key={path} id={path.split('/')[2]} app={ctx}/> : path === '/daily' ? <AllGames /> : path === '/duel' || path === '/duel/practice' ? <DuelScreen key={path} practice={path === '/duel/practice'}/> : path === '/how-to-play' ? <HowToScreen /> : path === '/leaderboard' ? <RankingsPage /> : path === '/profile' ? <PassportPage /> : path === '/friends' ? <FriendsPage /> : path === '/account' ? <AccountPage /> : path === '/settings' ? <SettingsPage /> : path === '/explore' ? <ExplorePage /> : path === '/admin' ? <Admin /> : ['/privacy', '/terms', '/sources'].includes(path) ? <InfoPage kind={path.slice(1)}/> : <SEOPage slug={path.slice(1)}/>}</React.Suspense></main>
 {!gamePath && <footer className="app-footer"><div className="footer-inner"><div className="footer-brand"><A href="/" aria-label={BRAND.name}><Logo /></A><p>{t('footerCopy')}</p></div><nav className="footer-nav" aria-label={t('navMore')}><div><h2>{t('play')}</h2><A href="/daily">{t('viewAllGames')}</A><A href="/how-to-play">{t('howToLink')}</A><A href="/scoring">{t('scoringLink')}</A><A href="/leaderboard">{t('leaderboard')}</A></div><div><h2>{t('explore')}</h2><A href="/explore">{t('exploreAll')}</A><A href="/multiplayer">{t('togetherTitle')}</A><A href="/profile">{t('navPassport')}</A></div><div><h2>{BRAND.name}</h2><A href="/sources">{t('sourcesKicker')}</A><A href="/privacy">{t('privacy')}</A><A href="/terms">{t('terms')}</A><a href="mailto:support@roviko.app">{t('contact')}</a>{boot?.isAdmin && <A href="/admin">{t('admin')}</A>}</div></nav></div><p className="copyright">© {new Date().getFullYear()} {BRAND.name}</p></footer>}
 <Dialog open={modal === 'game'} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><GameIcon mode={mode} size="lg" className="modal-logo"/><DialogTitle className="modal-title">{t(mode)}</DialogTitle><DialogDescription>{t(mode + 'Desc')}</DialogDescription><p className="solo-pace-note"><span aria-hidden="true">🌿</span>{t('soloNote')}</p><GameSettings value={setup} onChange={setSetup}/><button className="btn primary wide" disabled={busy} onClick={() => start(setup)}>{busy ? t('loading') : t('startGame')}<ArrowRight size={18}/></button></DialogContent></Dialog>
 <Dialog open={manualCopy !== null} onOpenChange={v => !v && setManualCopy(null)}><DialogContent className="app-modal"><DialogTitle>{t('manualCopyTitle')}</DialogTitle><DialogDescription>{t('manualCopyHelp')}</DialogDescription><textarea className="text-input manual-share" aria-label={t('share')} readOnly value={manualCopy ?? ''} onFocus={e => e.target.select()}/><button className="btn secondary" onClick={() => setManualCopy(null)}>{t('done')}</button></DialogContent></Dialog>
 <PresenceLayer path={path}/><AuthModal /><CreateRoomModal /><ReportModal value={report} onClose={() => setReport(null)}/><Toaster theme={theme as any} position="bottom-center" richColors/></AppContext.Provider>;
}
function PresenceLayer({ path }: { path: string }) { const { invites, dismiss } = usePresence(path); return <InviteInbox invites={invites} dismiss={dismiss}/>; }
function AllGames() {
    const app = useApp(), { t, start, playMode, busy, region, setRegion, boot } = app;
    return <div className="page all-games">
        <PageHeader art="spot-side-by-side" kicker={t('allGamesKicker')} title={t('allGamesTitle')} lead={t('allGamesLead')}/>
        <PuzzleDeck app={app} dailyPage extras/>
        <section id="classic" className="classic-section" aria-labelledby="classic-title">
          <header className="section-header"><div><h2 id="classic-title">{t('allGamesClassic')}</h2><p className="muted">{t('allGamesClassicNote')}</p></div></header>
          <div className="classic-controls"><Choice label={t('region')} value={region} onChange={setRegion} options={REGIONS.map(v => ({ value: v, label: v === 'World' ? t('allRegions') : t(v) }))}/><button className="btn secondary surprise-button" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: MODES[Math.floor(Math.random()*MODES.length)], region, count:5 })}><Sparkles size={17} aria-hidden="true"/>{t('surpriseMe')}</button></div>
          {boot.stats.weak?.length > 0 && <button className="review-card" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode: 'mixed', region }, true)}><span className="review-card-icon" aria-hidden="true"><RotateCcw size={22} strokeWidth={2.2}/></span><span className="review-card-copy"><strong>{t('reviewCardTitle')}</strong><small>{t('reviewCardCopy').replace('{n}', String(new Set(boot.stats.weak.map((w: { country_id: string }) => w.country_id)).size))}</small></span><span className="btn secondary review-card-cta">{t('reviewCardCta')}<ArrowRight size={17}/></span></button>}
          <div className="classic-grid">{MODES.map(mode => <article className={'ccard tone-' + mode} key={mode}>
            <button className="ccard-main" disabled={busy} onClick={() => start({ ...DEFAULT_SETTINGS, mode, region })}>
              <span className="ccard-art" aria-hidden="true"><img src={'/art/classic-' + mode + '.webp'} alt="" width={574} height={248} loading="lazy" decoding="async"/><svg className="ccard-wave" viewBox="0 0 400 36" preserveAspectRatio="none"><path d="M0 20C70 4 150 2 230 16s130 22 170 6V36H0Z" fill="currentColor"/></svg></span>
              <span className="ccard-body"><GameIcon mode={mode} className="ccard-logo"/><strong>{t(mode)}</strong><small>{t('category' + mode)}</small></span>
              <span className="ccard-go" aria-hidden="true"><ArrowRight size={18}/></span>
            </button>
            <button className="icon-btn ccard-settings" disabled={busy} aria-label={t('gameSettings').replace('{game}', t(mode))} title={t('gameSettings').replace('{game}', t(mode))} onClick={() => playMode(mode)}><Settings2 size={16}/></button>
          </article>)}</div>
        </section>
        
    </div>;
}
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
} }; return <Dialog open={modal === 'room'} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><GameIcon mode="room" size="lg" className="modal-logo"/><DialogTitle className="modal-title">{t('createRoom')}</DialogTitle><DialogDescription>{t('roomCopy')}</DialogDescription><form onSubmit={create} className="form-stack"><label className="field"><span>{t('displayName')}</span><input className="text-input" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/><small>{t('nameHint')}</small></label><AvatarPicker value={avatar} onChange={setAvatar}/><button className="btn primary wide" disabled={busy}>{busy ? t('loading') : t('createRoom')}<ArrowRight size={18}/></button></form></DialogContent></Dialog>; }
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
} }; return <Dialog open={['login', 'signup'].includes(modal)} onOpenChange={v => !v && setModal(null)}><DialogContent className="app-modal"><Logo /><DialogTitle className="modal-title">{t('accountTitle')}</DialogTitle><DialogDescription>{t('accountCopy')}</DialogDescription><form onSubmit={submit} className="form-stack">{signup && <label className="field"><span>{t('name')}</span><input className="text-input" autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/></label>}<label className="field"><span>{t('email')}</span><input className="text-input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label className="field"><span>{t('password')}</span><input className="text-input" type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={128} required/>{signup && <small>{t('passwordHint')}</small>}{!signup && boot?.mailEnabled && <button type="button" className="text-link forgot-link" onClick={async () => { if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error(t('forgotNeedsEmail')); return; } try { await post('/auth/forgot', { email }); toast.success(t('forgotSent')); } catch (err) { fail(err); } }}>{t('forgotPassword')}</button>}</label><button className="btn primary wide" disabled={busy}>{busy ? t('loading') : t(signup ? 'signUp' : 'signIn')}<ArrowRight size={18}/></button></form>{boot?.googleEnabled && <a className="btn secondary" href="/api/auth/google" target="_top">{t('continueGoogle')}</a>}<div className="auth-switch">{t(signup ? 'haveAccount' : 'newAccount')}<button className="text-link" onClick={() => setModal(signup ? 'login' : 'signup')}>{t(signup ? 'signIn' : 'signUp')}</button></div></DialogContent></Dialog>; }
function GameTop({ round, total, score, deadline, serverOffset = 0, streak = 0, onBack }: any) { const { t } = useApp(); const now = useClock() + serverOffset; const sec = deadline ? seconds(deadline - now) : null; return <div className="game-top"><button className="icon-btn exit-game" aria-label={t('back')} onClick={onBack}><X size={20}/></button><div className="round-progress"><span>{t('round')} <b>{round + 1}</b><span className="muted"> / {total}</span></span><Progress value={(round + 1) / total * 100} className="game-progress"/></div><span className={'game-timer ' + (sec !== null && sec < 6 ? 'urgent' : '')}><Clock size={18}/>{sec === null ? '∞' : sec}<small>{sec !== null ? 's' : ''}</small></span><div className="game-score"><Zap size={18}/><strong>{formatScore(score)}</strong></div>{streak > 1 && <span className="game-streak"><Flame size={17}/>{streak}</span>}</div>; }
function SoloScreen({ id }: { id: string }) {
    const { t, backToStart, fail, muted, report, refresh, locale } = useApp();
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
    // Warm the next flag while the answer is on screen, so it appears instantly on "Next".
    useEffect(() => { if (game?.preloadFlag) { const img = new Image(); img.decoding = 'async'; img.src = game.preloadFlag; } }, [game?.preloadFlag]);
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
    return <div className="solo-game learning-game" data-mode={game.daily ? 'daily' : game.settings.mode}><GameHeader mode={guide === 'daily' ? 'daily' : guide} title={t(game.competition?.mode === 'trail' ? 'dailyTrail' : game.daily ? 'dailyTitle' : game.settings.mode === 'mixed' ? 'mixed' : game.question.mode)} edition={game.daily && game.settings.mode === 'daily' ? t(game.question.mode) : editionLabel(game.daily, locale, t(game.practice ? 'reviewRoundLabel' : 'soloLearning'))} count={(game.round + 1) + ' / ' + game.total} unit={t('round')} progress={(game.round + (revealed ? 1 : 0)) / game.total} onExit={backToStart} exitLabel={t('back')} help={<HowToPlayButton key={guide} mode={guide} t={t} locale={locale} auto={game.settings.mode !== 'mixed'}/>}>{game.streak > 1 && <span className="game-streak-chip"><Flame size={15} aria-hidden="true"/>{game.streak}</span>}</GameHeader>
        {!game.daily && game.settings.region !== 'World' && <div className="game-region"><Globe2 size={15}/>{t('activeRegion').replace('{region}',t(game.settings.region))}</div>}<div className="auto-next-wrap"><label className="auto-next"><input type="checkbox" checked={autoNext} onChange={e=>{setAutoNext(e.target.checked);writePreference('rv_auto_next',e.target.checked?'on':'off');}}/>{t('autoNextAll')}</label>{autoNext && <small>{t('autoNextExplain')}</small>}</div>
        {game.competition && <DailyScoreRule mode={game.competition.mode} score={game.score} t={t}/>}
        <div className="game-body"><Question key={game.question.id} question={game.question} feedback={game.feedback} locked={revealed || saving} onAnswer={answer} competitive={false} onHint={(count: number) => { const round = game.round; return hintSave.current = (hintSave.current ?? Promise.resolve()).catch(() => {}).then(() => post('/games/' + id + '/hint', { round, count })).then(g => { if (!sending.current) setGame((current:any) => current.round === round && current.phase === 'question' ? g : current); }).catch(fail); }} t={t} locale={locale} onReport={() => report(game.question)}/>{revealed && <div className="solo-next-row"><span className="save-status" role="status">{saving ? t('saving') : '✓ ' + t('saved')}</span><button className="btn primary next-button" onClick={next} disabled={advancing} aria-busy={advancing}>{t(game.round + 1 === game.total ? 'finish' : 'next')}<ArrowRight size={19}/></button></div>}</div>
    </div>;
}
function DuelScreen({ practice }: { practice: boolean }) { const app = useApp(); return <DuelGame app={app} practice={practice}/>; }
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
function Results({ result, multiplayer = false, room, send }: any) {
    const app = useApp(), { t, locale, start, go, backToStart, copy, boot, fail } = app;
    const list = result.answers ?? result.results ?? [];
    const correct = list.filter((a: any) => a.correct).length;
    const score = result.score;
    const wrong = list.filter((a: any) => !a.correct);
    const share = () => copy(shareResult({ mode: multiplayer ? 'multiplayer' : result.competition?.mode ?? (result.daily ? 'daily' : result.settings?.mode) ?? 'mixed', label: t(multiplayer ? 'multiplayer' : result.competition?.mode==='trail'?'dailyTrail':result.daily ? 'dailyTitle' : result.settings?.mode ?? 'mixed'), date: result.daily, correct, total: list.length, answers: list.map((a:any) => !!a.correct), detail:result.competition?score.toLocaleString(locale)+' '+t('points'):undefined, origin: window.location.origin }));
    const winners = room?.players ?? [];
    if (!multiplayer) return <SoloResults result={result} t={t} locale={locale} dailyStreak={boot.stats.dailyStreak} onAgain={() => start({ ...result.settings, mode: result.competition?.mode==='trail'?'trail':result.daily ? 'mixed' : result.settings.mode })} onShare={share} onHome={backToStart} followUp={result.competition ? <DailyResult app={app} date={result.daily} mode={result.competition.mode}/> : <NextDiscovery result={result} t={t} go={go} fail={fail}/>}/>;
    return <div className="results-page"><span className="result-emblem">{multiplayer ? <Trophy size={40}/> : result.daily ? <Sunrise size={40}/> : <Compass size={40}/>}</span><span className="eyebrow">{multiplayer ? t('multiplayer') : result.daily ? t('daily') : t(result.settings?.mode ?? 'mixed')}</span><h1>{t(multiplayer ? 'podium' : result.daily ? 'dailyResult' : 'yourResult')}</h1><p className="results-subtitle">{t(multiplayer ? 'podiumCopy' : 'resultCopy')}</p>{multiplayer && <div className="podium">{winners.slice(0, 3).map((p: any, i: number) => <div key={p.id} className={'podium-player place-' + (i + 1)}>{i === 0 && <Crown className="podium-crown" size={27}/>}<Avatar id={p.avatar} size="large"/><strong>{p.name}</strong><span>{formatScore(p.score)} {t('points')}</span><div className="podium-step"><span>{p.rank ?? i + 1}</span></div></div>)}</div>}
 {!multiplayer && <div className="result-score"><span>{formatScore(score)}</span><small>{t('points')}</small>{score > result.personalBest && <div className="record-chip"><Star size={14}/>{t('newRecord')}</div>}</div>}
 <div className="result-stats"><div><Target size={20}/><strong>{list.length ? Math.round(correct / list.length * 100) : 0}%</strong><span>{t('accuracy')}</span></div><div><Clock size={20}/><strong>{prettyTime(list.reduce((n: number, a: any) => n + a.responseTime, 0))}</strong><span>{t('time')}</span></div><div><Flame size={20}/><strong>{result.bestStreak ?? Math.max(0, ...list.map((a: any) => a.streak))}</strong><span>{t('bestStreak')}</span></div><div><Zap size={20}/><strong>+{result.xp ?? Math.round(score / 25) + list.length * 10}</strong><span>{t('xpEarned')}</span></div></div>
 {result.daily && <p className="daily-comparison">{result.percentile !== null && result.percentile !== undefined ? `${t('dailyPercentile')}: ${result.percentile}` : t('dailyFirst')} · <Flame size={15}/>{boot.stats.dailyStreak} {t('days')}</p>}
 <div className="results-actions">{multiplayer ? room.host === boot.user.id ? <button className="btn primary" onClick={() => send('rematch')}><RefreshCw size={17}/>{t('rematch')}</button> : <p className="muted">{t('waitingHost')}</p> : <button className="btn primary" onClick={() => start({ ...result.settings, mode: result.competition?.mode==='trail'?'trail':result.daily ? 'mixed' : result.settings.mode })}><RefreshCw size={17}/>{t('playAgain')}</button>}<button className="btn secondary" onClick={share}><ArrowUpRight size={17}/>{t('share')}</button><button className="btn ghost" onClick={() => go('/')}>{t('home')}</button></div>{multiplayer && room?.history?.length > 0 && <MatchReview history={room.history}/>}
 {multiplayer && <LiveRanking players={winners} actions room={room?.code}/>}<section className="review-section"><h2>{t('review')}</h2>{wrong.length ? <><p>{t('reviewCopy')}</p><div className="review-list">{wrong.map((a: any, i: number) => <div key={i}><span className={'review-mode tone-' + a.mode}>{React.createElement(icons[a.mode] ?? Compass, { size: 20 })}</span><div><strong>{a.answerLabel[locale]}</strong><p>{a.fact[locale]}</p></div><CheckCircle2 size={18}/></div>)}</div></> : <div className="perfect-note"><CheckCircle2 size={22}/>{t('perfect')}</div>}</section></div>;
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
                if (data.preloadFlag && data.preloadFlag !== latest.current?.preloadFlag) { const img = new Image(); img.decoding = 'async'; img.src = data.preloadFlag; }
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
        return <RoomProblem code={error} onRetry={() => channel.current?.retry()}/>;
    if (!room)
        return <Loading variant="list"/>;
    const isHost = room.host === boot.user.id;
    const self = room.players.find((p: any) => p.id === boot.user.id);
    if (room.phase === 'finished')
        return <Results result={{ ...room, answers: room.results }} multiplayer room={room} send={send}/>;
    if (room.phase === 'lobby' && room.quick === 'open' && isHost)
        return <div className="room-screen">{!connected && <div className="connection-banner" role="status"><RefreshCw size={16}/>{t(error ? errorMessage(error) : 'reconnecting')}<button className="btn secondary" onClick={() => channel.current?.retry()}>{t('retry')}</button></div>}<QuickSearch room={room} now={now} t={t} code={code} onCancel={leave} fail={fail}/></div>;
    return <div className="room-screen">{!connected && <div className="connection-banner" role="status"><RefreshCw size={16}/>{t(error ? errorMessage(error) : 'reconnecting')}<button className="btn secondary" onClick={() => channel.current?.retry()}>{t('retry')}</button></div>}{room.phase === 'lobby' ? <><div className="room-page-heading"><div><p className="kicker"><Users size={15} aria-hidden="true"/>{t('friendsKicker')}</p><h1>{t('yourLobby')}</h1><p>{t('lobbyCopy')}</p></div><button className="btn ghost" onClick={leave}><LogOut size={16}/>{t('leaveRoom')}</button></div><div className="lobby-grid"><section className="panel lobby-players"><div className="room-code-panel"><div><span className="eyebrow">{t('roomCode')}</span><button className="room-code" onClick={() => copy(code)} aria-label={t('copyCode')}>{code}<Copy size={22}/></button></div><div className="invite-actions"><button className="btn secondary" onClick={() => copy(location.origin + '/room/' + code)}><LinkIcon size={17} aria-hidden="true"/>{t('copyInvite')}</button>{typeof navigator !== 'undefined' && 'share' in navigator && <button className="btn ghost" onClick={() => navigator.share({ title: BRAND.name, text: t('togetherCopy') + ' ' + code, url: location.origin + '/room/' + code }).catch(() => {})}>{t('shareCode')}</button>}</div></div><div className="small-heading"><h3>{t('players')}<span className="count-chip">{t('playersInRoom').replace('{n}', String(room.players.length))}</span></h3><span className="live-chip">{connected && <span />}{t(connected ? 'connected' : 'offlineLabel')}</span></div><div className="lobby-player-list">{room.players.map((p: any) => <div className={'lobby-player' + (p.bot ? ' is-bot' : '')} key={p.id}><Avatar id={p.avatar}/><div><strong>{p.name}{room.players.filter((q: any) => q.name === p.name).length > 1 && <small className="name-suffix"> · {room.players.filter((q: any) => q.name === p.name).findIndex((q: any) => q.id === p.id) + 1}</small>}{p.id === boot.user.id && <small> ({t('youLabel')})</small>}</strong><span>{p.bot ? t('computerPlayer').replace('{level}', t('botLevel_' + (p.level ?? 'medium'))) : p.id === room.host ? <><Crown size={13}/>{t('host')}</> : !p.connected ? t('reconnecting') : p.ready ? t('ready') : t('notReady')}</span></div>{!p.bot && p.id !== boot.user.id && <PlayerActions player={p} t={t} room={code}/>}{p.bot && isHost ? <button className="icon-button bot-remove" onClick={() => removeComputer(code, p.id, fail)} aria-label={t('removeComputer').replace('{name}', p.name)}><X size={17}/></button> : p.ready ? <CheckCircle2 size={20} className="ready-icon"/> : p.id === room.host ? <Crown size={19} className="host-icon"/> : <span className="waiting-dot"/>}</div>)}</div>{isHost && <LobbyComputer code={code} t={t} fail={fail} bots={room.players.filter((p: any) => p.bot).length} full={room.players.length >= 12}/>}<InvitePanel code={code} inRoom={room.players.map((p: any) => p.id)}/><div className="lobby-controls"><button className={'btn ' + (self?.ready ? 'ready-btn' : 'secondary')} disabled={!connected} onClick={() => send('ready', { ready: !self?.ready })}><Check size={17}/>{t(self?.ready ? 'notReadyButton' : 'setReady')}</button>{isHost ? <button className="btn primary" disabled={!connected || settingsBusy} onClick={() => send('start')}>{t('startGame')}<ArrowRight size={18}/></button> : <span className="muted">{t('waitingHost')}</span>}</div><p className="lobby-footnote">{t('soloTest')}</p></section><aside className="panel room-settings"><h2><Settings2 size={20}/>{t('settings')}</h2><GameSettings value={room.settings} multiplayer disabled={!isHost || settingsBusy} onChange={async (v: any) => { if(settingsBusy)return;setSettingsBusy(true);try {
        const r = await post('/rooms/' + code + '/settings', { settings: v });
        setRoom(r);
    }
    catch (e) {
        fail(e);
    } finally { setSettingsBusy(false); } }}/><div className="room-rules"><ShieldCheck size={18}/><p>{t('lobbyRules')}</p></div></aside></div></> : <><GameTop round={room.round} total={room.total} score={room.score} deadline={room.phase === 'question' ? room.deadline : null} serverOffset={offset} onBack={leave}/><div className="live-game-layout"><div className="game-body live-game-body">{room.phase === 'countdown' ? <div className="countdown-stage"><span className="eyebrow">{t('countdown')}</span><strong key={seconds(room.startAt - now)} className={seconds(room.startAt - now) > 0 ? '' : 'is-go'}>{seconds(room.startAt - now) > 0 ? seconds(room.startAt - now) : t('countdownGo')}</strong><p>{t(room.question?.mode ?? 'mixed')}</p><span>{room.round + 1} / {room.total}</span></div> : <Question key={room.matchId + ':' + room.round} question={room.question} feedback={room.phase === 'reveal' ? room.feedback : null} deadline={room.phase === 'question' && room.deadline ? room.deadline - offset : null} locked={room.phase !== 'question' || room.answered || pending || !connected} busy={pending} onAnswer={answer} t={t} locale={locale} onReport={() => report(room.question)}/>}{room.phase === 'question' && room.answersCompleteAt && <p className="locked-note" role="status">{t('allAnsweredReveal')}</p>}{room.phase === 'reveal' && <div className="next-countdown">{t('nextRound')} <strong>{seconds(room.revealUntil - now)}</strong></div>}{isHost && room.settings.timer === 0 && room.phase === 'question' && <button className="btn secondary" onClick={() => send('advance')}>{t('endRound')}</button>}</div><aside className="live-ranking-panel"><div className="room-mini-code"><Users size={15}/>{code}<button className="icon-btn" aria-label={t('copyCode')} onClick={() => copy(code)}><Copy size={14}/></button></div><LiveRanking players={room.players} showStatus={room.phase === 'question'} answers={room.phase === 'reveal' ? room.roundAnswers : undefined}/></aside></div></>}</div>;
}
function LiveRanking({ players, showStatus = false, answers, actions = false, room }: any) { const { t, boot, locale } = useApp(); return <div className="live-ranking"><h3><Trophy size={18}/>{t('roomRanking')}</h3>{players.map((p: any, i: number) => { const a = answers?.find((x: any) => x.id === p.id); return <div key={p.id} className={'live-rank-row ' + (p.id === boot.user.id ? 'is-you ' : '') + (a ? a.correct ? 'was-right' : 'was-wrong' : '')}><span className="rank-num">{p.rank ?? i + 1}</span><Avatar id={p.avatar}/><div className="rank-person"><strong>{p.name}</strong>{a ? <span className="rank-answer">{a.correct ? <Check size={13} strokeWidth={3}/> : <X size={13} strokeWidth={3}/>}<em>{a.answered ? a.answer?.[locale] ?? a.answer?.en ?? (typeof a.distance === 'number' ? a.distance.toLocaleString(locale) + ' km' : t('mpNoAnswer')) : t('mpNoAnswer')}</em></span> : <span>{p.streak > 1 ? <><Flame size={12}/>{p.streak}</> : p.delta ? '+' + formatScore(p.delta) : '—'}</span>}</div>{a && <span className={'rank-delta' + (a.points ? ' has-points' : '')}>+{formatScore(a.points)}</span>}<span className="rank-score">{formatScore(p.score)}</span>{showStatus && p.answered && <CheckCircle2 size={16} className="ready-icon"/>}{actions && !p.bot && p.id !== boot.user.id && <PlayerActions player={p} t={t} room={room}/>}</div>; })}</div>; }
function MatchReview({ history }: { history: any[] }) { const { t, locale, boot } = useApp(); const label = (v: any) => v?.[locale] ?? v?.en ?? ''; return <section className="match-review" aria-labelledby="match-review-title"><h2 id="match-review-title">{t('mpReviewTitle')}</h2><p>{t('mpReviewCopy')}</p><ol>{history.map((h: any) => { const players = [...h.players].sort((a: any, b: any) => b.points - a.points); return <li key={h.round}><details open={h.round === 0}><summary><span className="match-review-round">{h.round + 1}</span><GameIconMode mode={h.mode}/><span className="match-review-q">{label(h.prompt)}</span><span className="match-review-answer"><Check size={14} strokeWidth={3}/>{label(h.answerLabel)}</span></summary><ul>{players.map((p: any) => <li key={p.id} className={(p.correct ? 'was-right' : 'was-wrong') + (p.id === boot.user.id ? ' is-you' : '')}><Avatar id={p.avatar}/><strong>{p.name}</strong><span className="match-review-pick">{p.correct ? <Check size={14} strokeWidth={3}/> : <X size={14} strokeWidth={3}/>}{p.answered ? label(p.answer) || (typeof p.distance === 'number' ? p.distance.toLocaleString(locale) + ' km' : '—') : t('mpNoAnswer')}</span><b>+{formatScore(p.points)}</b></li>)}</ul></details></li>; })}</ol></section>; }
function GameIconMode({ mode }: { mode: string }) { return <GameIcon mode={mode} size="sm"/>; }
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
function Admin() { const { t, boot, fail, locale } = useApp(); const [data, setData] = useState<any>(null), [loadError, setLoadError] = useState(false); const load = () => { setLoadError(false); return api('/admin').then(setData).catch(() => setLoadError(true)); }; useEffect(() => { if (boot.isAdmin)
    load(); }, [boot.isAdmin]); const action = async (action: string, id: string) => { try {
    await post('/admin', { action, id });
    load();
}
catch (e) {
    fail(e);
} }; if (!boot.isAdmin)
    return <Empty icon={LockKeyhole} title={t('adminRestricted')}/>; return <div><div className="page-heading"><span className="eyebrow">{t('admin')}</span><h1>{t('adminTitle')}</h1></div>{data ? <><p className="muted">{data.countryCount} · {data.dailySeed}</p><section className="admin-daily"><h2>{t('adminDaily')}</h2><p>{t('adminHistory')}</p>{data.dailyContent?.map((day:any) => <details key={day.date+day.kind}><summary>{day.date} · {t(day.kind.replace('puzzle:','').replace(/:competitive-v\d+$/,'').replace(/^daily-/,''))} · {day.dataset_version}</summary>{day.content.questions?.map((q:any) => <article className="admin-report" key={q.id}><div><strong>{q.prompt?.[locale] ?? q.topic?.prompt[locale]}</strong><p>{q.answerLabel?.[locale] ?? q.countries?.map((c:any) => c.name[locale] + ': ' + c.value).join(' / ')}</p><small>{q.id}</small></div><button className="btn secondary" onClick={() => action('disable',q.id)}>{t('disable')}</button></article>)}{day.content.board && <article className="admin-report"><div><strong>{(day.content.board.countries ?? day.content.board.hand ?? []).map((c:any) => c.name?.[locale] ?? c.name?.en ?? c.id).join(' · ')}</strong><p>{(day.content.board.tiles?.filter((tile:any)=>tile.kind==='fact').map((tile:any)=>tile.text?.[locale]) ?? day.content.board.rounds?.map((r:any)=>r.category?.label?.[locale] ?? r.category?.label?.en) ?? []).filter(Boolean).join(' / ')}</p></div>{day.content.board.id && <button className="btn secondary" onClick={() => action('disable',day.content.board.id)}>{t('disable')}</button>}</article>}</details>)}</section><section className="panel"><h2>{t('measuredEvents')}</h2><p>{t('metricsSample')}</p>{data.funnel?.length ? data.funnel.map((e:any) => <p key={e.event}>{e.event}: {e.count}</p>) : <p>{t('noResults')}</p>}</section><section className="panel admin-panel" aria-labelledby="admin-players"><h2 id="admin-players">{t('adminPlayerReports')}</h2>{data.playerReports?.length ? data.playerReports.map((r: any) => <div className="admin-report" key={r.id}><div><strong>{r.current_name ?? r.reported_name}{r.current_name && r.current_name !== r.reported_name ? ' (' + r.reported_name + ')' : ''}</strong><p>{t('reportReason_' + r.reason)} · {new Date(r.created_at).toLocaleString(locale)}{r.room_code ? ' · ' + r.room_code : ''} · {t('adminOpenReports').replace('{n}', String(r.open_count))}{r.blocked ? ' · ' + t('adminAccountBlocked') : ''}</p><small>{r.reported_id}</small></div><button className="btn secondary" onClick={() => action('resolvePlayer', r.id)}>{t('resolve')}</button><button className="btn secondary" onClick={() => action('resetName', r.reported_id)}>{t('adminResetName')}</button><button className="btn secondary" onClick={() => action('block', r.reported_id)}>{t('blockUser')}</button></div>) : <Empty title={t('reportsEmpty')}/>}</section><section className="panel admin-panel">{data.reports?.length ? data.reports.map((r: any) => <div className="admin-report" key={r.id}><div><strong>{r.question_id}</strong><p>{t(r.category)} · {r.detail}</p><small>{r.status}</small></div><button className="btn secondary" onClick={() => action('resolve', r.id)}>{t('resolve')}</button><button className="btn secondary" onClick={() => action('disable', r.question_id)}>{t('disable')}</button></div>) : <Empty title={t('reportsEmpty')}/>}</section>{data.suspicious?.map((r: any) => <div className="panel admin-report" key={r.id}><strong>{r.name}</strong><span>{r.score}</span><button className="btn secondary" onClick={() => action('block', r.user_id)}>{t('blockUser')}</button></div>)}</> : loadError ? <Empty title={t('connectionError')}><button className="btn secondary" onClick={load}>{t('retry')}</button></Empty> : <Loading />}</div>; }
function SEOPage({ slug }: {
    slug: string;
}) { const { t, start } = useApp(); const modes: Record<string, string> = { 'world-geography-quiz': 'mixed', 'flags-quiz': 'flags', 'capitals-quiz': 'capitals', 'country-map-quiz': 'pinpoint', 'europe-geography-quiz': 'mixed', 'africa-geography-quiz': 'mixed' }; const m = modes[slug]; if (!m)
    return <Empty icon={MapPin} title={t('notFoundTitle')} copy={t('notFoundCopy')}><A href="/" className="btn primary">{t('notFoundCta')}</A></Empty>; const region = slug.startsWith('europe') ? 'Europe' : slug.startsWith('africa') ? 'Africa' : 'World'; return <div className="seo-page"><span className={'mode-symbol tone-' + m}>{React.createElement(icons[m], { size: 34 })}</span><h1>{t(m)} · {t(region)}</h1><p>{t(m === 'mixed' ? 'modeSub' : m + 'Desc')}</p><button className="btn primary" onClick={() => start({ ...DEFAULT_SETTINGS, mode: m, region })}>{t('playNow')}<ArrowRight size={18}/></button></div>; }
