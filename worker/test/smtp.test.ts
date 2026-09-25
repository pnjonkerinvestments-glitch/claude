import assert from "node:assert/strict";
import { test } from "node:test";
import { dotStuff, sendMail, SmtpError } from "../src/smtp.ts";
import { FakeSmtp } from "./helpers.ts";

const opts = {
  host: "smtp.example.com",
  port: 587,
  user: "ik@example.com",
  password: "geheim",
  from: "ik@example.com",
  to: ["a@example.com", "b@example.com"],
  data: "Subject: hoi\r\n\r\nregel\r\n.begint met punt\r\n",
};

test("587: STARTTLS, AUTH PLAIN, alle ontvangers, bericht met dot-stuffing", async () => {
  const server = new FakeSmtp();
  await sendMail(server.connect, opts);
  assert.deepEqual(server.connections, [{ hostname: "smtp.example.com", port: 587, secureTransport: "starttls" }]);
  assert.deepEqual(server.received, [
    "EHLO roviko.workers.dev",
    "STARTTLS",
    "EHLO roviko.workers.dev",
    `AUTH PLAIN ${btoa("\0ik@example.com\0geheim")}`,
    "MAIL FROM:<ik@example.com>",
    "RCPT TO:<a@example.com>",
    "RCPT TO:<b@example.com>",
    "DATA",
    "QUIT",
  ]);
  assert.equal(server.data, "Subject: hoi\r\n\r\nregel\r\n..begint met punt\r\n");
});

test("465: meteen TLS, geen STARTTLS", async () => {
  const server = new FakeSmtp();
  await sendMail(server.connect, { ...opts, port: 465 });
  assert.equal(server.connections[0]!.secureTransport, "on");
  assert.ok(!server.received.includes("STARTTLS"));
});

test("AUTH LOGIN als PLAIN niet aangeboden wordt", async () => {
  const server = new FakeSmtp();
  server.authMechanisms = "LOGIN XOAUTH2";
  await sendMail(server.connect, opts);
  assert.deepEqual(server.received.slice(3, 6), ["AUTH LOGIN", btoa("ik@example.com"), btoa("geheim")]);
});

test("afgewezen login geeft een duidelijke fout zonder wachtwoord", async () => {
  const server = new FakeSmtp();
  server.failOn = { prefix: "AUTH", reply: "535 5.7.8 Username and Password not accepted" };
  await assert.rejects(sendMail(server.connect, opts), (err: Error) => {
    assert.ok(err instanceof SmtpError);
    assert.match(err.message, /535/);
    assert.ok(!err.message.includes(btoa("\0ik@example.com\0geheim")));
    return true;
  });
});

test("zwijgende server loopt tegen de timeout aan", async () => {
  const silent = () => ({
    readable: new ReadableStream<Uint8Array>(),
    writable: new WritableStream<Uint8Array>(),
    startTls: () => {
      throw new Error("niet verwacht");
    },
    close: async () => {},
  });
  await assert.rejects(sendMail(silent, { ...opts, timeoutMs: 50 }), /reageerde niet/);
});

test("dotStuff normaliseert regeleinden en sluit af", () => {
  assert.equal(dotStuff("a\n.b"), "a\r\n..b\r\n.\r\n");
});
