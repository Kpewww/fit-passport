# Fit Passport

> One body. One fit identity. Any store.
> A consumer-owned fit layer for apparel — Fall 2026 CMU 49-800 Start Up Creation in Practice.

Team: Xiangchen Kong · Alyssa Qi   Instructor: Prof. Sheryl Root

## Repo layout

```
docs/
  proposals/    # Original PDFs (syllabus, official proposal form, detailed proposal)
  course/       # Course deliverables (project plan, weekly journal, BMC, interview guide, etc.)
app-web/        # The Next.js MVP (see app-web/README.md if present)
DEVLOG.md       # Chronological development log — feeds the Weekly Journal grade item
MEMORY.md       # Not committed — assistant's session memory index
```

## Quick start (MVP)

```bash
cd app-web
npm install
npx prisma db push
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run build      # production build
```

## What the MVP does today

1. **Onboarding** — build a Fit Passport (body info + preferred fit; every field optional).
2. **Closet** — add "known-good" garments that fit you well; these become anchors for the engine.
3. **Check a product** — paste a URL; extractor produces a normalized product; engine ranks every size with reasons.
4. **History** — record keep / return / exchange; those outcomes feed future recommendations.

The fit engine is a **transparent rule/score model** (not a black-box LLM) so we can evaluate and iterate on it. See `app-web/src/lib/fitEngine.ts` and `app-web/src/lib/fitEngine.test.ts`.

## Course-related deliverables

- Weekly Journal → [DEVLOG.md](DEVLOG.md)
- Project Plan → [docs/course/project-plan.md](docs/course/project-plan.md)
- Business Model Canvas → [docs/course/business-model-canvas.md](docs/course/business-model-canvas.md)
- Value Proposition Canvas → [docs/course/value-proposition-canvas.md](docs/course/value-proposition-canvas.md)
- Customer interview guide → [docs/course/interview-guide.md](docs/course/interview-guide.md)
- Risks & mitigations (incl. legal/governance) → [docs/course/risks-and-legal.md](docs/course/risks-and-legal.md)
