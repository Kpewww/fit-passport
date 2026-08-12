"use client";

// One question thread. The asker can accept an answer; anyone can vote an answer
// helpful; claimed members can answer with a garment from their own closet
// attached as evidence.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Field, LinkButton, inputClass } from "@/components/ui";
import { Avatar } from "@/components/Badges";
import {
  ClosetAttachPicker,
  EvidenceCard,
  type ClosetPick,
  type EvidenceView,
} from "@/components/Evidence";
import { postKindLabel } from "@/lib/posts";
import { timeAgo } from "@/lib/timeAgo";

type Author = {
  username: string | null;
  accountCode: string | null;
  avatarDataUrl: string | null;
  bodyType: string | null;
};

type Thread = {
  post: {
    id: string;
    kind: string;
    title: string;
    body: string;
    productUrl: string | null;
    createdAt: string;
    resolvedAnswerId: string | null;
    mine: boolean;
    author: Author;
    evidence: EvidenceView | null;
  };
  answers: Array<{
    id: string;
    body: string;
    createdAt: string;
    helpfulCount: number;
    votedByMe: boolean;
    mine: boolean;
    accepted: boolean;
    author: Author;
    evidence: EvidenceView | null;
  }>;
};

export default function ThreadPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [data, setData] = useState<Thread | null>(null);
  const [gone, setGone] = useState(false);
  const [claimed, setClaimed] = useState<boolean | null>(null);
  const [closet, setCloset] = useState<ClosetPick[]>([]);

  const load = useCallback(() => {
    fetch(`/api/posts/${encodeURIComponent(id)}`)
      .then((r) => {
        if (!r.ok) throw new Error("gone");
        return r.json();
      })
      .then(setData)
      .catch(() => setGone(true));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then((s) => setClaimed(!!s.claimed)).catch(() => setClaimed(false));
    fetch("/api/closet").then((r) => r.json()).then((d) => setCloset(d.items ?? [])).catch(() => {});
  }, []);

  async function accept(answerId: string | null) {
    await fetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resolvedAnswerId: answerId }),
    }).catch(() => {});
    load();
  }

  async function removePost() {
    await fetch(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    router.push("/ask");
  }

  if (gone) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <EmptyState
            title="That question is gone"
            body="It may have been deleted, or its author deactivated their account."
            action={<LinkButton href="/ask">Back to questions</LinkButton>}
          />
        </div>
      </main>
    );
  }

  if (!data) {
    return <main className="flex-1"><div className="mx-auto max-w-2xl px-6 py-14 text-ink-faint">Loading…</div></main>;
  }

  const { post, answers } = data;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs text-ink-faint">
          <Link href="/ask" className="hover:underline">← All questions</Link>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-paper-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft ring-1 ring-line">
            {postKindLabel(post.kind)}
          </span>
          {post.resolvedAnswerId && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-800">
              Answered
            </span>
          )}
        </div>

        <h1 className="mt-2 font-serif text-3xl leading-tight text-ink">{post.title}</h1>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <Avatar src={post.author.avatarDataUrl} initials={(post.author.username ?? "?").slice(0, 2).toUpperCase()} size={20} ring={false} />
          {post.author.accountCode ? (
            <Link href={`/u/${encodeURIComponent(post.author.accountCode)}`} className="hover:text-ink hover:underline">
              {post.author.username}
            </Link>
          ) : (
            post.author.username
          )}
          {post.author.bodyType && <span>· {post.author.bodyType} build</span>}
          <span>· {timeAgo(post.createdAt)}</span>
          {post.mine && (
            <button onClick={removePost} className="ml-2 hover:text-red-600">Delete</button>
          )}
        </div>

        <p className="mt-4 whitespace-pre-wrap text-ink-soft">{post.body}</p>

        {post.productUrl && (
          <p className="mt-3 text-sm">
            <a
              href={post.productUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-brand hover:underline"
            >
              The product in question ↗
            </a>
          </p>
        )}

        {post.evidence && (
          <div className="mt-4 max-w-md">
            <EvidenceCard ev={post.evidence} label="Their reference garment" />
          </div>
        )}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-widest text-ink-soft">
          {answers.length === 0 ? "No answers yet" : `${answers.length} answer${answers.length === 1 ? "" : "s"}`}
        </h2>

        <div className="mt-3 space-y-3">
          {answers.map((a) => (
            <AnswerCard
              key={a.id}
              answer={a}
              askerIsMe={post.mine}
              onAccept={() => accept(a.accepted ? null : a.id)}
              onChange={load}
            />
          ))}
        </div>

        <AnswerComposer
          postId={post.id}
          claimed={claimed}
          closet={closet}
          onPosted={load}
        />
      </div>
    </main>
  );
}

function AnswerCard({
  answer,
  askerIsMe,
  onAccept,
  onChange,
}: {
  answer: Thread["answers"][number];
  askerIsMe: boolean;
  onAccept: () => void;
  onChange: () => void;
}) {
  const [voted, setVoted] = useState(answer.votedByMe);
  const [count, setCount] = useState(answer.helpfulCount);

  async function vote() {
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    const r = await fetch("/api/answers/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answerId: answer.id, helpful: next }),
    })
      .then((r) => r.json())
      .catch(() => null);
    if (!r || r.error) {
      setVoted(!next);
      setCount((c) => c + (next ? -1 : 1));
      return;
    }
    setCount(r.helpfulCount);
    setVoted(!!r.votedByMe);
  }

  async function remove() {
    await fetch(`/api/answers?id=${encodeURIComponent(answer.id)}`, { method: "DELETE" }).catch(() => {});
    onChange();
  }

  return (
    <Card className={`!p-4 ${answer.accepted ? "ring-2 ring-green-500/60" : ""}`}>
      {answer.accepted && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-green-700">
          ✓ Accepted by the asker
        </p>
      )}
      <p className="whitespace-pre-wrap text-sm text-ink">{answer.body}</p>

      {answer.evidence && (
        <div className="mt-3 max-w-md">
          <EvidenceCard ev={answer.evidence} label="From their closet" />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <Avatar src={answer.author.avatarDataUrl} initials={(answer.author.username ?? "?").slice(0, 2).toUpperCase()} size={18} ring={false} />
          {answer.author.accountCode ? (
            <Link href={`/u/${encodeURIComponent(answer.author.accountCode)}`} className="hover:text-ink hover:underline">
              {answer.author.username}
            </Link>
          ) : (
            answer.author.username
          )}
          {answer.author.bodyType && <span>· {answer.author.bodyType} build</span>}
        </span>
        <span>{timeAgo(answer.createdAt)}</span>
        {answer.mine && <button onClick={remove} className="hover:text-red-600">Delete</button>}

        <span className="ml-auto flex items-center gap-2">
          {askerIsMe && (
            <button
              onClick={onAccept}
              className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${
                answer.accepted
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-line bg-white text-ink-soft hover:border-green-600 hover:text-green-700"
              }`}
            >
              {answer.accepted ? "Accepted" : "Mark as the answer"}
            </button>
          )}
          {/* No self-voting — the server rejects it, so don't offer it. */}
          {!answer.mine && (
            <button
              onClick={vote}
              className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${
                voted ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              {voted ? "Helpful" : "Helpful?"} {count > 0 ? count : ""}
            </button>
          )}
          {answer.mine && count > 0 && <span>{count} found this helpful</span>}
        </span>
      </div>
    </Card>
  );
}

function AnswerComposer({
  postId,
  claimed,
  closet,
  onPosted,
}: {
  postId: string;
  claimed: boolean | null;
  closet: ClosetPick[];
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [knownGoodId, setKnownGoodId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (claimed === false) {
    return (
      <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-brand-tint/40">
        <p className="max-w-md text-sm text-ink-soft">
          <strong className="text-ink">Know the answer?</strong> Claim an account to
          reply — it&apos;s what lets you attach a garment you own as proof, and it&apos;s
          how the Counsel badges are earned.
        </p>
        <Link
          href="/account"
          className="whitespace-nowrap rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Claim account
        </Link>
      </Card>
    );
  }

  async function submit() {
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ postId, body: body.trim(), knownGoodId }),
    })
      .then((r) => r.json())
      .catch(() => null);
    setSaving(false);
    if (!res?.id) {
      setErr(res?.message ?? "Couldn't post that answer. Try again.");
      return;
    }
    setBody("");
    setKnownGoodId(null);
    onPosted();
  }

  return (
    <Card className="mt-6">
      <p className="font-semibold text-ink">Your answer</p>
      <div className="mt-3 space-y-3">
        <Field label="What would you tell them?" hint="Where it sat wrong matters more than the size">
          <textarea
            className={inputClass + " min-h-[90px]"}
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">
            Back it up <span className="font-normal text-ink-faint">— attach the garment you&apos;re talking about</span>
          </p>
          <ClosetAttachPicker closet={closet} value={knownGoodId} onChange={setKnownGoodId} />
        </div>
      </div>
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      <div className="mt-4">
        <Button onClick={submit} disabled={body.trim().length < 10 || saving}>
          {saving ? "Posting…" : "Post answer"}
        </Button>
      </div>
    </Card>
  );
}
