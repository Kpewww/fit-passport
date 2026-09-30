"use client";

// The Questions section — the community's utility loop (ecosystem step 2).
//
// Lives INSIDE /community rather than on its own page: asking about fit and
// browsing other people's fit are the same activity, and splitting them made the
// community look emptier than it is. Individual threads still get their own URL
// (/ask/[id]) because a question is a thing you share a link to.
//
// The whole design bet: an answer here can carry a RECEIPT from the answerer's
// real closet, so the reader gets "this brand in this size fits a body like
// yours", not a stranger's hunch. The composer and every list row are built
// around making that attachment obvious and easy.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { Avatar } from "@/components/Badges";
import { ClosetAttachPicker, type ClosetPick } from "@/components/Evidence";
import { POST_KINDS, type PostKind } from "@/lib/posts";
import { timeAgo } from "@/lib/timeAgo";
import { Check } from "@/components/Icon";
import { useLocale, useT } from "@/i18n/client";
import { usePeopleWords } from "@/i18n/people";

type PostRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  productUrl: string | null;
  createdAt: string;
  resolved: boolean;
  answerCount: number;
  mine: boolean;
  author: { username: string | null; accountCode: string | null; avatarDataUrl: string | null; bodyType: string | null };
  evidence: { brand: string; category: string; size: string } | null;
};

const KIND_FILTERS: Array<"ALL" | PostKind> = ["ALL", "HELP", "RECOMMEND", "VERDICT"];

export function AskSection() {
  const t = useT("ask");
  const tc = useT("common");
  const router = useRouter();
  const [posts, setPosts] = useState<PostRow[] | null>(null);
  const [kind, setKind] = useState<"ALL" | PostKind>("ALL");
  const [unanswered, setUnanswered] = useState(false);
  const [claimed, setClaimed] = useState<boolean | null>(null);
  const [closet, setCloset] = useState<ClosetPick[]>([]);

  const load = useCallback(() => {
    const qs = new URLSearchParams();
    if (kind !== "ALL") qs.set("kind", kind);
    if (unanswered) qs.set("unanswered", "1");
    setPosts(null);
    fetch(`/api/posts?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]));
  }, [kind, unanswered]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((s) => setClaimed(!!s.claimed)).catch(() => setClaimed(false));
    fetch("/api/closet").then((r) => r.json()).then((d) => setCloset(d.items ?? [])).catch(() => {});
  }, []);

  return (
    <section id="questions" className="mt-10 scroll-mt-20">
      <h2 className="font-serif text-3xl text-ink">{t("title")}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{t("lede")}</p>

      <Composer
        claimed={claimed}
        closet={closet}
        onPosted={(id) => router.push(`/ask/${id}`)}
      />

      {/* Filters. Labels are fixed strings, so nothing shifts as you switch. */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-line bg-paper-soft p-0.5 text-xs font-medium">
          {KIND_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setKind(f)}
              aria-pressed={kind === f}
              className={`rounded-full px-3 py-1 transition-colors ${
                kind === f ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUnanswered((v) => !v)}
          aria-pressed={unanswered}
          title={t("needsAnswerTitle")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            unanswered
              ? "border-ink bg-ink text-paper"
              : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
          }`}
        >
          {t("needsAnswer")}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {posts === null ? (
          <p className="text-sm text-ink-faint">{tc("loading")}</p>
        ) : posts.length === 0 ? (
          <Card className="bg-paper-soft text-center">
            <p className="text-sm text-ink-soft">
              {unanswered ? t("allAnswered") : t("noQuestions")}
            </p>
          </Card>
        ) : (
          posts.map((p) => <PostRowCard key={p.id} post={p} />)
        )}
      </div>

      <Card className="mt-6 bg-paper-soft">
        <h3 className="text-sm font-semibold text-ink">{t("goodAnswer")}</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
          <li>• {t.rich("good1", { b: (c) => <strong>{c}</strong> })}</li>
          <li>• {t.rich("good2", { b: (c) => <strong>{c}</strong> })}</li>
          <li>• {t.rich("good3", { link: (c) => <Link href="/badges" className="text-brand hover:underline">{c}</Link> })}</li>
        </ul>
      </Card>
    </section>
  );
}

function Composer({
  claimed,
  closet,
  onPosted,
}: {
  claimed: boolean | null;
  closet: ClosetPick[];
  onPosted: (id: string) => void;
}) {
  const t = useT("ask");
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>("HELP");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [knownGoodId, setKnownGoodId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const active = useMemo(() => POST_KINDS.find((k) => k.kind === kind)!, [kind]);
  const canSubmit = title.trim().length >= 8 && body.trim().length >= 15 && !saving;

  async function submit() {
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind,
        title: title.trim(),
        body: body.trim(),
        knownGoodId,
        productUrl: productUrl.trim() || null,
      }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setSaving(false);
    if (!res?.id) {
      setErr(res?.message ?? t("postFailed"));
      return;
    }
    onPosted(res.id);
  }

  if (claimed === false) {
    return (
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-brand-tint/40">
        <div>
          <p className="font-semibold text-ink">{t("claimTitle")}</p>
          <p className="mt-0.5 max-w-md text-sm text-ink-soft">{t("claimBody")}</p>
        </div>
        <Link
          href="/account"
          className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-black"
        >
          {t("claimAccount")}
        </Link>
      </Card>
    );
  }

  if (!open) {
    return (
      <div className="mt-6">
        <Button size="lg" onClick={() => setOpen(true)}>{t("askQuestion")}</Button>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-ink">{t("askQuestion")}</p>
        <button onClick={() => setOpen(false)} className="text-xs text-ink-faint hover:text-ink">{t("close")}</button>
      </div>

      {/* Kind first — it sets the reader's expectation and our example prompt. */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {POST_KINDS.map((k) => (
          <button
            key={k.kind}
            onClick={() => setKind(k.kind)}
            aria-pressed={kind === k.kind}
            className={`rounded-xl border p-3 text-left transition-colors ${
              kind === k.kind ? "border-ink bg-ink/[0.03]" : "border-line hover:border-ink/30"
            }`}
          >
            <span className="block text-sm font-medium text-ink">{t(`kind.${k.kind}.label`)}</span>
            <span className="mt-0.5 block text-xs text-ink-faint">{t(`kind.${k.kind}.hint`)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <Field label={t("question")} hint={t("questionHint")}>
          <input
            className={inputClass}
            value={title}
            maxLength={140}
            placeholder={t(`kind.${active.kind}.example`)}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label={t("details")} hint={t("detailsHint")}>
          <textarea
            className={inputClass + " min-h-[100px]"}
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <Field label={t("productLink")} hint={t("optional")}>
          <input
            className={inputClass}
            type="text"
            inputMode="url"
            value={productUrl}
            placeholder="brand.com/product/…"
            onChange={(e) => setProductUrl(e.target.value)}
          />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            {t("reference")} <span className="font-normal text-ink-faint">{t("referenceHint")}</span>
          </p>
          <ClosetAttachPicker closet={closet} value={knownGoodId} onChange={setKnownGoodId} />
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-bad">{err}</p>}

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={submit} disabled={!canSubmit}>{saving ? t("posting") : t("postQuestion")}</Button>
        <span className="text-xs text-ink-faint">{t("neverAttached")}</span>
      </div>
    </Card>
  );
}

function PostRowCard({ post }: { post: PostRow }) {
  const t = useT("ask");
  const tSocial = useT("social");
  const locale = useLocale();
  const people = usePeopleWords();
  return (
    <Link href={`/ask/${post.id}`} className="block">
      <Card className="!p-4 transition-shadow hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-paper-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft ring-1 ring-line">
            {KIND_FILTERS.includes(post.kind as PostKind) ? t(`filter.${post.kind as PostKind}`) : post.kind}
          </span>
          <span className={`flex-shrink-0 text-xs font-medium ${post.resolved ? "text-ok" : post.answerCount > 0 ? "text-ink-soft" : "text-brand"}`}>
            {post.resolved
              ? <><Check size={12} className="-mt-px inline" /> {t("answered")}</>
              : post.answerCount > 0
                ? t.n("answers", post.answerCount)
                : t("needsAnswer")}
          </span>
        </div>
        <p className="mt-1.5 font-medium text-ink">{post.title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{post.body}</p>
        {post.evidence && (
          <p className="mt-1.5 text-xs text-ink-faint">
            {t("receiptAttached")} <span className="text-ink-soft">{post.evidence.brand} · {tSocial("sizeN", { size: post.evidence.size })}</span>
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <Avatar src={post.author.avatarDataUrl} initials={(post.author.username ?? "?").slice(0, 2).toUpperCase()} size={18} ring={false} />
          {post.author.username}
          {post.author.bodyType && <span>· {people.build(post.author.bodyType)}</span>}
          <span>· {timeAgo(post.createdAt, Date.now(), locale)}</span>
        </div>
      </Card>
    </Link>
  );
}

