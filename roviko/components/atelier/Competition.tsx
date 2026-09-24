'use client';
import { useEffect, useState } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import { api } from '@/lib/client';
import type { PointMode } from '@/lib/daily-scoring';

const ruleKeys:Record<PointMode,string>={daily:'competitionDaily',trail:'competitionTrail',compare:'competitionCompare',mosaic:'competitionMosaic',rank:'competitionRankRule'};
const titles:Record<PointMode,string>={daily:'dailyTitle',trail:'dailyTrail',compare:'compare',mosaic:'mosaic',rank:'rankRadar'};
/** Numbers follow the page language (1.000 in Dutch and Spanish), which the app keeps on <html lang>. */
const pageLang=()=>typeof document==='undefined'?undefined:document.documentElement?.lang||undefined;
export function DailyScoreRule({mode,t,score}:{mode:PointMode;t:(key:string)=>string;score?:number}) {
  return <details className="daily-score-rule"><summary><Trophy size={16}/>{score===undefined?t('competitionGameMax'):score.toLocaleString(pageLang())+' / '+(1000).toLocaleString(pageLang())}<span>{t('competitionRules')}</span></summary><p>{t(ruleKeys[mode])}</p><p>{t('competitionGeneral')}</p></details>;
}
export function CompetitionPanel({app,date,mode}:{app:any;date?:string;mode?:PointMode}) {
  const {t,locale,boot}=app;
  const [data,setData]=useState<any>(null),[error,setError]=useState(false),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[tab,setTab]=useState<'today'|'total'>('today');
  useEffect(()=>{
    if(!boot.user.id)return;
    let active=true,sequence=0,timer:ReturnType<typeof setTimeout>;
    const load=async()=>{const seq=++sequence;setLoading(true);try{const result=await api('/competition'+(date?'?date='+date:'?')+(mode?'&mode='+mode:''));if(active&&seq===sequence){setData(result);setError(false);}}catch{if(active&&seq===sequence)setError(true);}finally{if(active&&seq===sequence)setLoading(false);}};
    const visible=()=>{if(document.visibilityState==='visible')load();};
    load();document.addEventListener('visibilitychange',visible);
    if(!date)timer=setTimeout(load,86400000-Date.now()%86400000+700);
    return()=>{active=false;clearTimeout(timer);document.removeEventListener('visibilitychange',visible);};
  },[boot.user.id,date,mode,reload]);
  const rank=(r:any)=>r?.place?t('competitionRank').replace('{rank}',r.place.toLocaleString(locale)).replace('{count}',r.participants.toLocaleString(locale)):t('competitionNoRank');
  const fmt=(n:number)=>n.toLocaleString(locale);
  const standings=data?.[tab];
  return <section className={'competition-panel'+(mode?' competition-result':'')} aria-label={t(mode?'competitionGame':'competitionTitle')}>
    <header><span className="competition-medal" aria-hidden="true">🏆</span><div><h2>{t(mode?'competitionScoreSaved':'competitionTitle')}</h2><p>{mode?t(titles[mode]):t('competitionIntro')}</p></div><button className="icon-btn" disabled={loading} aria-label={t('competitionRefresh')} onClick={()=>setReload(n=>n+1)}><RefreshCw size={17}/></button></header>
    {error&&<p role="alert">{t('competitionLoadError')}</p>}
    {!data&&!error&&<p role="status">{t('loading')}</p>}
    {data&&<>
      {mode&&data.game&&<div className="competition-game-result"><strong>{fmt(data.game.score)}<small> / {fmt(1000)}</small></strong><b>{rank(data.game)}</b><p>{t('competitionParticipants').replace('{count}',fmt(data.game.participants))}</p></div>}
      <div className="competition-totals">{(['today','total'] as const).map(key=><div key={key}><span>{t(key==='today'?'competitionToday':'competitionAllTime')}</span><strong>{fmt(data[key].score)}{key==='today'&&<small> / {fmt(data.maxPerDay)}</small>}</strong><p>{rank(data[key])}</p></div>)}</div>
      {!mode&&<div className="competition-stamps">{(['rank','daily','compare','mosaic','trail'] as PointMode[]).map(m=>{const result=data.scores.find((s:any)=>s.mode===m);return <div key={m} className={result?'is-scored':''}><span>{t(titles[m])}</span><b>{result?fmt(result.score):'—'}<small> / {fmt(1000)}</small></b></div>;})}</div>}
      <details className="competition-standings"><summary>{t('competitionLeaderboard')}</summary><div className="competition-tabs" role="group" aria-label={t('competitionLeaderboard')}><button aria-pressed={tab==='today'} onClick={()=>setTab('today')}>{t('competitionLeaderboard')}</button><button aria-pressed={tab==='total'} onClick={()=>setTab('total')}>{t('competitionTotalLeaders')}</button></div><ol>{standings.leaders.map((p:any,i:number)=><li key={i} className={p.me?'is-me':''}><b>#{p.place}</b><span>{p.me?t('competitionYou'):p.name}</span><strong>{fmt(p.score)}</strong></li>)}</ol>{!standings.leaders.length&&<p>{t('competitionNoRank')}</p>}<p>{t('competitionTies')}</p></details>
    </>}
    <details className="competition-rules"><summary>{t('competitionRules')}</summary><p>{t('competitionGeneral')}</p>{Object.entries(ruleKeys).map(([m,key])=><p key={m}><strong>{t(titles[m as PointMode])}. </strong>{t(key)}</p>)}<p>{t('competitionTies')}</p></details>
    {!!boot.user.guest&&<p className="competition-guest">{t('competitionGuest')}</p>}
  </section>;
}
