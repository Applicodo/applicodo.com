const MAX_BODY_BYTES = 32 * 1024;
const MAX_UPSTREAM_BYTES = 16 * 1024;
const PRODUCTION_ORIGIN = "https://applicodo.com";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_URL = "https://api.resend.com/emails";
const FIELD_NAMES = ["name", "email", "message", "turnstileToken"];
const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f-\u009f]/;
const MESSAGE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;

class BodyError extends Error {
  constructor(status) {
    super("Invalid request body");
    this.status = status;
  }
}

function jsonResponse(status, code, error) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "Strict-Transport-Security": "max-age=31536000",
  });
  if (status === 405) headers.set("Allow", "POST");
  const body = status === 200 ? { ok: true } : { ok: false, code, error };
  return new Response(JSON.stringify(body), { status, headers });
}

// Count bytes while reading: Content-Length alone is attacker-controlled.
async function readBoundedJson(body, maxBytes) {
  if (!body) throw new BodyError(400);
  const reader = body.getReader();
  const chunks = [];
  let size = 0;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new BodyError(413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new BodyError(400);
  }
}

function validEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label),
  );
}

function validatedFields(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const keys = Object.keys(input);
  if (keys.length !== FIELD_NAMES.length || keys.some((key) => !FIELD_NAMES.includes(key))) return null;
  if (FIELD_NAMES.some((key) => typeof input[key] !== "string")) return null;

  const { name, email, message, turnstileToken } = input;
  if (!name.trim() || name.length > 100 || SINGLE_LINE_CONTROLS.test(name)) return null;
  if (!email.trim() || email.length > 254 || SINGLE_LINE_CONTROLS.test(email)) return null;
  if (!validEmail(email.trim())) return null;
  if (!message.trim() || message.length > 5000 || MESSAGE_CONTROLS.test(message)) return null;
  if (!turnstileToken || turnstileToken.length > 2048 || /\s/.test(turnstileToken)) return null;

  return {
    name: name.trim(),
    email: email.trim(),
    message: message.replace(/\r\n?/g, "\n").trim(),
    turnstileToken,
  };
}

// The timeout covers the response body as well as the initial connection.
async function upstreamJson(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Upstream timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      (async () => {
        // Workers supports manual redirects; callers reject non-2xx responses.
        const response = await fetchImpl(url, { ...init, signal: controller.signal, redirect: "manual" });
        return { ok: response.ok, data: await readBoundedJson(response.body, MAX_UPSTREAM_BYTES) };
      })(),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function handleContact(request, env, { fetch: fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  if (request.method !== "POST") {
    return jsonResponse(405, "method_not_allowed", "Submit the contact form using POST.");
  }

  const url = new URL(request.url);
  if (url.origin !== PRODUCTION_ORIGIN || request.headers.get("Origin") !== PRODUCTION_ORIGIN) {
    return jsonResponse(403, "origin_rejected", "Please send your message from applicodo.com.");
  }

  // Both values are configured only in the production Pages environment.
  if (env.CONTACT_DELIVERY_ENABLED !== "true" || env.CONTACT_ENVIRONMENT !== "production") {
    return jsonResponse(503, "delivery_disabled", "The contact form is unavailable in this preview.");
  }
  if (typeof env.TURNSTILE_SECRET_KEY !== "string" || !env.TURNSTILE_SECRET_KEY.trim()
    || typeof env.RESEND_API_KEY !== "string" || !env.RESEND_API_KEY.trim()) {
    return jsonResponse(503, "delivery_unavailable", "The contact form is temporarily unavailable. Please try again later.");
  }

  if (!/^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?$/i.test(request.headers.get("Content-Type") || "")
    || ![null, "identity"].includes(request.headers.get("Content-Encoding"))) {
    return jsonResponse(415, "unsupported_content_type", "Please submit the website contact form.");
  }
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength !== null && !/^\d+$/.test(declaredLength)) {
    return jsonResponse(400, "invalid_request", "The form could not be read. Please try again.");
  }
  if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) {
    return jsonResponse(413, "request_too_large", "Your message is too large. Please shorten it and try again.");
  }

  let input;
  try {
    input = await readBoundedJson(request.body, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof BodyError && error.status === 413) {
      return jsonResponse(413, "request_too_large", "Your message is too large. Please shorten it and try again.");
    }
    return jsonResponse(400, "invalid_request", "The form could not be read. Please try again.");
  }
  const fields = validatedFields(input);
  if (!fields) {
    return jsonResponse(400, "invalid_fields", "Check your name, email address, and message, then complete verification again.");
  }

  let verification;
  try {
    verification = await upstreamJson(fetchImpl, SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: fields.turnstileToken }).toString(),
    }, timeoutMs);
  } catch {
    return jsonResponse(503, "verification_unavailable", "Verification is temporarily unavailable. Please try again shortly.");
  }
  if (!verification.ok) {
    return jsonResponse(503, "verification_unavailable", "Verification is temporarily unavailable. Please try again shortly.");
  }
  if (verification.data?.success !== true || verification.data.hostname !== "applicodo.com"
    || verification.data.action !== "contact") {
    return jsonResponse(403, "verification_failed", "Please complete the verification again before sending.");
  }

  try {
    const delivery = await upstreamJson(fetchImpl, RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Applicodo website <website@forms.applicodo.com>",
        to: ["contact@applicodo.com"],
        reply_to: fields.email,
        subject: "New Applicodo website enquiry",
        text: `Name: ${fields.name}\nReply email: ${fields.email}\n\n${fields.message}`,
      }),
    }, timeoutMs);
    if (!delivery.ok || typeof delivery.data?.id !== "string" || !delivery.data.id.trim()) {
      throw new Error("Delivery not accepted");
    }
  } catch {
    return jsonResponse(503, "delivery_failed", "Your message could not be sent. Please try again shortly.");
  }

  return jsonResponse(200);
}

export function onRequest({ request, env }) {
  return handleContact(request, env);
}
