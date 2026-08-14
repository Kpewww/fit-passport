#!/usr/bin/env node
// Render project Markdown documents to on-brand PDFs — no external toolchain.
//
//   node scripts/md-to-pdf.mjs ../docs/prospectus/Fit-Passport-Prospectus.md ["Doc title"]
//   node scripts/md-to-pdf.mjs --all         # every .md in docs/prospectus
//
// Why a hand-rolled converter: pandoc / weasyprint / wkhtmltopdf aren't installed
// and pull in a lot; a full markdown npm dep isn't in the tree. These documents
// use a known, small subset of Markdown, so a focused converter is simpler than a
// dependency — and it lets us style the PDF in the product's OWN design system
// (self-hosted Fraunces + Inter, cobalt accent, porcelain paper) so the deck reads
// like the app, not like a generic export.
//
// Rendering is done by headless Chrome (present on this machine) via
// --print-to-pdf, which honours @page and our print CSS faithfully.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS = resolve(HERE, "../src/app/fonts");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// ---------- a small, correct Markdown subset ----------
// Block grammar: headings, hr, fenced code, blockquotes, tables (GFM pipe),
// ordered/unordered lists (one level), and paragraphs. Inline: bold, italic,
// code, links. That's everything these documents use.

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s) {
  // Order matters: escape first, then re-introduce our own tags.
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, (_, c) => `<strong>${c}</strong>`);
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, (_, p, c) => `${p}<em>${c}</em>`);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, href) => `<a href="${href}">${txt}</a>`);
  return t;
}

function render(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const flushList = (items, ordered) => {
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i++; continue; }

    // fenced code
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // closing fence
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2].trim())}</h${lvl}>`);
      i++;
      continue;
    }

    // blockquote (possibly multi-line)
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // GFM table: header row, separator row of ---|---, then body
    if (/^\|.*\|/.test(line) && i + 1 < lines.length && /^\|?[\s:\-|]+\|[\s:\-|]*$/.test(lines[i + 1])) {
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
          `<tbody>${rows
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`,
      );
      continue;
    }

    // lists (single level)
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ul || ol) {
      const ordered = !!ol;
      const items = [];
      const re = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
      const blockStart = /^(#{1,6}\s|>|```|\||-{3,}|_{3,})/;
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i++].match(re)[1];
        // Absorb lazy continuation lines: an item wrapped across several source
        // lines is still one item, not a new paragraph mid-list.
        while (
          i < lines.length &&
          !/^\s*$/.test(lines[i]) &&
          !re.test(lines[i]) &&
          !blockStart.test(lines[i])
        ) {
          item += " " + lines[i++].trim();
        }
        items.push(item);
      }
      flushList(items, ordered);
      continue;
    }

    // paragraph (gather until blank / block start)
    const buf = [line];
    i++;
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|>|```|\||\s*[-*]\s|\s*\d+\.\s|-{3,}|_{3,})/.test(lines[i])
    ) {
      buf.push(lines[i++]);
    }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

// Pull an <h1> to use as the running title / cover, and drop a leading HTML
// comment (our source-only note) from the visible output.
function extractTitle(md) {
  const m = md.match(/^#\s+(.*)$/m);
  return m ? m[1].trim() : "Fit Passport";
}

function shell(title, bodyHtml) {
  // Fonts embedded by absolute path so the PDF is genuinely on-brand offline.
  const inter = join(FONTS, "Inter.woff2");
  const fraunces = join(FONTS, "Fraunces.woff2");
  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @font-face { font-family:'Fraunces'; src:url('file://${fraunces}') format('woff2'); font-weight:100 900; }
  @font-face { font-family:'InterV'; src:url('file://${inter}') format('woff2'); font-weight:100 900; }
  @page { size: A4; margin: 20mm 18mm 18mm; }
  :root {
    --ink:#14181d; --soft:#454b54; --faint:#6b7480; --line:#e3e6ea;
    --paper:#ffffff; --brand:#2438d6; --brand-tint:#eef0fd;
  }
  * { box-sizing: border-box; }
  body { font-family:'InterV', -apple-system, Segoe UI, sans-serif; color:var(--ink);
         font-size:10.2pt; line-height:1.62; margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  h1,h2,h3,h4 { font-family:'Fraunces', Georgia, serif; line-height:1.16; color:var(--ink); font-weight:600; }
  h1 { font-size:30pt; letter-spacing:-0.4pt; margin:0 0 4pt; }
  h2 { font-size:17pt; margin:22pt 0 7pt; padding-top:10pt; border-top:1.5pt solid var(--ink); }
  h3 { font-size:12.5pt; margin:15pt 0 4pt; }
  h4 { font-size:10.5pt; margin:12pt 0 3pt; font-family:'InterV',sans-serif; font-weight:700;
       text-transform:uppercase; letter-spacing:1.2pt; color:var(--brand); }
  p { margin:0 0 7pt; }
  a { color:var(--brand); text-decoration:none; }
  strong { font-weight:700; }
  code { font-family:'SF Mono', ui-monospace, Menlo, monospace; font-size:8.8pt;
         background:#f4f5f7; padding:1pt 3pt; border-radius:3pt; }
  pre { background:#14181d; color:#e9ebef; padding:11pt 13pt; border-radius:8pt; overflow:hidden;
        font-size:8.4pt; line-height:1.5; margin:8pt 0 12pt; }
  pre code { background:none; color:inherit; padding:0; font-size:8.4pt; }
  ul,ol { margin:0 0 9pt; padding-left:16pt; }
  li { margin:1.5pt 0; }
  blockquote { margin:9pt 0; padding:8pt 14pt; background:var(--brand-tint);
               border-left:3pt solid var(--brand); border-radius:0 6pt 6pt 0; color:var(--soft); }
  blockquote p { margin:0; }
  table { border-collapse:collapse; width:100%; margin:8pt 0 13pt; font-size:8.9pt; }
  th { text-align:left; background:#14181d; color:#fff; padding:5pt 8pt; font-weight:600;
       font-size:8pt; text-transform:uppercase; letter-spacing:0.6pt; }
  td { padding:5pt 8pt; border-bottom:0.6pt solid var(--line); vertical-align:top; }
  tbody tr:nth-child(even) td { background:#fafbfc; }
  hr { border:none; border-top:0.8pt solid var(--line); margin:16pt 0; }
  h2, h3 { break-after:avoid; }
  table, pre, blockquote, li { break-inside:avoid; }
</style></head><body>${bodyHtml}</body></html>`;
}

function convert(mdPath) {
  const abs = resolve(mdPath);
  const md = readFileSync(abs, "utf8");
  const title = extractTitle(md);
  const html = shell(title, render(md));
  const htmlPath = abs.replace(/\.md$/, ".html");
  const pdfPath = abs.replace(/\.md$/, ".pdf");
  writeFileSync(htmlPath, html);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    `file://${htmlPath}`,
  ], { stdio: "ignore" });
  // The HTML is only a rendering intermediate; keep it with --keep-html to debug.
  if (!process.argv.includes("--keep-html")) rmSync(htmlPath, { force: true });
  console.log(`  ✓ ${basename(pdfPath)}  ←  ${basename(abs)}`);
}

if (!existsSync(CHROME)) {
  console.error("Google Chrome not found — needed for PDF rendering.");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args[0] === "--all") {
  const dir = resolve(HERE, "../../docs/prospectus");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md"))) convert(join(dir, f));
} else if (args[0]) {
  convert(args[0]);
} else {
  console.error("usage: md-to-pdf.mjs <file.md> | --all");
  process.exit(1);
}
