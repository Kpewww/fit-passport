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
