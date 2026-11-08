'use client';
import { useContext, useEffect } from 'react';
import { AppContext } from '../app/context';

/** 1.58: an end screen brings the top bar and the tab bar back (RovikoApp hides them while you play). */
export function useResultNav() {
  const app = useContext(AppContext);
  useEffect(() => { app?.setResultNav?.(true); return () => app?.setResultNav?.(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
