export const BRAND = { name: 'Roviko', version: '1.19.0', tagline: 'The world is your playground.', url: '' };
export const FEATURES = { quickMatch: false, ranked: false, payments: false, chat: false };
export const GEOGRAPHY_POLICY = { definition: 'UN members plus observer states', excludeSensitiveCapitalQuestions: ['PSE', 'ISR'], puzzleSensitiveCountries: ['RUS', 'UKR', 'ISR', 'PSE'], populationQuestions: false, mapTarget: 'country geometry with a declared 25 km boundary tolerance; legacy sessions retain reference-point rules' };
export const MODES = ['trail', 'capitals', 'flags', 'pinpoint', 'borders', 'order'] as const;
export type Mode = typeof MODES[number];
export const MODE_EMOJIS: Record<string, string> = { trail: '🧭', capitals: '🏙️', flags: '🚩', pinpoint: '🗺️', borders: '🤝', order: '📏', mixed: '🌍', daily: '☀️', compare: '⚖️', mosaic: '🧩', rank: '📡' };
export const REGIONS = ['World', 'Europe', 'Africa', 'Asia', 'North America', 'South America', 'Oceania'];
export const DEFAULT_SETTINGS = { mode: 'mixed', count: 10, timer: 15, difficulty: 'medium', region: 'World', typed: false };
