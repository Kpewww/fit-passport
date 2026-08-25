// Tests for the SSRF guard on user-supplied URLs.
//
// `/api/check` fetches whatever link a user pastes, so these are the checks that
// stand between a pasted string and our server making a request from inside the
// trust boundary. Each case below is a real technique, not a hypothetical.

import { describe, expect, it } from "vitest";
import { checkUrlSafety, isBlockedHostname, isPrivateIPv4, isPrivateIPv6 } from "./urlSafety";

describe("private IPv4 detection", () => {
  it("blocks the cloud metadata address", () => {
    // The highest-value SSRF target: on serverless platforms this endpoint can
    // return live credentials to a plain unauthenticated GET.
    expect(isPrivateIPv4("169.254.169.254")).toBe(true);
  });

  it("blocks loopback, RFC1918, CGNAT and reserved space", () => {
    for (const ip of [
      "127.0.0.1", "127.1.2.3",
      "10.0.0.1", "10.255.255.255",
      "172.16.0.1", "172.31.255.255",
      "192.168.1.1",
      "192.0.0.1",
      "100.64.0.1",
      "198.18.0.1",
      "0.0.0.0",
      "224.0.0.1", "255.255.255.255",
    ]) {
      expect(isPrivateIPv4(ip), ip).toBe(true);
    }
  });

  it("allows genuinely public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "104.16.0.1", "172.32.0.1", "192.167.1.1"]) {
      expect(isPrivateIPv4(ip), ip).toBe(false);
    }
  });

  it("is not fooled by out-of-range octets that merely look like an IP", () => {
    expect(isPrivateIPv4("999.999.999.999")).toBe(false);
    expect(isPrivateIPv4("10.0.0")).toBe(false);
  });
});

describe("private IPv6 detection", () => {
  it("blocks loopback and unspecified", () => {
    expect(isPrivateIPv6("::1")).toBe(true);
    expect(isPrivateIPv6("[::1]")).toBe(true);
    expect(isPrivateIPv6("::")).toBe(true);
  });

  it("blocks unique-local and link-local", () => {
    expect(isPrivateIPv6("fc00::1")).toBe(true);
    expect(isPrivateIPv6("fd12:3456::1")).toBe(true);
    expect(isPrivateIPv6("fe80::1")).toBe(true);
  });

  it("blocks an IPv4-mapped address smuggling metadata through v6", () => {
    expect(isPrivateIPv6("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateIPv6("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows public IPv6", () => {
    expect(isPrivateIPv6("2606:4700::1111")).toBe(false);
  });
});

describe("blocked hostnames", () => {
  it("blocks localhost and internal-by-convention suffixes", () => {
    for (const h of [
      "localhost", "LOCALHOST", "app.localhost",
      "printer.local", "db.internal", "thing.home.arpa",
      "metadata.google.internal", "metadata",
    ]) {
      expect(isBlockedHostname(h), h).toBe(true);
    }
  });

  it("ignores a trailing dot, which would otherwise slip past a suffix check", () => {
    expect(isBlockedHostname("localhost.")).toBe(true);
  });

  it("allows real retail hosts", () => {
    for (const h of ["www.uniqlo.com", "shop.lululemon.com", "item.taobao.com"]) {
      expect(isBlockedHostname(h), h).toBe(false);
    }
  });
});

describe("checkUrlSafety", () => {
  const bad = (u: string) => checkUrlSafety(u) as { ok: false; reason: string };

  it("accepts an ordinary product URL", () => {
    const v = checkUrlSafety("https://www.uniqlo.com/us/en/products/tee");
    expect(v.ok).toBe(true);
  });

  it("rejects non-HTTP schemes", () => {
    expect(bad("file:///etc/passwd").reason).toBe("scheme");
    expect(bad("gopher://evil/").reason).toBe("scheme");
    expect(bad("not a url at all").reason).toBe("scheme");
  });

  it("rejects embedded credentials, which disguise the real host", () => {
    // Reads as "shop.com" to a human; resolves to the metadata endpoint.
    expect(bad("https://shop.com@169.254.169.254/").reason).toBe("credentials");
  });

  it("rejects non-web ports used to probe internal services", () => {
    expect(bad("http://example.com:6379/").reason).toBe("port"); // redis
    expect(bad("http://example.com:22/").reason).toBe("port"); // ssh
    expect(checkUrlSafety("https://example.com:443/x").ok).toBe(true);
  });

  it("rejects private and loopback hosts written as literals", () => {
    expect(bad("http://169.254.169.254/latest/meta-data/").reason).toBe("private-host");
    expect(bad("http://127.0.0.1:3000/api/profile").reason).toBe("port");
    expect(bad("http://127.0.0.1/api/profile").reason).toBe("private-host");
    expect(bad("http://[::1]/").reason).toBe("private-host");
    expect(bad("http://192.168.0.1/").reason).toBe("private-host");
  });
});
