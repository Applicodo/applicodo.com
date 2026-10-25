import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

// Exercise the workerd runtime bundled with the pinned deployment tooling,
// including Request construction that a Node-only fetch mock would miss.
const require = createRequire(import.meta.url);
const { Miniflare, Log, LogLevel, convertV4MiniflareOptions } = createRequire(require.resolve("wrangler/package.json"))("miniflare");
const siteverify = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const resend = "https://api.resend.com/emails";
const verification = { success: true, hostname: "applicodo.com", action: "contact" };
const fields = {
  name: "Runtime verification",
  email: "runtime@example.com",
  message: "Controlled runtime fixture; never delivered externally.",
  turnstileToken: "fake-runtime-token",
};

test("workerd confines contact delivery to the canonical path and rejects provider redirects", { timeout: 20000 }, async (t) => {
  const scratch = await mkdtemp(join(tmpdir(), "applicodo-contact-runtime-"));
  const calls = [];
  let scenario = "success";
  let worker;
  try {
    worker = new Miniflare(convertV4MiniflareOptions({
      modules: [
        {
          type: "ESModule",
          path: "entry.mjs",
          contents: 'import { handleContact } from "./contact.mjs"; export default { fetch: handleContact };',
        },
        {
          type: "ESModule",
          path: "contact.mjs",
          contents: await readFile(new URL("../functions/api/contact.js", import.meta.url), "utf8"),
        },
      ],
      compatibilityDate: "2026-10-25",
      bindings: {
        CONTACT_DELIVERY_ENABLED: "true",
        CONTACT_ENVIRONMENT: "production",
        TURNSTILE_SECRET_KEY: "fake-turnstile-runtime-secret",
        RESEND_API_KEY: "fake-resend-runtime-secret",
      },
      cf: false,
      telemetry: { enabled: false },
      resourcePersistencePath: scratch,
      resourceTmpPath: join(scratch, "tmp"),
      log: new Log(LogLevel.NONE),
      // Every outbound request is intercepted. Even an unexpected redirect
      // target cannot reach the Internet or receive any real credentials.
      outboundService: async (request) => {
        calls.push({ url: request.url, authorization: request.headers.get("Authorization") });
        if (request.url === siteverify) {
          if (scenario === "verification-redirect") {
            return Response.json(verification, { status: 302, headers: { Location: "https://unexpected.invalid/verification" } });
          }
          return Response.json(scenario === "invalid-token" ? { success: false, "error-codes": ["invalid-input-response"] } : verification);
        }
        if (request.url === resend) {
          return Response.json({ id: "fake-accepted-id" }, scenario === "delivery-redirect"
            ? { status: 302, headers: { Location: "https://unexpected.invalid/delivery" } }
            : undefined);
        }
        return new Response("Unexpected provider destination", { status: 502 });
      },
    }));

    for (const [name, status, code, destinations, path = "/api/contact"] of [
      ["success", 200, undefined, [siteverify, resend]],
      ["verification-redirect", 503, "verification_unavailable", [siteverify]],
      ["delivery-redirect", 503, "delivery_failed", [siteverify, resend]],
      ["invalid-token", 403, "verification_failed", [siteverify]],
      ["trailing-slash", 404, "not_found", [], "/api/contact/"],
    ]) {
      await t.test(name, async () => {
        scenario = name;
        calls.length = 0;
        const response = await worker.dispatchFetch(`https://applicodo.com${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "https://applicodo.com" },
          body: JSON.stringify(fields),
        });
        const result = await response.json();
        assert.equal(response.status, status);
        assert.equal(result.ok, status === 200);
        assert.equal(result.code, code);
        assert.deepEqual(calls.map(({ url }) => url), destinations);
        if (calls.length > 0) assert.equal(calls[0].authorization, null);
        if (calls.length === 2) assert.equal(calls[1].authorization, "Bearer fake-resend-runtime-secret");
      });
    }
  } finally {
    await worker?.dispose();
    await rm(scratch, { recursive: true, force: true });
  }
});
