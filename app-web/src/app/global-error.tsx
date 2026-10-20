"use client";

// When even the layout failed: no messages to read, so both languages, plainly.
// Reports the error's message to /api/event, like app/error.tsx.

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch("/api/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "client-error", detail: `global ${error.digest ?? ""} ${error.message}`.slice(0, 500), path: location.pathname }),
    }).catch(() => {});
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F3F3F1", color: "#17181c", textAlign: "center", padding: "80px 16px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600 }}>Something went wrong · 出了点问题</h1>
        <p style={{ marginTop: 12, color: "#4c4e57" }}>It has been reported. Try again. · 我们已收到报告，请再试一次。</p>
        <button onClick={reset} style={{ marginTop: 24, padding: "10px 20px", borderRadius: 999, border: 0, background: "#17181c", color: "#fff", cursor: "pointer" }}>
          Try again · 重试
        </button>
      </body>
    </html>
  );
}
