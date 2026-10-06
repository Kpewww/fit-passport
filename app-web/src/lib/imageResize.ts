// Client-side image resize → a small JPEG data URL. Used for user-uploaded
// portraits and garment photos so we never store large blobs (and never scrape
// brand imagery — only the user's own photos).
//
// Garment photos are the closet's covers (Session 76, R3): a 4:5 centre crop at
// 600×750, the shape the gallery cards draw. They are stored in the database as
// base64 for now — the founder's decision — so the size is held to a budget:
// ~90 KB of JPEG, stepping the quality down on a busy photo rather than failing.
// The API's 400 KB cap stays as the backstop. Move to object storage before a
// real cohort (next-steps, "known wall").

export const GARMENT_PHOTO = { width: 600, height: 750, quality: 0.82, budgetBytes: 90_000 } as const;

/** The source rectangle that fills a dst box without distortion: centred, cropped on the long side. */
export function coverCrop(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / scale;
  const sh = dstH / scale;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

/** Bytes of JPEG a base64 data URL holds (base64 carries 3 bytes per 4 characters). */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

/** Qualities to try, best first, until one fits the budget. */
export function qualitySteps(start: number): number[] {
  const steps: number[] = [];
  for (let q = start; q >= 0.5 - 1e-9; q -= 0.1) steps.push(Math.round(q * 100) / 100);
  return steps;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => resolve(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Crop to fill `width`×`height`, then encode as JPEG within `budgetBytes` if given. */
export async function resizeImageToCover(
  file: Blob,
  width: number,
  height: number,
  quality = 0.8,
  budgetBytes?: number,
): Promise<string> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  // A transparent PNG would turn black in JPEG; give it the paper ground instead.
  ctx.fillStyle = "#F3F3F1";
  ctx.fillRect(0, 0, width, height);
  const c = coverCrop(img.width, img.height, width, height);
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, width, height);
  let out = canvas.toDataURL("image/jpeg", quality);
  if (budgetBytes) {
    for (const q of qualitySteps(quality).slice(1)) {
      if (dataUrlBytes(out) <= budgetBytes) break;
      out = canvas.toDataURL("image/jpeg", q);
    }
  }
  return out;
}

/** A square crop — portraits. */
export function resizeImageToDataUrl(file: File, size = 256, quality = 0.8): Promise<string> {
  return resizeImageToCover(file, size, size, quality);
}

/** A closet cover: 4:5, 600×750, within the ~90 KB budget. */
export function resizeGarmentPhoto(file: Blob): Promise<string> {
  const p = GARMENT_PHOTO;
  return resizeImageToCover(file, p.width, p.height, p.quality, p.budgetBytes);
}
