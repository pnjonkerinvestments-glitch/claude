type Wire = Pick<WebSocket, 'readyState' | 'send' | 'close' | 'onopen' | 'onclose' | 'onerror' | 'onmessage'>;
type Dependencies = {
    join: () => Promise<any>;
    open: () => Wire;
    state: (value: any, source: 'snapshot' | 'live') => void;
    status: (connected: boolean, error: string) => void;
    rejected: (code: string) => void;
    timing?: { join?: number; handshake: number; heartbeat: number; stale: number; retry: number };
};
/** HTTP supplies the first snapshot; WebSocket is the sole live transport.
 * A socket is usable only after its first authoritative state, not merely open.
 * Every wait is bounded. Retrying never replays an answer or host action. */
export function createRoomClient(deps: Dependencies) {
    const timing = deps.timing ?? { handshake: 10000, heartbeat: 8000, stale: 22000, retry: 1000 };
    let stopped = false, generation = 0, attempts = 0, socket: Wire | undefined, live = false;
    let deadline: ReturnType<typeof setTimeout>, heartbeat: ReturnType<typeof setInterval>, retry: ReturnType<typeof setTimeout>;
    const clear = () => { clearTimeout(deadline); clearInterval(heartbeat); clearTimeout(retry); live = false; const old = socket; socket = undefined; if (old) { old.onclose = old.onerror = old.onmessage = old.onopen = null; old.close(); } };
    const terminal = new Set(['ROOM_NOT_FOUND', 'ROOM_EXPIRED', 'ROOM_FULL', 'MATCH_IN_PROGRESS', 'INVALID_ROOM_CODE', 'SESSION_EXPIRED', 'BLOCKED', 'DUPLICATE_SESSION']);
    const fail = (code: string, current: number) => {
        if (stopped || current !== generation) return;
        generation++; clear(); deps.status(false, code);
        if (!terminal.has(code) && ++attempts < 3) retry = setTimeout(connect, timing.retry * attempts);
    };
    const connect = async () => {
        if (stopped) return;
        clear(); const current = ++generation;
        deps.status(false, '');
        // Bound even a join implementation that never resolves.
        deadline = setTimeout(() => fail('REQUEST_TIMEOUT', current), timing.join ?? 13000);
        try {
            const snapshot = await deps.join();
            if (stopped || current !== generation) return;
            deps.state(snapshot, 'snapshot');
            clearTimeout(deadline);
            const ws = deps.open(); socket = ws;
            deadline = setTimeout(() => fail('REALTIME_UNAVAILABLE', current), timing.handshake);
            ws.onopen = () => { /* The first state confirms that the room channel works. */ };
            ws.onmessage = event => {
                if (stopped || current !== generation) return;
                let data: any;
                try { data = JSON.parse(String(event.data)); } catch { fail('REALTIME_UNAVAILABLE', current); return; }
                if (data.type === 'error') { deps.rejected(data.code); if (terminal.has(data.code)) fail(data.code, current); return; }
                if (data.type !== 'state' || !Array.isArray(data.players) || !Number.isFinite(data.serverTime)) return;
                clearTimeout(deadline);
                deadline = setTimeout(() => fail('REALTIME_UNAVAILABLE', current), timing.stale);
                if (!live) {
                    live = true; attempts = 0; deps.status(true, '');
                    heartbeat = setInterval(() => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'ping' })); }, timing.heartbeat);
                }
                deps.state(data, 'live');
            };
            ws.onclose = ws.onerror = () => fail('REALTIME_UNAVAILABLE', current);
        } catch (error: any) { fail(error.message || 'SERVER_UNAVAILABLE', current); }
    };
    return {
        start: connect,
        retry: () => { attempts = 0; void connect(); },
        stop: () => { stopped = true; generation++; clear(); },
        send: (type: string, extra: any = {}) => {
            if (!live || socket?.readyState !== 1) return false;
            try { socket.send(JSON.stringify({ type, ...extra })); return true; }
            catch { fail('REALTIME_UNAVAILABLE', generation); return false; }
        }
    };
}
