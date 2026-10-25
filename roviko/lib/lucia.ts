import { DEFAULT_SETTINGS } from './config';

/**
 * Lucia (1.30): Roviko's computer friend, shown everywhere as "Lucia 👽" (the owner's choice: an alien suits the globe) and
 * under "Computer · medium" in rooms, so players know she is the computer.
 * Her account comes from migration 0011 (no email, no password: nobody can sign in as her). Players add her with
 * friend code CAFE1C1A; she accepts after a minute (checked on the next friends or presence request), joins any room she is invited to as a medium computer player, and
 * invites her online friends into a room she hosts: medium, 15 questions. Since 1.50 every account has her as a friend
 * from the start, and she invites at most once a day, LUCIA_INVITE_AFTER after the player came online; after
 * LUCIA_MAX_NOES invites in a row without a yes she never invites that player again (server/presence.ts).
 * Matches with her count as practice, like every match against the computer.
 */
export const LUCIA_ID = 'cafe1c1a-0000-4000-8000-000000000001';
export const LUCIA_NAME = 'Lucia 👽';
export const LUCIA_AVATAR = 3;
/** 1.50: Lucia's daily invite comes this long after the player came online. */
export const LUCIA_INVITE_AFTER = 30000;
/** 1.50: after this many invites in a row without a yes (declined or unanswered) she stops inviting for good. */
export const LUCIA_MAX_NOES = 2;
/** Lucia takes a moment before she accepts a friend request (1.31), like a person would. */
export const LUCIA_ACCEPT_AFTER = 60000;
export const LUCIA_SETTINGS = { ...DEFAULT_SETTINGS, count: 15, difficulty: 'medium', timer: 15 };
export const isLucia = (id: string | null | undefined) => id === LUCIA_ID;
