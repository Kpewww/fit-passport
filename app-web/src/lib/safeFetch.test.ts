import http from "node:http";
import zlib from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodeBody, safeFetch, UnsafeEncoding } from "./safeFetch";

// A real local server, so the transport itself is what is tested.
let server: http.Server;
let base = "";
const page = "<html><body><table><tr><th>Size</th><th>Chest</th></tr><tr><td>M</td><td>96-104</td></tr></table></body></html>";
let lastAcceptEncoding: string | undefined;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    lastAcceptEncoding = req.headers["accept-encoding"] as string | undefined;
    const send = (headers: Record<string, string>, body: Buffer | string, status = 200) => { res.writeHead(status, headers); res.end(body); };
    switch (req.url) {
      case "/plain": return send({ "content-type": "text/html" }, page);
      case "/gzip": return send({ "content-type": "text/html", "content-encoding": "gzip" }, zlib.gzipSync(page));
      case "/deflate": return send({ "content-type": "text/html", "content-encoding": "deflate" }, zlib.deflateSync(page));
      // A hostile server sends Brotli although we never asked for it.
      case "/br": return send({ "content-type": "text/html", "content-encoding": "br" }, zlib.brotliCompressSync(page));
      case "/redirect": return send({ location: "/plain" }, "", 302);
      case "/bomb": return send({ "content-type": "text/html", "content-encoding": "gzip" }, zlib.gzipSync(Buffer.alloc(40_000_000, 32)));
      case "/slow": return; // never answers
      default: return send({}, "nope", 404);
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  const a = server.address();
  base = `http://127.0.0.1:${typeof a === "object" && a ? a.port : 0}`;
});
afterAll(() => { server.closeAllConnections(); server.close(); });

describe("safeFetch: pasted addresses never reach the Brotli decoder (CVE-2026-111497)", () => {
  it("reads plain, gzip and deflate pages, and only ever asks for gzip or deflate", async () => {
    for (const p of ["/plain", "/gzip", "/deflate"]) {
      const r = await safeFetch(base + p);
      expect(r.status).toBe(200);
      expect(await r.text()).toBe(page);
      expect(r.headers.get("content-encoding")).toBeNull();
    }
    expect(lastAcceptEncoding).toBe("gzip, deflate");
  });

  it("refuses a Brotli body the server sends anyway, without decoding it", async () => {
    await expect(safeFetch(base + "/br")).rejects.toBeInstanceOf(UnsafeEncoding);
    expect(() => decodeBody(Buffer.from("x"), "br")).toThrow(UnsafeEncoding);
    expect(() => decodeBody(Buffer.from("x"), "gzip, br")).toThrow(UnsafeEncoding);
  });

  it("does not follow redirects: the caller re-checks each hop", async () => {
    const r = await safeFetch(base + "/redirect");
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("/plain");
  });

  it("caps what a small compressed body may grow into", async () => {
    await expect(safeFetch(base + "/bomb")).rejects.toThrow();
  });

  it("gives up when the caller's timer aborts", async () => {
    const c = new AbortController();
    setTimeout(() => c.abort(), 100);
    await expect(safeFetch(base + "/slow", { signal: c.signal })).rejects.toThrow();
  });

  it("only speaks http and https", async () => {
    await expect(safeFetch("file:///etc/passwd")).rejects.toThrow();
  });
});
