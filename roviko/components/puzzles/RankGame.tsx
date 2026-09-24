'use client';
import { CompetitionPanel, DailyScoreRule } from '../atelier/Competition';
import { DailyLoop } from '../atelier/DailyLoop';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Flag, Share2, Radar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { api, post, sound } from '@/lib/client';
import { shareResult } from '@/lib/share';
import { BRAND } from '@/lib/config';
import { formatMetric } from '@/lib/puzzles/topics';
import type { RankView, RankOption } from '@/lib/puzzles/rank';

export function rankValue(option: RankOption, locale: 'en' | 'nl' | 'es') {
  return formatMetric(option.value, option.unit, locale) + (option.unit === 'm' ? ' m' : '');
}
export function RankGame({ id, app }: { id: string; app: any }) {
  const {t,locale,go,refresh,muted,copy,report,backToStart}=app;
  const lang=locale as 'en'|'nl'|'es';
  const [game,setGame]=useState<RankView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [selection,setSelection]=useState<string|null>(null);
  useEffect(()=>setSelection(null),[game?.question?.id]);
  const lock=useRef(false),first=useRef<HTMLButtonElement>(null);
  const load=useCallback(async()=>{setError('');try{setGame(await api('/ranks/'+id));}catch{setError('puzzleLoadError');}},[id]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{document.title=t('rank')+' | '+BRAND.name;},[locale,t]);
  useEffect(()=>{if(game?.phase==='finished')refresh();},[game?.phase,refresh]);
  useEffect(()=>{if(game?.phase==='question')first.current?.focus({preventScroll:true});},[game?.question?.id]);
  async function save(action:'answer'|'next',answer?:string){
    if(!game||lock.current||error)return;
    const previous=game;lock.current=true;setBusy(true);
    if(action==='answer'&&!game.competition){
      if(game.phase!=='question'||!game.question?.options.some(o=>o.id===answer)){lock.current=false;setBusy(false);return;}
      const correct=answer===game.question.correct;
      setGame({...game,phase:'reveal',answers:[...game.answers,{value:answer!,correct,countryId:game.question.country.id,questionId:game.question.id,responseTime:0,at:Date.now()}]});
      if(!muted)sound(correct?'correct':'incorrect');
    }
    try{const saved=await post('/ranks/'+id+'/'+action,{version:previous.version,...(answer?{answer}:{})});setGame(saved);if(game.competition&&action==='answer'&&!muted)sound(saved.answers.at(-1)?.correct?'correct':'incorrect');}
    catch{
      // Reconcile an uncertain write. Never replay a guess automatically.
      try{const saved=await api('/ranks/'+id);setGame(saved);if(saved.version<=previous.version)setError('puzzleSaveError');}
      catch{setGame(previous);setError('puzzleSaveError');}
    }finally{lock.current=false;setBusy(false);}
  }
  const choose=useRef(save);choose.current=save;
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,textarea,select,[role="dialog"],details'))return;if(game?.phase==='question'&&/^[1-4]$/.test(e.key)){e.preventDefault();setSelection(game.question!.options[+e.key-1].id);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[game?.question?.id,game?.phase]);
  const fill=(key:string,values:Record<string,string|number>)=>Object.entries(values).reduce((s,[k,v])=>s.replace('{'+k+'}',String(v)),t(key));
  if(!game)return <div className="puzzle-loading" role="status"><Radar/><p>{t(error||'rankLoading')}</p>{error&&<button className="btn primary" onClick={load}>{t('retry')}</button>}</div>;
  const q=game.question,reveal=game.phase==='reveal',answer=game.answers.at(-1),winner=q?.options.find(o=>o.id===q.correct),picked=q?.options.find(o=>o.id===answer?.value);
  const correct=game.answers.filter(a=>a.correct).length;
  const explanation=(o:RankOption,key:string)=>fill(key,{winner:o.label[lang] ?? o.label.en,choice:o.label[lang] ?? o.label.en,rank:o.rank,count:o.coverage,percent:o.topPercent});
  const share=()=>copy(shareResult({mode:'rank',label:t('rank'),date:game.daily,correct,total:game.total,answers:game.answers.map(a=>a.correct),origin:location.origin,detail:game.competition?(game.score??0).toLocaleString(locale)+' '+t('points'):undefined}));
  const again=async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{const fresh=await post('/ranks',{daily:false});go('/rank/'+fresh.id);}catch{setError('puzzleLoadError');}finally{lock.current=false;setBusy(false);}};
  return <section className="puzzle-game rank-game">
    <div className="puzzle-top"><button className="icon-btn" onClick={()=>backToStart?backToStart():go('/daily')} aria-label={t('back')}><ArrowLeft size={20}/></button><div><strong><Radar size={18}/> {t('rank')}</strong><small>{game.daily??t('puzzleStartPractice')}</small></div><span className="puzzle-count">{Math.min(game.round+1,game.total)} / {game.total}<small>{t('countries')}</small></span></div>
    <Progress className="puzzle-progress" value={game.answers.length/game.total*100}/>
    {game.competition&&game.phase!=='finished'&&<DailyScoreRule t={t} mode="rank" score={game.score}/>}{error&&<div className="puzzle-error" role="alert"><span>{t(error)}</span><button className="btn secondary" onClick={load}>{t('retry')}</button></div>}
    {game.phase==='finished'?<div className="rank-finished">
      <div className="rank-finish-art"><img src="/art/rank-radar-480.webp" width="480" height="320" alt=""/></div><p className="rank-eyebrow">{t('rank')}</p><h1>{t('rankFinish')}</h1><p>{t('rankFinishCopy')}</p>
      <div className="rank-result"><strong>{correct}<span> / {game.total}</span></strong><span>{t('correctAnswers')}</span></div>
      <div className="puzzle-answer-trail" aria-label={t('correctAnswers')}>{game.answers.map((a,i)=><span key={i} className={a.correct?'correct':''} aria-label={`${i+1}: ${t(a.correct?'correct':'incorrect')}`}>{a.correct?<Check size={18}/>:<X size={18}/>}</span>)}</div>
      {game.competition&&<CompetitionPanel app={app} date={game.daily!} mode="rank"/>}{game.daily&&<DailyLoop app={app}/>}
      <div className="rank-results-actions"><button className="btn primary" disabled={busy} onClick={again}>{t('rankMore')}<ArrowRight size={18}/></button><button className="btn secondary" onClick={share}><Share2 size={18}/>{t('share')}</button></div>
      <h2>{t('rankReview')}</h2><div className="rank-review">{game.review?.map((r,i)=>{const best=r.options.find(o=>o.id===r.correct)!;return <div key={r.id}><img src={r.country.flag} alt=""/><div><strong>{r.country.name[lang]}</strong><span>{best.emoji} {best.label[lang]} · #{best.rank} / {best.coverage}</span></div><span className={game.answers[i].correct?'rank-check':'rank-miss'} aria-label={t(game.answers[i].correct?'correct':'incorrect')}>{game.answers[i].correct?<Check size={18}/>:<X size={18}/>}</span></div>;})}</div>
      <button className="text-link" onClick={()=>go('/daily')}>{t('finishForNow')}<ArrowRight size={16}/></button>
    </div>:q&&<>
      <header className="rank-heading"><div className="rank-country-flag"><img src={q.country.flag} alt=""/></div><p className="rank-eyebrow">{t(game.daily?'rankDay':'rank')}</p><h1>{fill('rankQuestion',{country:q.country.name[lang] ?? q.country.name.en})}</h1><p>{t('rankIntro')}</p></header>
      <div className="rank-options">{q.options.map((o,i)=>{const best=reveal&&o.id===q.correct,chosen=reveal&&o.id===answer?.value,wrong=chosen&&!best;return <button key={o.id} ref={i===0?first:undefined} className={'rank-option'+(best?' rank-best':wrong?' rank-wrong':'')+(reveal?' rank-revealed':'')} disabled={reveal||busy||!!error} aria-pressed={!reveal && selection===o.id} onClick={()=>setSelection(o.id)} aria-label={o.label[lang]+(reveal?' · #'+o.rank+' / '+o.coverage+' · '+t(best?'rankBest':chosen?'rankYourChoice':'rankOther'):'')}>
        <span className="rank-option-top"><span className="rank-option-emoji" aria-hidden="true">{o.emoji}</span><span className="rank-option-status">{best?<Check size={18}/>:wrong?<X size={18}/>:<span aria-hidden="true">{i+1}</span>}</span></span><strong className="rank-option-title">{o.label[lang]}</strong>
        {reveal?<><div className="rank-position"><strong>#{o.rank}</strong><span>{fill('rankOf',{n:o.coverage})}</span></div><div className="rank-position-track" aria-hidden="true"><span style={{width:Math.max(3,(1-o.position)*100)+'%'}}/></div><span className="rank-option-metric">{rankValue(o,lang)}</span><span className="rank-option-year">{o.referenceYear?(o.referenceYear+(o.estimated?' · '+t('rankEstimate'):'')):t('rankArchived')}</span><span className="rank-option-foot">{t(best?'rankBest':chosen?'rankYourChoice':'rankOther')}<span>{fill('rankTop',{n:o.topPercent})}</span></span></>:<span className="rank-option-pick">{t('rankChoose')}<ArrowRight size={17}/></span>}
      </button>;})}</div>
      {!reveal&&<button className="btn primary answer-submit" disabled={!selection||busy||!!error} onClick={()=>selection&&save('answer',selection)}>{t('confirmChoice')}<Check size={18}/></button>}
      {reveal&&winner&&picked&&<div className={'rank-feedback '+(answer?.correct?'is-good':'is-wrong')} role="status"><span className="rank-feedback-icon">{answer?.correct?<Check size={22}/>:<X size={22}/>}</span><div><strong>{t(answer?.correct?'rankRight':'rankWrong')}</strong><p>{explanation(winner,'rankBecause')}</p>{!answer?.correct&&<p>{explanation(picked,'rankInstead')}</p>}</div></div>}
      <div className="rank-controls"><span className="puzzle-save" role="status">{busy?t('saving'):error?'':'✓ '+t('saved')}</span>{reveal&&<button className="btn primary" disabled={busy||!!error} onClick={()=>save('next')}>{t(game.round+1===game.total?'finish':'next')}<ArrowRight size={18}/></button>}</div>
      <details className="rank-help"><summary>{t('rankRules')}</summary><p>{t('rankRulesCopy')}</p><p>{t('rankSourceNote')}</p></details>
      <details className="rank-help"><summary>{t('rankData')}</summary>{q.options.map(o=><div className="rank-definition" key={o.id}><strong>{o.emoji} {o.label[lang]}</strong><p>{o.explanation[lang]}</p>{reveal&&<><p>{o.place&&o.place+' · '}{rankValue(o,lang)}</p><a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.source} ↗</a></>}</div>)}</details>
      <div className="rank-footer"><button className="text-link muted" onClick={()=>report({id:q.id,mode:'rank'})}><Flag size={14}/>{t('reportIssue')}</button><a href="/sources">{t('sources')}</a></div>
    </>}
  </section>;
}
