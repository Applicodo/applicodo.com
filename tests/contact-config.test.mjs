import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/contact-config.js";

const env = { CONTACT_ENVIRONMENT: "production", CONTACT_DELIVERY_ENABLED: "true", TURNSTILE_SITE_KEY: "public-site-key", TURNSTILE_SECRET_KEY: "private-turnstile", RESEND_API_KEY: "private-resend" };

test("config returns only the public widget key for a fully configured production host", async () => {
  const response = onRequest({ request: new Request("https://applicodo.com/api/contact-config"), env });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { siteKey: "public-site-key", deliveryEnabled: true, preview: false });
});

test("direct Pages and preview configuration cannot activate delivery or expose keys", async () => {
  for (const [url, settings] of [
    ["https://branch.applicodo.pages.dev/api/contact-config", env],
    ["https://applicodo.com/api/contact-config", { ...env, CONTACT_ENVIRONMENT: "preview" }],
    ["https://applicodo.com/api/contact-config", { ...env, CONTACT_DELIVERY_ENABLED: "false" }],
  ]) {
    const data = await onRequest({ request: new Request(url), env: settings }).json();
    assert.equal(data.siteKey, "");
    assert.equal(data.deliveryEnabled, false);
    assert.equal(data.preview, true);
  }
});

test("missing credentials fail closed and unsupported methods return 405", async () => {
  const data = await onRequest({ request: new Request("https://applicodo.com/api/contact-config"), env: { ...env, RESEND_API_KEY: "" } }).json();
  assert.equal(data.deliveryEnabled, false);
  assert.equal(data.preview, false);
  const response = onRequest({ request: new Request("https://applicodo.com/api/contact-config", { method: "POST" }), env });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
