/** Monday of the (UTC) week that contains this date: weekly rankings and leagues run Monday to Sunday. */
export function weekStart(date: string) { const d = new Date(date + 'T00:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10); }
