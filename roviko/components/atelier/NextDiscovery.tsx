'use client';
import { useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { post } from '@/lib/client';
import { nextMode } from '@/lib/next-discovery';

export function NextDiscovery({result,t,go,fail,disabled=false}:any) {
  const hasMisses=result.answers?.some((a:any)=>!a.correct), mode=nextMode(result.daily?'daily':result.mode ?? result.settings?.mode);
  const [busy,setBusy]=useState(false),lock=useRef(false);
  async function play(){
    if(lock.current || disabled)return;lock.current=true;setBusy(true);
    try{const game=await post('/next-round',{sessionId:result.id,intent:hasMisses?'review':'next'});go(game.href);}catch(e){fail(e);}finally{lock.current=false;setBusy(false);}
  }
  return <section className="next-discovery"><span className="eyebrow">{t(hasMisses?'reviewRoundLabel':'oneMoreTitle')}</span><h2>{t(hasMisses?'reviewMyMisses':'nextStep'+mode)}</h2><p>{t(hasMisses?'reviewRoundCopy':'shortRound')}</p><div className="next-actions"><button className="btn primary" disabled={busy || disabled} onClick={play}>{hasMisses?<RotateCcw size={18}/>:<ArrowRight size={18}/>} {busy?t('loading'):hasMisses?t('reviewMyMisses'):t('tryNext').replace('{game}',t(mode))}</button></div></section>;
}
