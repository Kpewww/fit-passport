"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function CommunityPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/u/${encodeURIComponent(code.trim())}`);
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold text-ink">Community</h1>
        <p className="mt-2 text-ink-soft">
          Fit is easier to trust when it comes from someone built like you. Enter a
          friend&apos;s account code to browse their closet, then use what fits them
          as a reference for your own sizing.
        </p>

        <Card className="mt-6">
          <form onSubmit={go} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Account code">
                <input className={inputClass} value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FP-XXXX-XXXX-XXXXX" />
              </Field>
            </div>
            <Button type="submit" disabled={!code.trim()}>View closet</Button>
          </form>
        </Card>

        <Card className="mt-6 bg-neutral-50">
          <h2 className="text-sm font-semibold text-ink">How sharing works</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            <li>• Anyone with your <strong>account code</strong> can view your closet — read only.</li>
            <li>• Editing needs your <strong>password</strong>. Your code alone can&apos;t change anything.</li>
            <li>• Precise body measurements are <strong>never</strong> shared — only a coarse body type, and only if you opt in.</li>
            <li>• A public directory of closets is coming later, and will be strictly opt-in.</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
