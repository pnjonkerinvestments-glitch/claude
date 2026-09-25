'use client';
import { useResetLabel } from '../home/useDay';

/**
 * Calm time left until the next daily games ("3h 42m"), in the page language.
 * Renders a non-breaking space until mounted, so server and client markup agree and nothing shifts.
 */
export function ResetCountdown({ label, t, className = '' }: { label: string; t: (key: string) => string; className?: string }) {
  const left = useResetLabel(t);
  return <span className={'reset-countdown ' + className}><span>{label}</span> <time aria-live="off">{left ?? ' '}</time></span>;
}
