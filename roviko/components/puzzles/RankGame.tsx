'use client';
import { DailyResult } from '../atelier/DailyResult';
import { FinishStage } from '../ds/FinishStage';
import { RankBoardGame } from './RankBoardGame';
import { HowToPlayButton } from '../atelier/HowToPlay';
import { GameHeader, editionLabel } from '../game/GameHeader';
import { Peek, type CharacterMood } from '../ds/Character';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Flag, Share2, Radar, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { api, post, sound, formatScore } from '@/lib/client';
import { plural } from '@/lib/plural';
import { BRAND } from '@/lib/config';
import { challengeExtras, shareCard, squares } from '@/lib/share';
import { formatMetric } from '@/lib/puzzles/topics';
import type { RankView, RankOption } from '@/lib/puzzles/rank';
import { choicePlace, medalFor, medalSummary } from '@/lib/puzzles/rank-medals';

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
  useEffect(()=>{document.title=t('rankRadar')+' | '+BRAND.name;},[locale,t]);
  useEffect(()=>{if(game?.phase==='finished')refresh();},[game?.phase,refresh]);
  useEffect(()=>{if(game?.phase==='question')first.current?.focus({preventScroll:true});},[game?.question?.id]);
  async function save(action:'answer'|'next',answer?:string){
    if(!game||lock.current||error)return;
    const previous=game;lock.current=true;setBusy(true);
    if(action==='answer'&&!game.competition&&!game.board){
      if(game.phase!=='question'||!game.question?.options.some(o=>o.id===answer)){lock.current=false;setBusy(false);return;}
      const correct=answer===game.question.correct;
      setGame({...game,phase:'reveal',answers:[...game.answers,{value:answer!,correct,countryId:game.question.country.id,questionId:game.question.id,responseTime:0,at:new Date().getTime()}]});
      sound(correct?'correct':'incorrect');
    }
    try{const saved=await post('/ranks/'+id+'/'+action,{version:previous.version,...(answer?{answer}:{})});setGame(saved);if(game.competition&&action==='answer')sound(saved.answers.at(-1)?.correct?'correct':'incorrect');}
    catch{
      // Reconcile an uncertain write. Never replay a guess automatically.
      try{const saved=await api('/ranks/'+id);setGame(saved);if(saved.version<=previous.version)setError('puzzleSaveError');}
      catch{setGame(previous);setError('puzzleSaveError');}
    }finally{lock.current=false;setBusy(false);}
  }
  const choose=useRef(save);choose.current=save;
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,textarea,select,[role="dialog"],details'))return;if(game?.phase==='question'&&game.question&&/^[1-4]$/.test(e.key)){e.preventDefault();const id=game.question!.options[+e.key-1].id;setSelection(id);void choose.current('answer',id);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[game?.question?.id,game?.phase]);
  const fill=(key:string,values:Record<string,string|number>)=>Object.entries(values).reduce((s,[k,v])=>s.replace('{'+k+'}',String(v)),t(key));
  if(!game)return <div className="puzzle-loading" role="status"><Radar/><p>{t(error||'rankLoading')}</p>{error&&<button className="btn primary" onClick={load}>{t('retry')}</button>}</div>;
  const q=game.question,reveal=game.phase==='reveal',answer=game.answers.at(-1),winner=q?.options.find(o=>o.id===q.correct),picked=q?.options.find(o=>o.id===answer?.value);
  const correct=game.answers.filter(a=>a.correct).length;
  // Place of each answer among its four subjects (1 = strongest): from the review once finished, the revealed question, or the server.
  const places=game.answers.map((a,i)=>{const r=game.review?.[i]??(reveal&&i===game.answers.length-1&&q?q:null);return r?choicePlace(r.options,a.value):game.places?.[i]??(a.correct?1:2);});
  const place=reveal&&answer&&q?choicePlace(q.options,answer.value):0;
  const medals=medalSummary(places);
  const explanation=(o:RankOption,key:string)=>fill(key,{winner:o.label[lang] ?? o.label.en,choice:o.label[lang] ?? o.label.en,rank:o.rank,count:o.coverage,percent:o.topPercent});
  const share=()=>{const url=new URL('/daily',location.origin);url.searchParams.set('shared','rank');copy(`${BRAND.name} · ${t('rankRadar')} · ${game.daily??new Date().toISOString().slice(0,10)}\n${places.map(medalFor).join('')}\n${fill('rankMedalSummary',{gold:medals[1],silver:medals[2],bronze:medals[3]})}${game.competition?' · '+(game.score??0).toLocaleString(locale)+' '+t('points'):''}\n${url}`);};
  const again=async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{const fresh=await post('/ranks',{daily:false});go('/rank/'+fresh.id);}catch{setError('puzzleLoadError');}finally{lock.current=false;setBusy(false);}};
  if(game.board){
    const board=game.board;const pts=game.answers.reduce((n,a)=>n+(a.points??0),0);
    const shareBoard=()=>copy(shareCard({label:t('rankRadar'),date:game.daily,trail:game.answers.map(a=>a.correct?'🟩':(a.points??0)>=60?'🟨':'⬜').join(''),score:pts.toLocaleString(locale)+'/'+(1000).toLocaleString(locale)+' '+t('points')+(board.optimal?' · '+fill('rbOptimal',{n:board.optimal.toLocaleString(locale)}):''),streak:game.daily?app.boot?.stats?.dailyStreak:undefined,url:new URL('/daily?shared=rank',location.origin).toString(),points:game.competition?pts:undefined,extras:game.competition?challengeExtras(t,locale,'rank',game.daily,app.boot?.user?.name):undefined}));
    return <RankBoardGame game={game} app={app} busy={busy} error={error} save={save} again={again} share={shareBoard}/>;
  }
  const exit=()=>backToStart?backToStart():go('/daily');
  const mood:CharacterMood=!reveal?'happy':answer?.correct?'cheer':place===2?'wink':'shock';
  const headline=medals[1]===game.total?t('rankPerfectRun'):t('rankFinish'),finishMood=medals[1]===game.total?'cheer' as const:correct>=game.total/2?'happy' as const:'wink' as const;
  // The six medals of an older Rank Radar: its own motivation, kept on the end screen above the review.
  const medalRow=<div className="rank-medal-row" role="img" aria-label={fill('rankMedalSummary',{gold:medals[1],silver:medals[2],bronze:medals[3]})}>{places.map((p,i)=><span key={i} className={'place-'+p} title={t('rankPlace'+p)} aria-hidden="true">{medalFor(p)}</span>)}</div>;
  const review=<details className="result-review"><summary>{t('rankReview')}</summary><div className="rank-review">{game.review?.map((r,i)=>{const best=r.options.find(o=>o.id===r.correct)!;return <div key={r.id}><img src={r.country.flag} alt=""/><div><strong>{r.country.name[lang]}</strong><span>{best.emoji} {best.label[lang]} · #{best.rank} / {best.coverage}</span></div><span className={'rank-review-medal place-'+places[i]} role="img" aria-label={t('rankPlace'+places[i])}>{medalFor(places[i])}</span></div>;})}</div></details>;
  const summary=[{icon:'check' as const,value:correct+'/'+game.total,label:t('correctAnswers')}];
  // Older six-question Rank Radar (before the 1.21 board): the same trip style as the board, Roviko peeking over the country card.
  return <section className="puzzle-game rank-game rank-legacy">
    <GameHeader mode="rank" title={t('rankRadar')} edition={editionLabel(game.daily,lang,t('puzzleStartPractice'))} count={Math.min(game.round+1,game.total)+' / '+game.total} unit={t('countries')} progress={game.phase==='finished'?1:game.answers.length/game.total} onExit={exit} exitLabel={t('back')} help={<HowToPlayButton mode="rank" t={t} locale={lang} auto={game.phase!=='finished'}/>} kicker={false} score={game.competition&&game.phase!=='finished'?game.score??0:undefined} scoreLabel={plural(t,'scorePill',game.score??0,'{n}',formatScore(game.score??0))}/>
    {error&&<div className="puzzle-error" role="alert"><span>{t(error)}</span><button className="btn secondary" onClick={load}>{t('retry')}</button></div>}
    {game.phase==='finished'?game.competition
      // The same end as every daily game (DailyFinish): stage and place card, quiet Share and Done, practice again, then the medals and the folded review.
      ?<section className="daily-finish">
        <DailyResult app={app} date={game.daily!} mode="rank" summary={summary} stage={{game:t('rankRadar'),headline,mood:finishMood,chips:summary}}/>
        <div className="finish-actions"><button className="finish-quiet finish-share" disabled={busy} onClick={share}><Share2 size={16} aria-hidden="true"/>{t('share')}</button><button className="finish-quiet" onClick={exit}><Check size={16} strokeWidth={2.6} aria-hidden="true"/>{t('finishDone')}</button></div>
        <button className="text-link finish-again" disabled={busy} onClick={again}><RefreshCw size={15} aria-hidden="true"/>{t('finishPractice')}</button>
        {medalRow}{review}
      </section>
      :<div className="daily-finish rank-finished">
        <FinishStage game={t('rankRadar')} headline={headline} mood={finishMood} locale={locale} chips={summary}>{medalRow}</FinishStage>
        <div className="finish-actions"><button className="btn primary" disabled={busy} onClick={again}>{t('rankMore')}<ArrowRight size={17}/></button><button className="btn secondary" onClick={share}><Share2 size={17}/>{t('share')}</button></div>
        {review}
      </div>:q&&<>
      <header className={'rank-heading tp-card'+(reveal?answer?.correct?' is-right':' is-revealed':'')} key={q.id}>
        <Peek mood={mood} key={mood}/>
        <p className="tp-kicker">{fill('questionOf',{game:t('rankRadar'),n:Math.min(game.round+1,game.total),total:game.total})}</p>
        <span className="rank-country-flag"><img className="flag-img" src={q.country.flag} alt=""/></span>
        <h1>{fill('rankQuestion',{country:q.country.name[lang] ?? q.country.name.en})}</h1>
        <p className="rank-intro">{t('rankIntro')}</p>
      </header>
      <div className="rank-options">{q.options.map((o,i)=>{const best=reveal&&o.id===q.correct,chosen=reveal&&o.id===answer?.value,wrong=chosen&&!best;return <button key={o.id} ref={i===0?first:undefined} className={'rank-option'+(best?' rank-best':wrong?' rank-wrong':'')+(reveal?' rank-revealed':'')+(!reveal&&selection===o.id?' is-picked':'')} disabled={reveal||busy||!!error} aria-pressed={!reveal && selection===o.id} aria-keyshortcuts={String(i+1)} onClick={()=>{setSelection(o.id);void save('answer',o.id);}} aria-label={o.label[lang]+(reveal?' · #'+o.rank+' / '+o.coverage+' · '+t(best?'rankBest':chosen?'rankYourChoice':'rankOther'):'')}>
        <span className="rank-option-top"><span className="rank-option-emoji" aria-hidden="true">{o.emoji}</span>{reveal&&<span className="rank-option-status"><span className="rank-option-medal" aria-hidden="true">{medalFor(choicePlace(q.options,o.id))}</span>{best?<Check size={18}/>:wrong?<X size={18}/>:null}</span>}</span><strong className="rank-option-title">{o.label[lang]}</strong>
        {reveal?<><div className="rank-position"><strong>#{o.rank}</strong><span>{fill('rankOf',{n:o.coverage})}</span></div><div className="rank-position-track" aria-hidden="true"><span style={{width:Math.max(3,(1-o.position)*100)+'%'}}/></div><span className="rank-option-metric">{rankValue(o,lang)}</span><span className="rank-option-year">{o.referenceYear?(o.referenceYear+(o.estimated?' · '+t('rankEstimate'):'')):t('rankArchived')}</span><span className="rank-option-foot">{chosen?t('rankYourChoice')+' · ':''}{t('rankPlace'+choicePlace(q.options,o.id))}<span>{fill('rankTop',{n:o.topPercent})}</span></span></>:<span className="rank-option-pick">{t('rankChoose')}<ArrowRight size={17}/></span>}
      </button>;})}</div>
      {reveal&&winner&&picked&&<div className={'rank-feedback '+(answer?.correct?'is-good':'is-wrong')} data-place={place} role="status"><span className="rank-feedback-icon">{answer?.correct?<Check size={22}/>:<X size={22}/>}</span><div><strong><span aria-hidden="true">{medalFor(place)} </span>{t('rankVerdict'+place)}</strong><p>{explanation(winner,'rankBecause')}</p>{!answer?.correct&&<p>{explanation(picked,'rankInstead')}</p>}</div></div>}
      <div className="rank-controls"><span className="puzzle-save" role="status">{busy?t('saving'):error?'':'✓ '+t('saved')}</span>{reveal&&<button className="btn primary" disabled={busy||!!error} onClick={()=>save('next')}>{t(game.round+1===game.total?'finish':'next')}<ArrowRight size={18}/></button>}</div>
      <details className="rank-help"><summary>{t('rankRules')}</summary><p>{t('rankRulesCopy')}</p><p>{t('rankSourceNote')}</p></details>
      <details className="rank-help"><summary>{t('rankData')}</summary>{q.options.map(o=><div className="rank-definition" key={o.id}><strong>{o.emoji} {o.label[lang]}</strong><p>{o.explanation[lang]}</p>{reveal&&<><p>{o.place&&o.place+' · '}{rankValue(o,lang)}</p><a href={o.sourceUrl} target="_blank" rel="noreferrer">{o.source} ↗</a></>}</div>)}</details>
      <div className="rank-footer"><button className="text-link muted" onClick={()=>report({id:q.id,mode:'rank'})}><Flag size={14}/>{t('reportIssue')}</button><a href="/sources">{t('sources')}</a></div>
    </>}
  </section>;
}
