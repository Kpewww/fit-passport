// Fetch an address someone pasted, without ever running Node's Brotli decoder
// (Session 103). Server only.
//
// CVE-2026-111497 (October 2026) is an out-of-bounds write in Node's Brotli decoder,
// fixed in 22.23.4 / 24.22.1 / 26.12.1. fetch() decompresses whatever
// Content-Encoding the far side sends, so a hostile page could reach that decoder
// whatever we ask for. This uses node:http(s), which decompresses nothing: we ask
// for gzip or deflate, decode those ourselves (zlib's inflate, a different decoder),
// and drop any other encoding unread. Redirects are never followed here; the caller
// re-checks every hop (extractorLLM.ts gate). Sizes are capped before and after
// decompression, so a small "zip bomb" cannot fill memory.

import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";

export const MAX_WIRE_BYTES = 6_000_000;
export const MAX_DECODED_BYTES = 12_000_000;

export class UnsafeEncoding extends Error {}

type Init = { signal?: AbortSignal; headers?: Record<string, string> };

/** Decode a body by its Content-Encoding, or throw UnsafeEncoding for anything but gzip/deflate/identity. */
export function decodeBody(raw: Buffer, encoding: string | null | undefined): Buffer {
  const encs = (encoding ?? "").toLowerCase().split(",").map((e) => e.trim()).filter((e) => e && e !== "identity");
  let out = raw;
  // Encodings are listed in the order applied; undo them last first.
  for (const e of encs.reverse()) {
    if (e === "gzip" || e === "x-gzip") out = zlib.gunzipSync(out, { maxOutputLength: MAX_DECODED_BYTES });
    else if (e === "deflate") {
      try { out = zlib.inflateSync(out, { maxOutputLength: MAX_DECODED_BYTES }); }
      catch { out = zlib.inflateRawSync(out, { maxOutputLength: MAX_DECODED_BYTES }); }
    } else throw new UnsafeEncoding(`refused content-encoding: ${e}`);
  }
  return out;
}

export function safeFetch(input: URL | string, init: Init = {}): Promise<Response> {
  const url = typeof input === "string" ? new URL(input) : input;
  const mod = url.protocol === "https:" ? https : url.protocol === "http:" ? http : null;
  if (!mod) return Promise.reject(new Error(`unsupported protocol ${url.protocol}`));

  return new Promise<Response>((resolve, reject) => {
    const req = mod.request(url, {
      method: "GET",
      headers: { ...init.headers, "accept-encoding": "gzip, deflate" },
    }, (res) => {
      const encoding = res.headers["content-encoding"];
      try {
        // Refuse before reading a byte of a body we will not decode.
        decodeBody(Buffer.alloc(0), encoding && /br|zstd/i.test(encoding) ? encoding : "identity");
      } catch (e) {
        res.destroy();
        reject(e);
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > MAX_WIRE_BYTES) { res.destroy(); reject(new Error("response too large")); return; }
        chunks.push(c);
      });
      res.on("error", reject);
      res.on("end", () => {
        try {
          const status = res.statusCode ?? 0;
          const body = decodeBody(Buffer.concat(chunks), encoding);
          const headers = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (v == null || k === "content-encoding" || k === "content-length") continue;
            headers.set(k, Array.isArray(v) ? v.join(", ") : v);
          }
          const nullBody = status === 204 || status === 304 || status < 200;
          if (status < 200 || status > 599) throw new Error(`bad status ${status}`);
          resolve(new Response(nullBody ? null : new Uint8Array(body), { status, headers }));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    if (init.signal) {
      if (init.signal.aborted) req.destroy(new Error("aborted"));
      init.signal.addEventListener("abort", () => req.destroy(new Error("aborted")), { once: true });
    }
    req.end();
  });
}
