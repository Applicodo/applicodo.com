import test from "node:test";
import assert from "node:assert/strict";
import { handleContact, onRequest } from "../functions/api/contact.js";

const env = {
  CONTACT_DELIVERY_ENABLED: "true",
  CONTACT_ENVIRONMENT: "production",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  RESEND_API_KEY: "test-resend-secret",
};
const fields = {
  name: "Ana Popescu",
  email: "ana@example.com",
  message: "I'd like to discuss an iOS application. Mulțumesc! 日本語も使えます。",
  turnstileToken: "test-challenge-token",
};
const challenge = { success: true, hostname: "applicodo.com", action: "contact" };

function request(input = fields, options = {}) {
  return new Request(options.url || "https://applicodo.com/api/contact", {
    method: options.method || "POST",
    headers: { "Content-Type": "application/json", Origin: "https://applicodo.com", ...options.headers },
    ...((options.method || "POST") === "POST" ? { body: options.body ?? JSON.stringify(input) } : {}),
    ...(options.body instanceof ReadableStream ? { duplex: "half" } : {}),
  });
}

function upstream({ verification = challenge, verificationStatus = 200, delivery = { id: "email-test-id" }, deliveryStatus = 200 } = {}) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
      return Response.json(verification, { status: verificationStatus });
    }
    assert.equal(url, "https://api.resend.com/emails");
    return Response.json(delivery, { status: deliveryStatus });
  };
  return { fetch, calls };
}

async function rejected(req, status, options = {}, runtimeEnv = env) {
  const mock = upstream(options);
  const response = await handleContact(req, runtimeEnv, mock);
  assert.equal(response.status, status);
  assert.equal((await response.json()).ok, false);
  return mock;
}

test("a verified multilingual enquiry is delivered to the fixed inbox as plain text", async () => {
  const mock = upstream();
  const response = await handleContact(request(), env, mock);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(mock.calls.length, 2);
  const verification = new URLSearchParams(mock.calls[0].init.body);
  assert.equal(verification.get("secret"), env.TURNSTILE_SECRET_KEY);
  assert.equal(verification.get("response"), fields.turnstileToken);
  const mail = JSON.parse(mock.calls[1].init.body);
  assert.deepEqual(mail.to, ["contact@applicodo.com"]);
  assert.equal(mail.from, "Applicodo website <website@forms.applicodo.com>");
  assert.equal(mail.reply_to, fields.email);
  assert.equal(mail.subject, "New Applicodo website enquiry");
  assert.ok(mail.text.includes(fields.message));
  assert.equal("html" in mail, false);
  assert.equal("cc" in mail, false);
  assert.equal("bcc" in mail, false);
  assert.equal(mock.calls[1].init.headers.Authorization, `Bearer ${env.RESEND_API_KEY}`);
  assert.equal(mock.calls[0].init.redirect, "manual");
  assert.equal(mock.calls[1].init.redirect, "manual");
});

test("HTML and script-looking text stays inert in the email body and is never echoed", async () => {
  const input = { ...fields, name: "<b>Ana</b>", message: '<script>alert("test")</script>\n<img src=x onerror=alert(1)>' };
  const mock = upstream();
  const response = await handleContact(request(input), env, mock);
  assert.equal(response.status, 200);
  const result = await response.text();
  assert.equal(result.includes(input.name), false);
  assert.equal(result.includes(input.message), false);
  const mail = JSON.parse(mock.calls[1].init.body);
  assert.ok(mail.text.includes(input.message));
  assert.equal("html" in mail, false);
});

test("all responses contain security headers and no permissive CORS", async () => {
  const cases = [
    [request(), env, upstream()],
    [request(fields, { method: "GET" }), env, upstream()],
    [request(fields, { headers: { Origin: "https://attacker.example" } }), env, upstream()],
    [request(), { ...env, CONTACT_DELIVERY_ENABLED: "false" }, upstream()],
    [request({ ...fields, email: "invalid" }), env, upstream()],
  ];
  for (const [req, runtimeEnv, mock] of cases) {
    const response = await handleContact(req, runtimeEnv, mock);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
    assert.ok(response.headers.get("Content-Security-Policy").includes("frame-ancestors 'none'"));
  }
});

test("non-POST methods are rejected without contacting providers", async () => {
  for (const method of ["GET", "PUT", "DELETE", "OPTIONS", "HEAD"]) {
    const mock = upstream();
    const response = await handleContact(request(fields, { method }), env, mock);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "POST");
    assert.equal(mock.calls.length, 0);
  }
});

test("cross-origin, missing-origin, insecure, alternate-host and direct Pages requests cannot send", async () => {
  for (const options of [
    { headers: { Origin: "https://attacker.example" } },
    { headers: { Origin: "null" } },
    { headers: { Origin: "https://www.applicodo.com" } },
    { url: "http://applicodo.com/api/contact" },
    { url: "https://www.applicodo.com/api/contact" },
    { url: "https://applicodo.pages.dev/api/contact" },
    { url: "https://branch.applicodo.pages.dev/api/contact" },
    { url: "https://applicodo.com:444/api/contact" },
  ]) {
    assert.equal((await rejected(request(fields, options), 403)).calls.length, 0);
  }
  const req = request();
  req.headers.delete("Origin");
  assert.equal((await rejected(req, 403)).calls.length, 0);
});

test("delivery is disabled unless both production guards and all server secrets exist", async () => {
  for (const overrides of [
    { CONTACT_DELIVERY_ENABLED: "false" },
    { CONTACT_DELIVERY_ENABLED: undefined },
    { CONTACT_DELIVERY_ENABLED: "TRUE" },
    { CONTACT_ENVIRONMENT: "preview" },
    { CONTACT_ENVIRONMENT: undefined },
    { TURNSTILE_SECRET_KEY: "" },
    { RESEND_API_KEY: undefined },
  ]) {
    assert.equal((await rejected(request(), 503, {}, { ...env, ...overrides })).calls.length, 0);
  }
});

test("unknown or missing fields cannot redirect mail or override its headers", async () => {
  for (const extra of ["to", "cc", "bcc", "from", "reply_to", "subject", "html", "__proto__"]) {
    const input = { ...fields, [extra]: "attacker@example.com" };
    assert.equal((await rejected(request(input), 400)).calls.length, 0);
  }
  for (const key of Object.keys(fields)) {
    const input = { ...fields };
    delete input[key];
    assert.equal((await rejected(request(input), 400)).calls.length, 0);
  }
});

test("field validation rejects missing content, non-strings, header injection and invalid addresses", async () => {
  const inputs = [null, [], "string", 42,
    { ...fields, name: " " },
    { ...fields, name: "A".repeat(101) },
    { ...fields, name: "Ana\r\nBcc: attacker@example.com" },
    { ...fields, email: "ana@example.com\r\nBcc: attacker@example.com" },
    { ...fields, email: "\nana@example.com" },
    { ...fields, email: "a".repeat(255) },
    { ...fields, email: "not-an-email" },
    { ...fields, email: "Ana <ana@example.com>" },
    { ...fields, email: "a@example.com,b@example.com" },
    { ...fields, email: "a..b@example.com" },
    { ...fields, email: ".ana@example.com" },
    { ...fields, email: "ana@-example.com" },
    { ...fields, email: "ana@example" },
    { ...fields, message: "   " },
    { ...fields, message: "m".repeat(5001) },
    { ...fields, message: "Hello\u0000world" },
    { ...fields, turnstileToken: "" },
    { ...fields, turnstileToken: "t".repeat(2049) },
    { ...fields, turnstileToken: "token with spaces" },
  ];
  for (const key of Object.keys(fields)) inputs.push({ ...fields, [key]: { value: "object" } });
  for (const input of inputs) {
    assert.equal((await rejected(request(input), 400)).calls.length, 0);
  }
});

test("boundary field sizes and Unicode messages are accepted", async () => {
  const local = "l".repeat(64);
  const domain = ["d".repeat(63), "e".repeat(63), "f".repeat(61)].join(".");
  const email = `${local}@${domain}`;
  assert.equal(email.length, 254);
  const mock = upstream();
  const response = await handleContact(request({
    name: "N".repeat(100), email, message: "é".repeat(5000), turnstileToken: "t".repeat(2048),
  }), env, mock);
  assert.equal(response.status, 200);
});

test("malformed JSON, invalid UTF-8, wrong content types and compression fail before verification", async () => {
  for (const body of ["{", "", new Uint8Array([0xc3, 0x28])]) {
    assert.equal((await rejected(request(fields, { body }), 400)).calls.length, 0);
  }
  for (const headers of [
    { "Content-Type": "text/plain" },
    { "Content-Type": "application/x-www-form-urlencoded" },
    { "Content-Type": "application/json; charset=iso-8859-1" },
    { "Content-Encoding": "gzip" },
  ]) {
    assert.equal((await rejected(request(fields, { headers }), 415)).calls.length, 0);
  }
  const mock = upstream();
  assert.equal((await handleContact(request(fields, { headers: { "Content-Type": "application/json; charset=utf-8" } }), env, mock)).status, 200);
});

test("body size enforcement handles declared, absent, and lying Content-Length", async () => {
  assert.equal((await rejected(request(fields, { headers: { "Content-Length": "32769" } }), 413)).calls.length, 0);
  assert.equal((await rejected(request(fields, { headers: { "Content-Length": "invalid" } }), 400)).calls.length, 0);
  const oversized = JSON.stringify({ ...fields, message: "m".repeat(33000) });
  for (const headers of [{}, { "Content-Length": "100" }]) {
    assert.equal((await rejected(request(fields, { headers, body: oversized }), 413)).calls.length, 0);
  }
});

test("an oversized chunked stream is cancelled without reading the remainder", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(20_000));
      controller.enqueue(new Uint8Array(20_000));
    },
    cancel() { cancelled = true; },
  });
  const mock = await rejected(request(fields, { body }), 413);
  assert.equal(mock.calls.length, 0);
  assert.equal(cancelled, true);
});

test("expired, replayed, forged, wrong-host and wrong-action challenges cannot send", async () => {
  for (const verification of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: false, "error-codes": ["invalid-input-response"] },
    { ...challenge, success: "true" },
    { ...challenge, hostname: "attacker.example" },
    { ...challenge, hostname: "applicodo.pages.dev" },
    { ...challenge, action: "login" },
    { success: true }, null,
  ]) {
    assert.equal((await rejected(request(), 403, { verification })).calls.length, 1);
  }
});

test("a replay rejected by Siteverify cannot cause a second delivery", async () => {
  let validations = 0;
  let deliveries = 0;
  const fetch = async (url) => {
    if (url.includes("siteverify")) {
      validations += 1;
      return Response.json(validations === 1 ? challenge : { success: false, "error-codes": ["timeout-or-duplicate"] });
    }
    deliveries += 1;
    return Response.json({ id: "once" });
  };
  assert.equal((await handleContact(request(), env, { fetch })).status, 200);
  assert.equal((await handleContact(request(), env, { fetch })).status, 403);
  assert.equal(deliveries, 1);
});

test("verification outages, malformed responses, redirects and oversized upstream data fail closed", async () => {
  const invalidFetches = [
    async () => { throw new Error("network problem"); },
    async () => new Response("not json"),
    async () => new Response("x".repeat(17000)),
    async () => Response.json(challenge, { status: 500 }),
    async () => new Response(null, { status: 302, headers: { Location: "https://attacker.example" } }),
  ];
  for (const fetch of invalidFetches) {
    const response = await handleContact(request(), env, { fetch });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "verification_unavailable");
  }
});

test("upstream deadlines fail closed even if an upstream never resolves", async () => {
  let signal;
  const fetch = (_url, init) => {
    signal = init.signal;
    return new Promise(() => {});
  };
  const response = await handleContact(request(), env, { fetch, timeoutMs: 5 });
  assert.equal(response.status, 503);
  assert.equal(signal.aborted, true);
});

test("provider failures, rate limits and malformed acceptance never report success", async () => {
  for (const options of [
    { deliveryStatus: 400, delivery: { error: "invalid" } },
    { deliveryStatus: 429, delivery: { error: "rate limit" } },
    { deliveryStatus: 500, delivery: { error: "unavailable" } },
    { delivery: { id: "" } }, { delivery: { id: 123 } }, { delivery: {} },
  ]) {
    const mock = await rejected(request(), 503, options);
    assert.equal(mock.calls.length, 2);
  }
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    if (calls === 1) return Response.json(challenge);
    throw new Error("private provider diagnostics must not leak");
  };
  const response = await handleContact(request(), env, { fetch });
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes("private provider"), false);
});

test("the Pages entrypoint applies the same fail-closed guard", async () => {
  const response = await onRequest({ request: request(), env: {} });
  assert.equal(response.status, 503);
});
