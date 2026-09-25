import React from 'react';

/** Original Roviko vector artwork. Decorative, never used as quiz geography. */
export function GameArtwork({ mode }: { mode: 'daily' | 'compare' | 'mosaic' }) {
  return <svg className={'game-art art-' + mode} viewBox="0 0 280 144" fill="none" aria-hidden="true" focusable="false">
    {mode === 'daily' ? <>
      <path d="M24 100C51 41 104 143 159 78S225 36 253 67" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" opacity=".4"/>
      <g transform="rotate(-10 121 75)"><rect x="65" y="20" width="108" height="115" rx="17" fill="#FFF9F0"/><rect x="77" y="32" width="84" height="91" rx="10" stroke="#1F665C" strokeWidth="1.5" strokeDasharray="3 4"/><circle cx="119" cy="68" r="23" fill="#49CDB5"/><ellipse cx="119" cy="68" rx="10" ry="23" stroke="#1F665C" strokeWidth="1.7"/><path d="M97 68h44m-40-12c12 6 26 6 37 0m-37 24c12-6 26-6 37 0" stroke="#1F665C" strokeWidth="1.7"/><path d="M101 105h36" stroke="#1F665C" strokeWidth="4" strokeLinecap="round"/></g>
      <circle cx="191" cy="94" r="29" fill="#FFD166"/><path d="m179 94 8 8 16-18" stroke="#17253D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="m215 25 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#FFF9F0"/>
    </> : mode === 'compare' ? <>
      <path d="M31 106c61 24 140 22 210-10" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" opacity=".35"/>
      <g transform="rotate(-9 96 74)"><rect x="49" y="25" width="92" height="101" rx="16" fill="#FFF9F0"/><rect x="66" y="42" width="58" height="37" rx="6" fill="#86C7F3"/><path d="m70 70 15-17 12 9 12-12 11 20" fill="#277C6D"/><path d="M68 99h31" stroke="#17253D" strokeWidth="4" strokeLinecap="round"/></g>
      <g transform="rotate(9 183 70)"><rect x="141" y="14" width="91" height="106" rx="16" fill="#17253D"/><rect x="157" y="30" width="59" height="37" rx="6" fill="#B6A0F5"/><circle cx="200" cy="41" r="6" fill="#FFD166"/><path d="m160 61 17-17 10 10 11-7 13 14" fill="#FFF9F0"/><path d="M160 92h34" stroke="#FFF9F0" strokeWidth="4" strokeLinecap="round"/></g>
      <circle cx="137" cy="78" r="20" fill="#FF927F"/><path d="m129 83 8-10 8 10" stroke="#17253D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </> : <>
      <g transform="rotate(-7 112 72)"><rect x="49" y="20" width="65" height="51" rx="12" fill="#FFF9F0"/><rect x="121" y="20" width="65" height="51" rx="12" fill="#17253D"/><rect x="49" y="78" width="65" height="51" rx="12" fill="#17253D"/><rect x="121" y="78" width="65" height="51" rx="12" fill="#FFF9F0"/>
      <path d="M69 58V34m1 1c13-7 18 9 30 1v15c-12 8-17-8-30-1" stroke="#1F665C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="m140 57 12-26 12 26m-19-9h14" stroke="#FFF9F0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="m68 99 14-8 15 8-7 16-13 4-9-20Z" fill="#49CDB5"/><circle cx="152" cy="99" r="9" fill="#FFD166"/><path d="M149 114h7m-9-8 2 5h6l3-5" stroke="#17253D" strokeWidth="2" strokeLinecap="round"/></g>
      <circle cx="213" cy="90" r="24" fill="#49CDB5"/><path d="m202 90 7 7 14-16" stroke="#17253D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="m224 28 2 6 7 3-7 2-2 7-3-7-6-2 6-3 3-6Z" fill="#FFF9F0"/>
    </>}
  </svg>;
}
