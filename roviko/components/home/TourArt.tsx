'use client';
import React from 'react';
import { GameIcon } from '../atelier/GameIcon';
import { TierBadge } from '../atelier/League';
import { Character } from '../ds/Character';
import { Coin, FlameMark } from '../ds/Coin';
import { GlobeAvatar } from '../ds/GlobeAvatar';
import { RovikoIcon } from '../ds/RovikoIcons';

/**
 * The pictures of the welcome tour (1.40), drawn in code instead of photos of illustrations: the game logos, Roviko
 * and the avatars are vectors, so every step is razor sharp on any screen. One soft scene per step.
 */
const Spark = ({ x, y, s = 1, c = '#f6b84b' }: { x: string; y: string; s?: number; c?: string }) =>
  <svg className="ta-spark" style={{ left: x, top: y, width: 22 * s, height: 22 * s }} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.3 7.2 7.2 2.3-7.2 2.3L12 20.5l-2.3-7.2L2.5 11l7.2-2.3z" fill={c}/></svg>;

export function TourArt({ step }: { step: string }) {
  if (step === 'g2') return <div className="tour-scene ts-detour" aria-hidden="true">
    <svg className="ta-route" viewBox="0 0 400 170" preserveAspectRatio="none"><path d="M18 140 C 90 40, 170 150, 236 84 S 360 40, 384 30" fill="none" stroke="#1f806b" strokeOpacity=".35" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round"/></svg>
    <span className="ta-pin" style={{ left: '7%', top: '72%' }}/><span className="ta-pin" style={{ left: '57%', top: '44%' }}/><span className="ta-pin is-goal" style={{ left: '92%', top: '12%' }}/>
    <GameIcon mode="daily" size="lg" className="ta-logo ta-main"/>
    <Character mood="happy" pose="wave" size={118} className="ta-char" animate={false}/>
    <Spark x="18%" y="14%"/><Spark x="80%" y="66%" s={.7} c="#1f806b"/>
  </div>;
  if (step === 'g3') return <div className="tour-scene ts-five" aria-hidden="true">
    {['rank', 'duel', 'compare', 'order', 'trail'].map((m, i) => <span key={m} className="ta-card" style={{ ['--i' as any]: i - 2 }}><GameIcon mode={m} size="lg"/></span>)}
    <span className="ta-coin"><Coin size={30}/><b>6.000</b></span>
  </div>;
  if (step === 'g5') return <div className="tour-scene ts-rank" aria-hidden="true">
    <div className="ta-podium">
      <span className="ta-step is-2"><GlobeAvatar id={3} size={46}/><i>2</i></span>
      <span className="ta-step is-1"><Character mood="cheer" pose="cheer" size={92} animate={false}/><i>1</i></span>
      <span className="ta-step is-3"><GlobeAvatar id={5} size={46}/><i>3</i></span>
    </div>
    <span className="ta-badge"><TierBadge tier={2} size={44}/></span>
    <Spark x="14%" y="18%"/><Spark x="84%" y="22%" s={.7} c="#1f806b"/>
  </div>;
  if (step === 'g6') return <div className="tour-scene ts-extra" aria-hidden="true">
    <div className="ta-grid">{['flags', 'capitals', 'pinpoint', 'borders', 'order', 'trail'].map(m => <GameIcon key={m} mode={m} size="lg"/>)}</div>
    <Character mood="wink" pose="point" size={104} className="ta-char" animate={false}/>
  </div>;
  if (step === 'g7') return <div className="tour-scene ts-explore" aria-hidden="true">
    <span className="ta-stamp is-a"><RovikoIcon name="earth" size={44}/></span>
    <span className="ta-stamp is-b"><RovikoIcon name="map" size={40}/></span>
    <span className="ta-stamp is-c"><RovikoIcon name="passport" size={46}/></span>
    <Character mood="curious" pose="point" size={118} className="ta-char" animate={false}/>
    <Spark x="12%" y="16%"/><Spark x="86%" y="70%" s={.7} c="#1f806b"/>
  </div>;
  if (step === 'g8') return <div className="tour-scene ts-together" aria-hidden="true">
    <div className="ta-friends">
      <GlobeAvatar id={1} size={70}/><GlobeAvatar id={0} size={92}/><GlobeAvatar id={6} size={70}/>
    </div>
    <span className="ta-bubble"><RovikoIcon name="group" size={30}/></span>
    <span className="ta-flame"><FlameMark size={30}/></span>
    <Spark x="16%" y="20%"/><Spark x="82%" y="18%" s={.7} c="#1f806b"/>
  </div>;
  return null;
}
