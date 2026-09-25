/**
 * Minimale SMTP-client bovenop Cloudflare TCP-sockets (`cloudflare:sockets`).
 *
 * Poort 587 gebruikt STARTTLS, poort 465 meteen TLS. Poort 25 blokkeert Cloudflare.
 * De socket-fabriek wordt meegegeven, zodat dit bestand ook buiten een Worker te testen is.
 */

export interface SmtpSocket {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  startTls(): SmtpSocket;
  close(): Promise<void>;
}

export type Connect = (
  address: { hostname: string; port: number },
  options: { secureTransport: "on" | "starttls"; allowHalfOpen: boolean },
) => SmtpSocket;

export interface SmtpOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  to: string[];
  /** Het complete bericht (headers + body) met CRLF-regeleinden. */
  data: string;
  timeoutMs?: number;
  /** Naam in EHLO. */
  clientName?: string;
}

export class SmtpError extends Error {
  override name = "SmtpError";
}

interface Reply {
  code: number;
  lines: string[];
}

class Connection {
  private socket: SmtpSocket;
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private buffer = "";
  private readonly decoder = new TextDecoder();
  private readonly encoder = new TextEncoder();

  constructor(socket: SmtpSocket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  private async readLine(): Promise<string> {
    for (;;) {
      const end = this.buffer.indexOf("\r\n");
      if (end >= 0) {
        const line = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 2);
        return line;
      }
      const { value, done } = await this.reader.read();
      if (done) throw new SmtpError("Verbinding met de SMTP-server onverwacht gesloten");
      this.buffer += this.decoder.decode(value, { stream: true });
    }
  }

  async read(): Promise<Reply> {
    const lines: string[] = [];
    for (;;) {
      const line = await this.readLine();
      if (!/^\d{3}[ -]/.test(line) && !/^\d{3}$/.test(line)) throw new SmtpError(`Onverwacht antwoord: ${line}`);
      lines.push(line.slice(4));
      if (line[3] !== "-") return { code: Number(line.slice(0, 3)), lines };
    }
  }

  async write(text: string): Promise<void> {
    await this.writer.write(this.encoder.encode(text));
  }

  /** Stuur een commando en eis een bepaalde antwoordcode. */
  async command(line: string, expect: number, shown = line): Promise<Reply> {
    await this.write(`${line}\r\n`);
    return this.expect(expect, shown);
  }

  async expect(code: number, context: string): Promise<Reply> {
    const reply = await this.read();
    if (reply.code !== code) {
      throw new SmtpError(`${context} -> ${reply.code} ${reply.lines.join(" ")}`);
    }
    return reply;
  }

  upgrade(): void {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket = this.socket.startTls();
    this.reader = this.socket.readable.getReader();
    this.writer = this.socket.writable.getWriter();
    this.buffer = "";
  }

  async close(): Promise<void> {
    try {
      await this.socket.close();
    } catch {
      // al dicht
    }
  }
}

const b64 = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));

/** Regels die met een punt beginnen verdubbelen (RFC 5321 §4.5.2) en afsluiten met <CRLF>.<CRLF>. */
export function dotStuff(data: string): string {
  const body = data.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
  return `${body}${body.endsWith("\r\n") ? "" : "\r\n"}.\r\n`;
}

async function converse(conn: Connection, opts: SmtpOptions, implicitTls: boolean): Promise<void> {
  const helo = `EHLO ${opts.clientName ?? "roviko.workers.dev"}`;
  await conn.expect(220, "Begroeting");
  let ehlo = await conn.command(helo, 250);

  if (!implicitTls) {
    await conn.command("STARTTLS", 220);
    conn.upgrade();
    ehlo = await conn.command(helo, 250);
  }

  const authLine = ehlo.lines.find((l) => /^AUTH[ =]/i.test(l)) ?? "";
  if (/\bPLAIN\b/i.test(authLine) || !/\bLOGIN\b/i.test(authLine)) {
    await conn.command(`AUTH PLAIN ${b64(`\0${opts.user}\0${opts.password}`)}`, 235, "AUTH PLAIN ***");
  } else {
    await conn.command("AUTH LOGIN", 334);
    await conn.command(b64(opts.user), 334, "AUTH LOGIN <gebruiker>");
    await conn.command(b64(opts.password), 235, "AUTH LOGIN <wachtwoord>");
  }

  await conn.command(`MAIL FROM:<${opts.from}>`, 250);
  for (const rcpt of opts.to) await conn.command(`RCPT TO:<${rcpt}>`, 250);
  await conn.command("DATA", 354);
  await conn.write(dotStuff(opts.data));
  await conn.expect(250, "Bericht versturen");
  await conn.write("QUIT\r\n");
}

export async function sendMail(connect: Connect, opts: SmtpOptions): Promise<void> {
  const implicitTls = opts.port === 465;
  const socket = connect(
    { hostname: opts.host, port: opts.port },
    { secureTransport: implicitTls ? "on" : "starttls", allowHalfOpen: false },
  );
  const conn = new Connection(socket);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new SmtpError(`SMTP-server reageerde niet binnen ${(opts.timeoutMs ?? 30_000) / 1000}s`)),
      opts.timeoutMs ?? 30_000,
    );
  });
  try {
    await Promise.race([converse(conn, opts, implicitTls), timeout]);
  } finally {
    clearTimeout(timer);
    await conn.close();
  }
}
