// Is this Node.js patched against the October 2026 Brotli decoder flaw (Session 103)?
//
// CVE-2026-111497 (nodejs.org, "Wednesday, October 21, 2026 Security Releases"): an
// out-of-bounds write in Node's Brotli decoder permits remote code execution. Our
// server fetches pages and chart pictures from addresses people paste, and fetch()
// decompresses whatever Content-Encoding the far side sends, so a hostile site
// could send a crafted Brotli body. Since Session 103 untrusted addresses go through
// safeFetch.ts, which never runs the Brotli decoder, so the flaw is not reachable
// that way on any Node. This check now only reports, on /admin, whether the host has
// moved to a fixed release (the same release fixed TLS and DNS issues too).

/** The first fixed release of each line. Lines not listed are treated as unfixed. */
export const FIXED: Record<number, [number, number, number]> = {
  22: [22, 23, 4],
  24: [24, 22, 1],
  26: [26, 12, 1],
};

export function brotliPatched(version: string = process.versions.node): boolean {
  const m = version.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return false;
  const v = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fixed = FIXED[v[0]];
  if (!fixed) return v[0] > 26; // a newer line ships with the fix
  for (let i = 1; i < 3; i++) if (v[i] !== fixed[i]) return v[i] > fixed[i];
  return true;
}
