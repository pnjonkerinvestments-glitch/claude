import { configFromEnv, type Config } from "../src/config.ts";
import type { Mover } from "../src/models.ts";
import type { Connect, SmtpSocket } from "../src/smtp.ts";
import type { KvLike } from "../src/state.ts";

export function mover(overrides: Partial<Mover> = {}): Mover {
  return {
    symbol: "ABCD",
    exchange: "NASDAQ",
    name: "Testbedrijf",
    price: 6.0,
    prevClose: 3.0,
    changePct: 100.0,
    volume: 500_000,
    marketCap: 120_000_000,
    instrumentType: "stock",
    ...overrides,
  };
}

export const MAIL_ENV = {
  SMTP_HOST: "smtp.example.com",
  SMTP_USER: "ik@example.com",
  SMTP_PASSWORD: "geheim",
  MAIL_TO: "ik@example.com",
};

export function config(overrides: Partial<Config> = {}): Config {
  return { ...configFromEnv(MAIL_ENV), ...overrides };
}

export class MemoryKv implements KvLike {
  data = new Map<string, string>();
  puts: { key: string; ttl?: number }[] = [];
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    this.data.set(key, value);
    this.puts.push({ key, ttl: options?.expirationTtl });
  }
}

/**
 * Een nep-SMTP-server die in het geheugen draait. Hij speelt een Gmail-achtige
 * dialoog na en onthoudt wat de client stuurde, inclusief of STARTTLS werd gebruikt.
 */
export class FakeSmtp {
  received: string[] = [];
  data = "";
  tls = false;
  connections: { hostname: string; port: number; secureTransport: string }[] = [];
  authMechanisms = "PLAIN LOGIN";
  /** Laat een commando dat met `prefix` begint mislukken met `reply`. */
  failOn: { prefix: string; reply: string } | null = null;

  private inData = false;
  private loginStep = 0;

  connect: Connect = (address, options) => {
    this.connections.push({ ...address, secureTransport: options.secureTransport });
    this.tls = options.secureTransport === "on";
    return this.socket(true);
  };

  private socket(greet: boolean): SmtpSocket {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const readable = new ReadableStream<Uint8Array>({ start: (c) => void (controller = c) });
    const send = (text: string) => controller.enqueue(encoder.encode(text + "\r\n"));
    let buffer = "";

    const writable = new WritableStream<Uint8Array>({
      write: (chunk) => {
        buffer += decoder.decode(chunk);
        let end: number;
        while ((end = buffer.indexOf("\r\n")) >= 0) {
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const reply = this.handle(line);
          if (reply) send(reply);
        }
      },
    });

    if (greet) send("220 smtp.example.com ESMTP ready");
    return {
      readable,
      writable,
      startTls: () => {
        this.tls = true;
        return this.socket(false);
      },
      close: async () => {},
    };
  }

  private handle(line: string): string | null {
    if (this.inData) {
      if (line !== ".") {
        this.data += line + "\r\n";
        return null;
      }
      this.inData = false;
      return "250 2.0.0 OK queued";
    }
    this.received.push(line);
    if (this.failOn && line.startsWith(this.failOn.prefix)) return this.failOn.reply;
    if (this.loginStep > 0) return this.loginStep++ === 1 ? "334 UGFzc3dvcmQ6" : ((this.loginStep = 0), "235 2.7.0 Accepted");

    const verb = line.split(" ")[0]!.toUpperCase();
    switch (verb) {
      case "EHLO": {
        const ext = this.tls ? [`AUTH ${this.authMechanisms}`] : ["STARTTLS"];
        return ["250-smtp.example.com", ...ext.map((e) => `250-${e}`), "250 8BITMIME"].join("\r\n");
      }
      case "STARTTLS":
        return "220 2.0.0 Ready to start TLS";
      case "AUTH":
        if (line.toUpperCase() === "AUTH LOGIN") {
          this.loginStep = 1;
          return "334 VXNlcm5hbWU6";
        }
        return "235 2.7.0 Accepted";
      case "DATA":
        this.inData = true;
        return "354 Go ahead";
      case "QUIT":
        return "221 2.0.0 Bye";
      default:
        return "250 2.1.0 OK";
    }
  }
}
