---
name: principle-no-brand-imagery
description: "Decision: no scraped brand logos in Fit Passport — text names + user photos only (legal)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-11T22:45:39.206Z
---

**Decision (2026-08-11): NO scraped brand logos, by default or otherwise.**

**Why:** Trademark law allows *nominative* reference — showing the brand NAME as plain text ("this is a Nike item") is fine. But displaying a brand's **logo** implies endorsement/affiliation (most brand guidelines forbid third-party logo use), and hotlinking/storing their image files adds copyright + bandwidth issues.

**How to apply:** In [[project-fit-passport-build-state]], brands are shown as **styled text**; item imagery is **user-uploaded photos of their own items only** (`KnownGoodItem.imageDataUrl`, client-resized). Only revisit with explicit per-brand permission or official affiliate/partner assets. Same rule for outfits.

**Related — image try-on:** Claude can't generate images. For photoreal try-on, recommended a dedicated **virtual-try-on API** (Google Vertex VTO / Kling-Kolors / FASHN.ai / Replicate IDM-VTON) for garment-on-body fidelity, or a cheaper text-to-image (Flux/SDXL/DALL·E) for a stylized model shot. `/api/tryon` + `lib/tryonImage.ts` are provider-agnostic and key-gated (`TRYON_API_URL`), default off → stylized SVG mannequin.
