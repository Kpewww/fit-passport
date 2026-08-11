// Email sending — real delivery via Resend when configured, else a dev fallback.
//
// Cheapest sensible provider for a student/beta project: Resend (free tier ~3,000
// emails/month, simple REST API, no SDK needed). Set RESEND_API_KEY + EMAIL_FROM
// to enable. When unset, `sendEmail` returns { sent:false, devLink } so the
// caller can surface the link on-screen (fine for local/beta; NEVER relied on in
// production — the reset route only reveals the link when email is unconfigured).

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!emailConfigured()) return { sent: false, error: "email not configured" };
  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!r.ok) return { sent: false, error: `resend ${r.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

export function resetEmailHtml(link: string): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#111">Reset your Fit Passport password</h2>
      <p style="color:#444">Click the button below to set a new password. This link
      expires in 30 minutes. If you didn't request this, you can ignore it.</p>
      <p><a href="${link}" style="display:inline-block;background:#6d4aff;color:#fff;
      padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">
      Set a new password</a></p>
      <p style="color:#888;font-size:12px">Or paste this link:<br>${link}</p>
    </div>`;
}
