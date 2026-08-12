// Relative timestamps for community surfaces. Client-side only by nature (it
// reads the current clock), so it lives here rather than being computed on the
// server where it would be cached at the wrong moment.

export function timeAgo(value: string | Date, now: number = Date.now()): string {
  const then = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const mins = Math.round((now - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}
