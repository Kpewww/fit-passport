---
name: project-identity-sharing-idea
description: "Fit Passport's proposed code-based identity + closet-sharing + community direction"
metadata: 
  node_type: memory
  type: project
  originSessionId: ff70f30d-84e1-4230-9852-546155e0d6ff
  modified: 2026-08-11T18:19:40.062Z
---

Founder proposed (2026-08-10) a novel auth/sharing model for [[project-fit-passport]]:
- Sign up by adding 3 known-good clothes → get an **account code**; optionally set a **password**.
- **Anyone with the code can VIEW** the closet (read-only); **editing requires the password** (password = login).
- Account = {account code, username, password}. Viewer sees "you're viewing {username}'s closet".
- Export toggle: (1) anyone-with-code, or (2) password-holder-only.
- A **community** to share codes and browse each other's closets (find clothes based on someone with your body/taste).

**Concept note:** this is capability(read) + credential(write), NOT true public/private-key crypto. Bearer code can't be revoked like a key pair — treat as permanently public once shared.

**Key risks flagged (full write-up: docs/design/identity-and-sharing.md):**
1. Body-measurement privacy (HIGHEST; = Prof. Root's governance concern). → Split shareable CLOSET from private BODY PROFILE; body data never exposed by code unless opt-in (default off).
2. Code = bearer token → must be high-entropy, rotatable, rate-limited.
3. Optional password = write-auth hole → require password at creation; hash with bcrypt/argon2, never plaintext.
4. No email = no recovery → issue recovery code.
5. Community = publishing a dataset → opt-in, separate from private code-share.
6. Delete-right/copies/minors → disclose non-recall; default export = owner-only; consider 18+ for body data.

**Suggested phasing:** P1 identity MVP (code+password+closet/profile split, no community) → P2 closet organization (categories/tags/colors/order + Garment→Variant merge) → P3 community.

This is a strong course angle: doing the threat model proactively is an ASSET for the governance grade.

**IMPLEMENTED (as of 2026-08-11, see [[project-fit-passport-build-state]]):** P1 + P2 shipped. Login by username OR account code. **Recovery code was REMOVED** (user found it clunky) → recovery now = identifier + matching email (no real email sending yet — verifies match only; must become real token flow before prod). Community page exists (enter code to view). Privacy invariant enforced: code viewers see closet + coarse sex/shopsFor/bodyType, never precise measurements. Still deferred: rate-limiting, accountCode rotation, code-based export button, real email delivery.
