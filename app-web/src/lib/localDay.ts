// Calendar days in the wearer's own timezone (Session 104). A wear log stores the
// day as the person saw it ("YYYY-MM-DD"), never a server timestamp, so "what I
// wore today" does not move to yesterday for someone in Shanghai or Pittsburgh.

const pad = (n: number) => String(n).padStart(2, "0");

/** The local calendar day of a date, "YYYY-MM-DD". */
export function localDay(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" for a year, month (1–12) and day. */
export const dayOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/**
 * A month as calendar rows starting on Sunday: null for the blanks before the 1st
 * and after the last day.
 */
export function monthGrid(year: number, month: number): Array<Array<string | null>> {
  const first = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: Array<string | null> = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => dayOf(year, month, i + 1))];
  while (cells.length % 7) cells.push(null);
  const rows: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** The month before or after (delta −1 / +1). */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Whole days from a to b ("YYYY-MM-DD"); positive when b is later. */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
