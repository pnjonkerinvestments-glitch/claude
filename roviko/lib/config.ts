export const BRAND = { name: 'Roviko', version: '1.33.0', tagline: 'The world is your playground.', url: '' };
export const FEATURES = { quickMatch: false, ranked: false, payments: false, chat: false };
export const GEOGRAPHY_POLICY = { definition: 'UN members plus observer states', excludeSensitiveCapitalQuestions: ['PSE', 'ISR'], puzzleSensitiveCountries: ['RUS', 'UKR', 'ISR', 'PSE'], populationQuestions: false, mapTarget: 'country geometry with a declared 25 km boundary tolerance; legacy sessions retain reference-point rules' };
export const MODES = ['trail', 'capitals', 'flags', 'pinpoint', 'borders', 'order'] as const;
export type Mode = typeof MODES[number];
export const MODE_EMOJIS: Record<string, string> = { trail: '🧭', capitals: '🏙️', flags: '🚩', pinpoint: '🗺️', borders: '🤝', order: '📏', mixed: '🌍', daily: '☀️', compare: '⚖️', mosaic: '🧩', rank: '📡' };
export const REGIONS = ['World', 'Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania'];
export const DEFAULT_SETTINGS = { mode: 'mixed', count: 10, timer: 15, difficulty: 'medium', region: 'World', typed: false };
/** The iPhone app in the App Store (Apple ID 6816171629). Leave empty to hide every get-the-app prompt. */
export const APP_STORE_ID = '6816171629';
export const APP_STORE_URL = 'https://apps.apple.com/app/id' + APP_STORE_ID;
/** How long a right answer stays on screen before the game moves on by itself (1.26). */
export const QUICK_NEXT_MS = 800;
