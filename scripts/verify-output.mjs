import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve("public");
const allowed = new Set([
  "index.html", "404.html", "robots.txt", "sitemap.xml", "_headers", "_routes.json",
  "assets/site.css", "assets/contact.js", "assets/favicon.svg", "assets/captionfast-icon.png",
  "assets/plates/app-export.png", "assets/plates/app-language.png",
  "assets/fonts/manrope-variable.ttf", "assets/fonts/OFL.txt",
]);
const files = [];
async function walk(directory) {
  for (const name of await readdir(directory)) {
    const full = path.join(directory, name);
    const stat = await lstat(full);
    assert(!stat.isSymbolicLink(), "Public output must not contain symbolic links");
    if (stat.isDirectory()) await walk(full);
    else files.push({ name: path.relative(root, full).split(path.sep).join("/"), size: stat.size });
  }
}
await walk(root);
for (const file of files) assert(allowed.has(file.name), `Unexpected public output: ${file.name}`);
for (const name of allowed) assert(files.some(file => file.name === name), `Missing public output: ${name}`);
assert(files.reduce((sum, file) => sum + file.size, 0) < 1024 * 1024, "Public output exceeds 1 MiB budget");

for (const file of files.filter(file => /\.(html|js|css|svg|xml|txt)$/.test(file.name) || file.name === "_headers")) {
  const text = await readFile(path.join(root, file.name), "utf8");
  assert(!/OFFLINEZIP|wp-content|wp-admin|jquery|bootstrap|mailto:|tel:|Google Maps|Iasi|Iași|streetAddress|postalAddress|MODAL_API_SECRET|TURNSTILE_SECRET_KEY|RESEND_API_KEY|re_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY/i.test(text), `Forbidden legacy/private content: ${file.name}`);
  assert(!/unsafe-inline|unsafe-eval/.test(text), `Unsafe CSP allowance: ${file.name}`);
  if (file.name.endsWith(".html")) {
    assert(!/<script(?![^>]*\bsrc=)[^>]*>|\son[a-z]+\s*=|\sstyle\s*=/i.test(text), `Inline executable content: ${file.name}`);
    for (const match of text.matchAll(/(?:src|href)="(\/[^"#]*)"/g)) {
      const url = match[1].split("?")[0];
      if (url === "/") continue;
      assert(files.some(file => "/" + file.name === url), `Missing referenced asset: ${url}`);
    }
  }
}
const html = await readFile(path.join(root, "index.html"), "utf8");
assert(/<link rel="canonical" href="https:\/\/applicodo.com\/">/.test(html), "Canonical must be HTTPS apex");
assert(!/type="(?:file|password)"|localStorage|sessionStorage|innerHTML/.test(html), "Unexpected input/storage surface");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Use one primary heading");
for (const [id, limit] of [["name", "100"], ["email", "254"], ["message", "5000"]]) {
  const tag = html.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0];
  assert(tag?.includes(`maxlength="${limit}"`) && tag.includes("required"), `Invalid field contract: ${id}`);
}
const routes = JSON.parse(await readFile(path.join(root, "_routes.json"), "utf8"));
assert.deepEqual(routes, { version: 1, include: ["/api/*"], exclude: [] });
console.log(`Verified ${files.length} allowed public files, ${files.reduce((sum, file) => sum + file.size, 0)} bytes; no source/secrets/legacy output.`);
