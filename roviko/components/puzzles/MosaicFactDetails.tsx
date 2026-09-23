import React from 'react';
import type { Tile } from '@/lib/puzzles/model';

/** Render only for solved countries. Archived hints are projected to the current numeric edition on the server. */
export function MosaicFactDetails({ tile, locale, t }: { tile?: Tile; locale: 'en' | 'nl'; t: (key: string) => string }) {
  if (!tile?.fact) return null;
  const { explanation, source } = tile.fact;
  return <details className="mosaic-fact-reveal">
    <summary>{t('mosaicFactStory')}</summary>
    <p>{explanation[locale]}</p>
    <p className="mosaic-fact-credit">{t('mosaicFactCredit')} <a href={source.url} target="_blank" rel="noreferrer">{source.provider} · {source.title}</a>. <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a>.</p>
  </details>;
}
