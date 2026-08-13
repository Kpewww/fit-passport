// Export the passport card as a PNG the holder can save or post.
//
// We don't screenshot the DOM (that needs html2canvas and still mis-renders
// gradients/blend modes). Instead we RE-DRAW the card as a standalone SVG — we
// own the design, so this is exact, dependency-free, and crisp at any scale —
// then rasterise it through a canvas and hand back a blob URL.
//
// PRIVACY: only fields already public by code are drawn (holder, passport no.,
// region, preferred fit, edition). Never measurements.

import type { CardTheme } from "@/components/MetalCard";

export type CardExportData = {
  theme: CardTheme;
  holder: string;
  passportNo: string;
  /** Pre-formatted membership number, e.g. "No. 00000042". */
  memberNo?: string;
  region: string;
  preferredFit: string;
  /** Optional portrait as a data URL (already client-resized). */
  avatarDataUrl?: string | null;
};

const W = 1600;
const H = 1000;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Build the card as an SVG string at export resolution. */
export function cardSvg(d: CardExportData): string {
  const t = d.theme;
  const veins = t.veined
    ? `<g opacity="0.35" fill="none" stroke="#fff" stroke-linecap="round">
         <path d="M-20,230 C300,120 500,370 870,250 C1200,150 1430,330 1700,200" stroke-opacity="0.7" stroke-width="9"/>
         <path d="M-20,560 C330,450 470,700 830,600 C1160,510 1400,720 1700,570" stroke-opacity="0.45" stroke-width="6"/>
         <path d="M-20,790 C360,730 560,910 930,810 C1230,730 1460,880 1700,780" stroke-opacity="0.3" stroke-width="5"/>
       </g>`
    : "";

  const portrait = d.avatarDataUrl
    ? `<clipPath id="pc"><circle cx="180" cy="470" r="86"/></clipPath>
       <image href="${d.avatarDataUrl}" x="94" y="384" width="172" height="172"
              preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/>
       <circle cx="180" cy="470" r="86" fill="none" stroke="${t.sheen}" stroke-opacity="0.5" stroke-width="3"/>`
    : `<circle cx="180" cy="470" r="86" fill="rgba(255,255,255,0.10)" stroke="${t.sheen}" stroke-opacity="0.4" stroke-width="3"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.from}"/>
      <stop offset="52%" stop-color="${t.via}"/>
      <stop offset="100%" stop-color="${t.to}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="22%" stop-color="${t.sheen}" stop-opacity="0"/>
      <stop offset="47%" stop-color="${t.sheen}" stop-opacity="0.16"/>
      <stop offset="68%" stop-color="${t.sheen}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grain" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(115)">
      <rect width="10" height="10" fill="none"/>
      <rect width="4" height="10" fill="#fff" opacity="0.05"/>
      <rect x="6" width="2" height="10" fill="#000" opacity="0.07"/>
    </pattern>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="56"/></clipPath>
  </defs>

  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="url(#body)"/>
    <rect width="${W}" height="${H}" fill="url(#grain)"/>
    ${veins}
    <rect width="${W}" height="${H}" fill="url(#sheen)"/>
  </g>
  <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="54" fill="none" stroke="#fff" stroke-opacity="0.22" stroke-width="3"/>

  <g fill="${t.text}" font-family="Georgia, 'Times New Roman', serif">
    <text x="96" y="150" font-size="72" font-style="italic">Fit Passport</text>
  </g>
  <g fill="${t.text}" font-family="Helvetica, Arial, sans-serif">
    <text x="98" y="196" font-size="24" letter-spacing="7" opacity="0.6">${esc(t.label.toUpperCase())}</text>
    ${d.memberNo ? `<text x="${W - 96}" y="146" font-size="34" letter-spacing="8" opacity="0.85" text-anchor="end" font-family="'Courier New', monospace">${esc(d.memberNo)}</text>` : ""}
    <text x="${W - 96}" y="196" font-size="24" letter-spacing="6" opacity="0.6" text-anchor="end">ISSUED 2026</text>
  </g>

  ${portrait}

  <g font-family="Helvetica, Arial, sans-serif" fill="${t.text}">
    <text x="316" y="440" font-size="22" letter-spacing="6" opacity="0.55">HOLDER</text>
  </g>
  <text x="316" y="505" font-size="60" font-family="Georgia, 'Times New Roman', serif" fill="${t.text}">${esc(d.holder)}</text>

  <g font-family="Helvetica, Arial, sans-serif" fill="${t.text}">
    <text x="96" y="700" font-size="20" letter-spacing="6" opacity="0.55">PASSPORT NO.</text>
    <text x="96" y="742" font-size="30" font-family="'Courier New', monospace">${esc(d.passportNo)}</text>

    <text x="640" y="700" font-size="20" letter-spacing="6" opacity="0.55">REGION</text>
    <text x="640" y="742" font-size="30" font-family="'Courier New', monospace">${esc(d.region)}</text>

    <text x="1040" y="700" font-size="20" letter-spacing="6" opacity="0.55">PREFERRED FIT</text>
    <text x="1040" y="742" font-size="30">${esc(d.preferredFit)}</text>
  </g>

  <line x1="96" y1="838" x2="${W - 96}" y2="838" stroke="${t.text}" stroke-opacity="0.25" stroke-width="2"/>
  <g font-family="Helvetica, Arial, sans-serif" fill="${t.text}" opacity="0.65">
    <text x="96" y="900" font-size="20" letter-spacing="5">ONE BODY · ONE FIT IDENTITY · ANY STORE</text>
  </g>

  <!-- logo mark: passport arch + F/P monogram -->
  <g transform="translate(${W - 190},840) scale(2.4)" fill="none" stroke="${t.text}" stroke-opacity="0.8" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M10 20a14 14 0 0 1 28 0v14a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" transform="translate(0,-24)"/>
    <path d="M19 15v18M19 15h9" transform="translate(0,-24)"/>
    <path d="M19 23h7a4.5 4.5 0 0 1 0 9h-7" transform="translate(0,-24)"/>
  </g>
</svg>`;
}

/**
 * Rasterise the card SVG to a PNG blob URL. Caller is responsible for revoking
 * the URL after triggering the download.
 */
export async function cardPngUrl(d: CardExportData, scale = 1): Promise<string> {
  const svg = cardSvg(d);
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const img = new Image();
  // Data URLs are same-origin-safe, so the canvas stays untainted.
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("card render failed"));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("png encode failed");
  return URL.createObjectURL(blob);
}

/** Render + trigger a download of the card PNG. */
export async function downloadCardPng(d: CardExportData, filename = "fit-passport-card.png") {
  const url = await cardPngUrl(d);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Give the browser a tick to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
