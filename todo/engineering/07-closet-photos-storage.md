# Move closet photos out of the database

**Not urgent for the prototype — a recorded founder decision. Do it before
inviting a real cohort.**

## The wall

Closet photos are stored as base64 data URLs in Postgres, about **90 KB per photo
in a row**, and `/api/closet` returns them inline.

Neon's free tier is 0.5 GB — roughly **340 users with ten photos each** — and then
writes start failing for **everyone**, not just the heavy users. It arrives long
before LLM cost matters.

## The fix

Object storage (Vercel Blob or S3); rows keep a URL. Not hard, just not yet
scheduled.

## Trigger

Before the first real cohort is invited — not after.

## Built — Session 100d (2026-10-20)

`lib/photoStore.ts`:
- With `BLOB_READ_WRITE_TOKEN` set, a new photo goes to Vercel Blob, and the row keeps
  `blob:<url>`.
- The browser gets `/api/closet/photo/<id>`, which checks the owner. Blob files are
  public by address, so the address never leaves the server.
- Replaced and deleted photos are removed from the store.

Old photos move with `scripts/photos-to-blob.mjs`: a dry run first, then `--apply`.

**Waiting for the founder (`todo/people/08-blob-store.md`):**
1. Create the store in Vercel; that sets the token.
2. Redeploy.
3. Run the script.

