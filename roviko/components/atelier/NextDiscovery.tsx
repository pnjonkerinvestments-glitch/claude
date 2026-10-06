'use client';
import { useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { post } from '@/lib/client';
import { nextMode } from '@/lib/next-discovery';
import { GameIcon } from './GameIcon';

/** After a practice game: one forest pill, to practise your misses or on to the next game, with one short line. */
export function NextDiscovery({result,t,go,fail,disabled=false}:any) {
  const hasMisses=result.answers?.some((a:any)=>!a.correct), mode=nextMode(result.daily?'daily':result.mode ?? result.settings?.mode);
  const [busy,setBusy]=useState(false),lock=useRef(false);
  async function play(){
    if(lock.current || disabled)return;lock.current=true;setBusy(true);
    try{const game=await post('/next-round',{sessionId:result.id,intent:hasMisses?'review':'next'});go(game.href);}catch(e){fail(e);}finally{lock.current=false;setBusy(false);}
  }
  return <section className="next-discovery" aria-labelledby="next-discovery-title">
    <p className="t-kicker" id="next-discovery-title">{t(hasMisses?'reviewRoundLabel':'oneMoreTitle')}</p>
    <button className="btn primary btn-lg nd-play" disabled={busy || disabled} aria-busy={busy} onClick={play}>{hasMisses?<RotateCcw size={18} aria-hidden="true"/>:<GameIcon mode={mode} size="sm"/>}{busy?t('loading'):hasMisses?t('reviewMyMisses'):t('tryNext').replace('{game}',t(mode))}{!hasMisses && <ArrowRight size={18} aria-hidden="true"/>}</button>
    <p className="nd-note">{t(hasMisses?'reviewRoundCopy':'shortRound')}</p>
  </section>;
}
