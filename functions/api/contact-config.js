// Only the public widget key is exposed. Provider secrets never leave the server.
export function onRequest({ request, env }) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...headers, Allow: "GET" },
    });
  }
  const production = new URL(request.url).origin === "https://applicodo.com"
    && env.CONTACT_ENVIRONMENT === "production"
    && env.CONTACT_DELIVERY_ENABLED === "true";
  const configured = [env.TURNSTILE_SITE_KEY, env.TURNSTILE_SECRET_KEY, env.RESEND_API_KEY]
    .every((value) => typeof value === "string" && value.trim().length > 0);
  const deliveryEnabled = production && configured;
  return new Response(JSON.stringify({
    siteKey: deliveryEnabled ? env.TURNSTILE_SITE_KEY : "",
    deliveryEnabled,
    preview: !production,
  }), { headers });
}
