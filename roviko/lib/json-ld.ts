// 1.61: what Roviko is, in the form search engines read (schema.org): a free geography game in a browser.
import { BRAND } from './config';
import { SITE_URL } from './site-metadata';
import { localPath, type Lang } from './landing';
import { PAGE_META } from './landing-copy';

export function siteJsonLd(lang: Lang) {
  const url = SITE_URL + localPath('', lang), description = PAGE_META[lang][''].description;
  const graph = [
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', name: BRAND.name, url: SITE_URL + '/', inLanguage: ['en', 'nl', 'es'], publisher: { '@type': 'Organization', name: 'Jonker Studios' } },
    { '@type': 'VideoGame', name: BRAND.name, url, description, inLanguage: lang, genre: ['Educational', 'Trivia', 'Geography'], gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any',
      image: SITE_URL + '/og/roviko-1200x630.png', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, publisher: { '@type': 'Organization', name: 'Jonker Studios' } },
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
