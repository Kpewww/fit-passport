// Relative timestamps for community surfaces. Client-side only by nature (it
// reads the current clock), so it lives here rather than being computed on the
// server where it would be cached at the wrong moment.

export function timeAgo(value: string | Date, now: number = Date.now(), locale: "en" | "zh" = "en"): string {
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const zh = locale === "zh";
  const mins = Math.round((now - then) / 60_000);
  if (mins < 1) return zh ? "刚刚" : "just now";
  if (mins < 60) return zh ? `${mins} 分钟前` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return zh ? `${hrs} 小时前` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return zh ? `${days} 天前` : `${days}d ago`;
  return new Date(then).toLocaleDateString(zh ? "zh-CN" : undefined);
}
