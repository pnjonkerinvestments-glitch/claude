'use client';
import { createContext, useContext } from 'react';
/** Everything the screens share: translations, the signed-in player, navigation and game start. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AppContext = createContext<any>(null);
export function useApp() { return useContext(AppContext); }
