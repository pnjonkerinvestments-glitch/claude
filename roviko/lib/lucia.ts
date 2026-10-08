import { DEFAULT_SETTINGS } from './config';

/**
 * Lucia (1.30): Roviko's computer friend, shown everywhere as "Lucia 👽" (the owner's choice: an alien suits the globe) and
 * under "Computer · medium" in rooms, so players know she is the computer.
 * Her account comes from migration 0011 (no email, no password: nobody can sign in as her). Players add her with
 * friend code CAFE1C1A; she accepts at once, joins any room she is invited to as a medium computer player, and
 * invites her online friends (at most once per LUCIA_INVITE_GAP per friend) into a room she hosts: medium, 15 questions.
 * Matches with her count as practice, like every match against the computer.
 */
export const LUCIA_ID = 'cafe1c1a-0000-4000-8000-000000000001';
export const LUCIA_NAME = 'Lucia 👽';
export const LUCIA_AVATAR = 3;
export const LUCIA_INVITE_GAP = 3 * 3600000;
export const LUCIA_SETTINGS = { ...DEFAULT_SETTINGS, count: 15, difficulty: 'medium', timer: 15 };
export const isLucia = (id: string | null | undefined) => id === LUCIA_ID;
