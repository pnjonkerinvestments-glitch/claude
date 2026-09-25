// Player names are the only text players write that others see. This filter runs on the server
// (and in the name form for instant feedback). It normalises case, accents, spacing and leetspeak
// before looking for offensive words in English, Dutch and Spanish, so "K4nk3r" or "f.u.c.k" fail too.

/** Offensive words and slurs, stored normalised (lowercase, no accents, letters only). */
const BLOCKED = [
  // English
  'fuck', 'fuk', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'whore', 'slut', 'bastard', 'asshole', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'rapist', 'rape', 'porn', 'sex', 'nazi', 'hitler', 'kkk', 'wank', 'twat', 'penis', 'vagina', 'boob', 'tits', 'kill',
  // Dutch
  'kanker', 'kut', 'neuk', 'hoer', 'slet', 'lul', 'pik', 'tering', 'tyfus', 'klootzak', 'mongool', 'homo', 'flikker', 'nikker', 'godver', 'teef', 'debiel', 'kkr', 'kk',
  // Spanish
  'puta', 'puto', 'mierda', 'joder', 'cabron', 'polla', 'coño', 'cono', 'marica', 'maricon', 'pendejo', 'culo', 'verga', 'zorra', 'follar', 'gilipollas', 'chingar', 'chinga',
];
/** Words that also occur inside ordinary names or words (Grapefruit, catering, Fukuoka, Vergara), so they only count as a whole word. */
const WHOLE_WORD_ONLY = new Set(['rape', 'hoer', 'tering', 'puta', 'verga', 'fuk', 'dick', 'cock', 'fag', 'lul', 'pik', 'kk', 'kkr', 'kut', 'sex', 'kill', 'homo', 'culo', 'cono', 'puto', 'teef', 'tits', 'boob', 'kkk']);
/** Real words and places that contain a blocked word (the "Scunthorpe problem"); removed before checking. */
const ALLOWED = ['scunthorpe', 'penistone', 'therapist', 'shiitake', 'shitake', 'cockburn', 'hancock', 'peacock', 'dickens', 'dickinson'];
/** Also no links or contact details in names. */
const LINKS = /(https?|www\.|\.com|\.nl|\.net|\.org|@)/i;

const LEET: Record<string, string> = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g' };

/** Lowercase, strip accents and leetspeak; keep word boundaries as single spaces. */
export function normaliseName(raw: string) {
  return raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[43@1!05$789]/g, c => LEET[c] ?? c)
    .replace(/[^a-z\s]+/g, '')
    .replace(/\s+/g, ' ').trim();
}

/** True when a display name is fine to show to other players. */
export function nameAllowed(raw: string) {
  if (LINKS.test(raw)) return false;
  const words = normaliseName(raw.replace(/[._-]/g, ' ')).split(' ').filter(Boolean).filter(w => !ALLOWED.includes(w));
  const joined = words.join('');
  // Squeezed letters catch "f u c k" and "f.u.c.k"; repeated letters ("fuuuck") collapse first.
  const squeezed = joined.replace(/(.)\1+/g, '$1');
  for (const w of BLOCKED) {
    if (WHOLE_WORD_ONLY.has(w)) { if (words.includes(w) || words.map(x => x.replace(/(.)\1+/g, '$1')).includes(w) || joined === w) return false; continue; }
    if (joined.includes(w) || squeezed.includes(w)) return false;
  }
  return true;
}
