import type { Question, Settings } from '../lib/game-engine/questions';
export type Env = {
    DB: any;
    ASSETS: any;
    ADMIN_USER_IDS?: string;
    DEV_MULTIPLAYER_BOTS?: string;
    ENVIRONMENT?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
};
export type User = {
    id: string;
    email: string | null;
    name: string;
    avatar: number;
    guest: number;
    discoverable: number;
    blocked: number;
    created_at: number;
};
export type Player = {
    connectionToken?: string;
    id: string;
    name: string;
    avatar: number;
    ready: boolean;
    lastSeen: number;
    score: number;
    streak: number;
    bestStreak: number;
    correct: number;
    answered?: boolean;
    delta?: number;
    previousRank?: number;
    results: any[];
    bot?: boolean;
    /** Computer opponent skill; only set on bots. */
    level?: import('../lib/game-engine/bots').BotLevel;
};
export type Room = {
    code: string;
    name: string;
    host: string;
    settings: Settings;
    players: Player[];
    phase: 'lobby' | 'countdown' | 'question' | 'reveal' | 'finished';
    questions: Question[];
    round: number;
    startAt: number;
    deadline: number;
    revealUntil: number;
    answersCompleteAt?: number;
    matchId: string;
    answers: Record<string, {
        value: unknown;
        at: number;
    }>;
    previousQuestions: string[];
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
    events: string[];
    /** Quick match against a random player: 'open' while searching, 'matched' once someone joined, 'computer' when the player chose a bot. */
    quick?: 'open' | 'matched' | 'computer';
};
export type Solo = {
    competition?: import('../lib/daily-scoring').Competition;
    practice?: boolean;
    reviewOf?: string;
    cluesShown?: Record<number, number>;
    datasetVersion?: string;
    id: string;
    questions: Question[];
    settings: Settings;
    round: number;
    startAt: number;
    startedAt: number;
    score: number;
    streak: number;
    bestStreak: number;
    answers: any[];
    phase: 'question' | 'reveal' | 'finished';
    daily: string | null;
    xp: number;
    personalBest: number;
};
