# Confirm production has the Redis rate limiter

**Needs:** someone with access to the Vercel project settings. Two minutes.

## Why

Session 78e made community status count only claimed accounts, and limited
account claims to **5 per network per hour**. That limit is real only with
Upstash Redis: without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, each
serverless instance keeps its own counter, and the real limit becomes 5 × however
many instances are warm.

Locally both variables are empty, and a live test there admitted **6** claims
across a dev recompile — the per-process counter reset. `docs/RESUME.md` says
production uses Upstash, but that was not re-checked in Session 78.

## What to do

Vercel → the project → Settings → Environment Variables → Production: confirm
both variables exist. (Only whether they exist — don't paste their values anywhere.)
If they're missing, the limiter code needs no change; add them and redeploy.
