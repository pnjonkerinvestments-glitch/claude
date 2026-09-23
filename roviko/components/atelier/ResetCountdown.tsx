'use client';
import { useEffect, useState } from 'react';
import { formatCountdown, msUntilReset } from '@/lib/daily-loop';

/** Live time left until the 00:00 UTC reset. Renders a placeholder until mounted to keep SSR stable. */
export function useResetCountdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(msUntilReset());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  return ms;
}

export function ResetCountdown({ label, className = '' }: { label: string; className?: string }) {
  const ms = useResetCountdown();
  return <span className={'reset-countdown ' + className}><span>{label}</span><time aria-live="off">{ms === null ? '--:--:--' : formatCountdown(ms)}</time></span>;
}
