'use client';
import React, { useEffect, useState } from 'react';
import { BadgeCheck, Check, Copy, Download, KeyRound, LogIn, LogOut, Mail, MailWarning, PenLine, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { api, post } from '@/lib/client';
import { errorMessage } from '@/i18n/messages';
import { useApp } from '../app/context';
import { A, Avatar, AvatarPicker } from '../app/shared';
import { PageHeader, SectionHeader } from '../ds/States';
import { BlockedPlayers } from '../multiplayer/PlayerActions';

/** Name, avatar and whether friends can find you. Used on the account page and the passport. */
export function ProfileEditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, boot, refresh, fail } = useApp();
  const u = boot.user;
  const [name, setName] = useState(u.name), [avatar, setAvatar] = useState(u.avatar), [discoverable, setDiscoverable] = useState(u.discoverable), [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setName(u.name); setAvatar(u.avatar); setDiscoverable(u.discoverable); } }, [open, u.name, u.avatar, u.discoverable]);
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await api('/profile', { method: 'PATCH', body: JSON.stringify({ name, avatar, discoverable }) }); await refresh(); onOpenChange(false); } catch (err) { fail(err); } finally { setBusy(false); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="app-modal"><DialogTitle className="modal-title">{t('editProfile')}</DialogTitle><DialogDescription>{t('nameHint')}</DialogDescription>
    <form onSubmit={save} className="form-stack">
      <label className="field"><span>{t('displayName')}</span><input className="text-input" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={24} required/></label>
      <AvatarPicker value={avatar} onChange={setAvatar}/>
      <div className="switch-field"><label htmlFor="discoverable">{t('discoverable')}</label><Switch id="discoverable" checked={discoverable} onCheckedChange={setDiscoverable}/></div>
      <button className="btn primary" disabled={busy}>{t('save')}<Check size={17}/></button>
    </form>
  </DialogContent></Dialog>;
}

/** Change the password (signed in) or choose a new one from a reset link (token). */
function PasswordDialog({ open, onOpenChange, token }: { open: boolean; onOpenChange: (v: boolean) => void; token?: string }) {
  const { t, fail, refresh, setModal } = useApp();
  const [current, setCurrent] = useState(''), [next, setNext] = useState(''), [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      if (token) { await post('/auth/reset', { token, password: next }); toast.success(t('passwordResetDone')); await refresh(); onOpenChange(false); setModal('login'); }
      else { await post('/auth/password', { current, password: next }); toast.success(t('passwordChanged')); onOpenChange(false); }
      setCurrent(''); setNext('');
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="app-modal"><DialogTitle className="modal-title">{t(token ? 'passwordNewTitle' : 'passwordChange')}</DialogTitle><DialogDescription>{t('passwordRule')}</DialogDescription>
    <form onSubmit={save} className="form-stack">
      {!token && <label className="field"><span>{t('passwordCurrent')}</span><input className="text-input" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required/></label>}
      <label className="field"><span>{t('passwordNew')}</span><input className="text-input" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} minLength={12} maxLength={128} required/></label>
      <button className="btn primary" disabled={busy || next.length < 12}>{t('save')}<Check size={17}/></button>
    </form>
  </DialogContent></Dialog>;
}

/** Everything about the account in one place: who you are, how you sign in, your data and the way out. */
export function AccountPage() {
  const { t, boot, refresh, setModal, fail, go, copy } = useApp();
  const u = boot.user;
  const [edit, setEdit] = useState(false), [password, setPassword] = useState(false), [deleting, setDeleting] = useState(false), [sending, setSending] = useState(false), [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  // Links from emails land here: ?verified=1|0 after confirming, ?reset=<token> to choose a new password.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('verified') === '1') { toast.success(t('emailVerifiedDone')); void refresh(); }
    if (q.get('verified') === '0') toast.error(t('linkExpired'));
    const reset = q.get('reset'); if (reset) setResetToken(reset);
    if (q.toString()) window.history.replaceState(window.history.state, '', '/account');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const verify = async () => { setSending(true); try { await post('/auth/verify/send'); setSent(true); toast.success(t('emailVerifySent').replace('{email}', u.email ?? '')); } catch (e) { const m = (e as Error)?.message; toast.error(t(errorMessage(m))); } finally { setSending(false); } };

  return <div className="page account-page">
    <PageHeader kicker={t('myAccountNote')} title={t('myAccount')}/>

    <section className="account-card" aria-label={t('myAccount')}>
      <Avatar id={u.avatar} size="large"/>
      <div className="account-id"><strong>{u.name}</strong><small>{u.guest ? t('menuGuest') : t('accountSince')}</small></div>
      {u.guest
        ? <div className="account-actions"><button className="btn primary" onClick={() => setModal('signup')}>{t('passportSave')}</button><button className="btn ghost" onClick={() => setModal('login')}><LogIn size={17} aria-hidden="true"/>{t('signIn')}</button></div>
        : <button className="btn secondary" onClick={() => setEdit(true)}><PenLine size={17} aria-hidden="true"/>{t('editProfile')}</button>}
    </section>

    {!u.guest && <section className="page-section" aria-labelledby="account-signin">
      <SectionHeader id="account-signin" title={t('accountSignIn')}/>
      <div className="settings-card">
        <div className="settings-card-row">{u.emailVerified ? <BadgeCheck size={19} aria-hidden="true" className="is-verified"/> : <MailWarning size={19} aria-hidden="true"/>}
          <span><strong>{u.email}</strong><small>{u.emailVerified ? t('emailVerified') : boot.mailEnabled ? t('emailNotVerified') : t('emailNotVerifiedNoMail')}</small></span>
          {!u.emailVerified && boot.mailEnabled && <button className="btn secondary btn-sm" disabled={sending || sent} aria-busy={sending} onClick={verify}><Mail size={15} aria-hidden="true"/>{sent ? t('emailSentShort') : t('emailVerifyButton')}</button>}
        </div>
        <button className="settings-card-row" onClick={() => setPassword(true)}><KeyRound size={19} aria-hidden="true"/><span><strong>{t('passwordChange')}</strong><small>{t('passwordRule')}</small></span></button>
        <button className="settings-card-row" onClick={() => copy(u.friendCode)}><Copy size={19} aria-hidden="true"/><span><strong>{t('friendCode')}</strong><small>{u.friendCode}</small></span></button>
        <A href="/friends" className="settings-card-row"><Users size={19} aria-hidden="true"/><span><strong>{t('friendsList')}</strong><small>{t('menuFriendsNote')}</small></span></A>
      </div>
    </section>}

    <section className="page-section" aria-labelledby="account-data">
      <SectionHeader id="account-data" title={t('passportSettings')}/>
      <div className="settings-card">
        <a href="/api/export" className="settings-card-row" download><Download size={19} aria-hidden="true"/><span><strong>{t('export')}</strong></span></a>
        <a href="mailto:support@roviko.app" className="settings-card-row"><Mail size={19} aria-hidden="true"/><span><strong>{t('contact')}</strong><small>{t('contactCopy')} support@roviko.app</small></span></a>
        <A href="/privacy" className="settings-card-row"><ShieldCheck size={19} aria-hidden="true"/><span><strong>{t('privacy')}</strong></span></A>
        {!u.guest && <button className="settings-card-row" onClick={async () => { try { await post('/auth/logout'); await refresh(); go('/'); } catch (e) { fail(e); } }}><LogOut size={19} aria-hidden="true"/><span><strong>{t('logout')}</strong></span></button>}
        <button className="settings-card-row is-danger" onClick={() => setDeleting(true)}><Trash2 size={19} aria-hidden="true"/><span><strong>{t('deleteAccount')}</strong><small>{t('deleteAccountNote')}</small></span></button>
      </div>
    </section>

    <BlockedPlayers t={t}/>

    <ProfileEditDialog open={edit} onOpenChange={setEdit}/>
    <PasswordDialog open={password || !!resetToken} token={resetToken || undefined} onOpenChange={v => { setPassword(v); if (!v) setResetToken(''); }}/>
    <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent className="app-modal"><AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('deleteCopy')}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction className="delete-button" onClick={async () => { try { await api('/profile', { method: 'DELETE' }); await refresh(); go('/'); } catch (e) { fail(e); } }}>{t('deleteConfirm')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
