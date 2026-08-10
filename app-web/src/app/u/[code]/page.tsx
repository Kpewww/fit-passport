"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, EmptyState, LinkButton } from "@/components/ui";

type ClosetItem = {
  id: string;
  brand: string;
  category: string;
  size: string;
  region: string | null;
  fitRating: number;
  areaNotesJson: string | null;
  color: string | null;
  collectionId: string | null;
};

type PublicView = {
  username: string;
  accountCode: string;
  bodyType: string | null;
  canExport: boolean;
  collections: Array<{ id: string; name: string; sortIndex: number }>;
  closet: ClosetItem[];
};

export default function ViewByCodePage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;
  const [data, setData] = useState<PublicView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/view/${encodeURIComponent(code)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setNotFound(true));
  }, [code]);

  if (notFound) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <EmptyState
            title="No closet found for that code"
            body="Double-check the account code. Codes look like FP-XXXX-XXXX-XXXXX."
            action={<LinkButton href="/community">Try another code</LinkButton>}
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-tint px-2.5 py-0.5 font-medium text-brand">
            Viewing {data.username}&apos;s closet
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-ink-faint">
            read-only
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-ink">{data.username}</h1>
        <p className="mt-1 text-ink-soft">
          {data.bodyType ? (
            <>Body type: <strong className="capitalize">{data.bodyType}</strong></>
          ) : (
            <span className="text-ink-faint">Body type not shared</span>
          )}
          <span className="text-ink-faint"> · {data.closet.length} items</span>
        </p>

        <p className="mt-2 text-xs text-ink-faint">
          Precise measurements are never shared by code — only the closet and a
          coarse body type (if the owner opted in).
        </p>

        <div className="mt-6 space-y-6">
          {data.closet.length === 0 ? (
            <EmptyState title="This closet is empty" body="Nothing to show yet." />
          ) : (
            buildSections(data).map((sec) => (
              <div key={sec.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-ink-soft">
                  {sec.name}
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-normal normal-case text-ink-faint">
                    {sec.items.length}
                  </span>
                </h2>
                <div className="space-y-2">
                  {sec.items.map((it) => (
                    <Card key={it.id} className="!p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-ink">
                          <ColorDot color={it.color} />
                          {it.brand} · <span className="text-ink-soft">{it.category}</span> · size {it.size}
                          {it.color && <span className="text-xs text-ink-faint">· {it.color}</span>}
                        </div>
                        <span className="inline-flex gap-0.5 text-xs">
                          <span className="text-amber-500">{"★".repeat(it.fitRating)}</span>
                          <span className="text-neutral-300">{"★".repeat(5 - it.fitRating)}</span>
                        </span>
                      </div>
                      {it.areaNotesJson && (
                        <p className="mt-0.5 text-xs text-ink-faint">{safeNotes(it.areaNotesJson)}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <Card className="mt-6 flex items-center justify-between bg-neutral-50">
          <p className="text-sm text-ink-soft">
            Like this closet? Build your own fit profile and get size
            recommendations based on what fits {data.username}.
          </p>
          <LinkButton href="/">Get started</LinkButton>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-faint">
          <Link href="/community" className="hover:underline">← Back to community</Link>
        </p>
      </div>
    </main>
  );
}

function buildSections(data: PublicView) {
  const sections = data.collections
    .slice()
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: data.closet.filter((it) => it.collectionId === c.id),
    }))
    .filter((s) => s.items.length > 0);
  const uncategorized = data.closet.filter((it) => !it.collectionId);
  if (uncategorized.length > 0) {
    sections.push({ id: "__uncat__", name: "Uncategorized", items: uncategorized });
  }
  return sections;
}

const COLOR_PRESETS: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", navy: "#1f2a44", blue: "#3b82f6",
  grey: "#9ca3af", beige: "#d8c3a5", green: "#4b7a53", red: "#b03a3a", brown: "#6b4f3a",
};

function ColorDot({ color }: { color: string | null }) {
  if (!color) return null;
  const hex = /^#[0-9a-f]{3,8}$/i.test(color) ? color : COLOR_PRESETS[color.toLowerCase()];
  if (!hex) return null;
  return (
    <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full border border-neutral-300"
      style={{ backgroundColor: hex }} title={color} />
  );
}

function safeNotes(json: string | null): string | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json)?.notes ?? undefined; } catch { return undefined; }
}
