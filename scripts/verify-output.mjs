import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const root = path.resolve("public");
const allowed = new Set([
  "index.html", "404.html", "robots.txt", "sitemap.xml", "_headers", "_routes.json",
  "assets/site.css", "assets/contact.js", "assets/favicon.svg", "assets/captionfast-icon.png",
  "assets/plates/app-export.png", "assets/plates/app-language.png",
  "assets/rentalbench-logo.svg", "assets/garageclerk-icon.svg",
  "assets/plates/rentalbench-dashboard.png", "assets/plates/garageclerk-board.webp",
  "assets/plates/garageclerk-board-tablet.webp", "assets/plates/garageclerk-board-mobile.webp",
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

const stylesheetVersion = createHash("sha256").update(await readFile(path.join(root, "assets/site.css"))).digest("hex").slice(0, 12);
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=<>/"']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3]]));
}
function assertLocalAsset(url) {
  assert(url.startsWith("/") && !url.startsWith("//"), `Asset must be self-hosted: ${url}`);
  const pathname = url.split(/[?#]/)[0];
  assert(files.some(file => "/" + file.name === pathname), `Missing referenced asset: ${url}`);
}

for (const file of files.filter(file => /\.(html|js|css|svg|xml|txt)$/.test(file.name) || file.name === "_headers")) {
  const text = await readFile(path.join(root, file.name), "utf8");
  assert(!/OFFLINEZIP|wp-content|wp-admin|jquery|bootstrap|mailto:|tel:|Google Maps|Iasi|Iași|streetAddress|postalAddress|MODAL_API_SECRET|TURNSTILE_SECRET_KEY|RESEND_API_KEY|re_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC )?PRIVATE KEY/i.test(text), `Forbidden legacy/private content: ${file.name}`);
  assert(!/unsafe-inline|unsafe-eval/.test(text), `Unsafe CSP allowance: ${file.name}`);
  if (file.name.endsWith(".svg")) {
    assert(!/<(?:script|foreignObject|iframe|object|embed|image|use)\b|\son[a-z]+\s*=|\b(?:href|src)\s*=|<!DOCTYPE|<!ENTITY|url\s*\(/i.test(text), `Executable or resource-bearing SVG: ${file.name}`);
  }
  if (file.name.endsWith(".html")) {
    assert(!/<script(?![^>]*\bsrc=)[^>]*>|\son[a-z]+\s*=|\sstyle\s*=/i.test(text), `Inline executable content: ${file.name}`);
    for (const match of text.matchAll(/(?:src|href)="(\/[^"#]*)"/g)) {
      const url = match[1].split("?")[0];
      if (url === "/") continue;
      assertLocalAsset(url);
    }
    for (const match of text.matchAll(/\bsrcset="([^"]*)"/g)) {
      for (const candidate of match[1].split(",")) assertLocalAsset(candidate.trim().split(/\s+/)[0]);
    }
    const stylesheets = [...text.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0]))
      .filter(link => link.rel?.toLowerCase().split(/\s+/).includes("stylesheet"));
    assert.deepEqual(stylesheets.map(link => link.href), [`/assets/site.css?v=${stylesheetVersion}`], `Stale stylesheet version: ${file.name}`);
  }
}
const html = await readFile(path.join(root, "index.html"), "utf8");
assert(/<link rel="canonical" href="https:\/\/applicodo.com\/">/.test(html), "Canonical must be HTTPS apex");
assert(!/type="(?:file|password)"|localStorage|sessionStorage|innerHTML/.test(html), "Unexpected input/storage surface");
assert.equal((html.match(/<h1\b/g) || []).length, 1, "Use one primary heading");
const projectURLs = new Set([
  "https://captionfast.com/", "https://rentalbench.com/", "https://garageclerk.com/",
  "https://apps.apple.com/us/app/captionfast-auto-ai-captions/id6757338308",
]);
const projectHosts = new Set([...projectURLs].map(url => new URL(url).hostname));
const foundProjects = new Set();
for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
  const link = attributes(match[0]);
  const url = new URL(link.href || "", "https://applicodo.com/");
  if (!projectHosts.has(url.hostname)) continue;
  assert.equal(url.protocol, "https:", `Project link must use HTTPS: ${link.href}`);
  assert(!link.target || link.target.toLowerCase() === "_self", `Project link must open in the same tab: ${link.href}`);
  assert(!link.rel?.toLowerCase().split(/\s+/).some(value => ["nofollow", "ugc", "sponsored"].includes(value)), `Project link must be followable: ${link.href}`);
  if (projectURLs.has(link.href)) foundProjects.add(link.href);
}
assert.deepEqual(foundProjects, projectURLs, "Missing canonical project homepage or App Store link");
for (const [id, limit] of [["name", "100"], ["email", "254"], ["message", "5000"]]) {
  const tag = html.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0];
  assert(tag?.includes(`maxlength="${limit}"`) && tag.includes("required"), `Invalid field contract: ${id}`);
}
const routes = JSON.parse(await readFile(path.join(root, "_routes.json"), "utf8"));
assert.deepEqual(routes, { version: 1, include: ["/api/*"], exclude: [] });
console.log(`Verified ${files.length} allowed public files, ${files.reduce((sum, file) => sum + file.size, 0)} bytes; no source/secrets/legacy output.`);
