# Identity & Sharing — Design + Threat Model (draft)

Status: proposal / under discussion (2026-08-10). Addresses the standing "legal &
governance" concern.

## The idea (as proposed by the founder)

- Sign up by adding 3 known-good clothes → receive an **account code**.
- Optionally set a **password**.
- **Anyone with the account code can VIEW** that account's closet (read-only).
- **Editing requires the password** (password = login).
- Account = { account code, username, password }.
- When someone uses a code, the UI shows "you're viewing {username}'s closet".
- Export permission is a per-account toggle: (1) anyone with the code may export,
  or (2) only the password holder.
- A **community** where people share their codes to let others browse closets.

## Concept correction: capability + credential, not PKI

This is NOT public/private-key cryptography. It is:

- **account code = bearer capability for READ** (whoever holds it can read),
- **password = credential for WRITE**.

The public/private-key *intuition* (public shareable identifier + private control)
is right, but the implementation is a capability + a password. Consequence: a
bearer code **cannot be revoked** the way a key pair can be rotated. Once shared,
treat it as permanently public. (A true PKI version — code = public key, edits
signed by a private key held in the browser — is a possible future "vision"
that would let the server be zero-trust, but it's heavier and out of MVP scope.)

## Threat model (prioritized)

### A. Body-measurement privacy — HIGHEST
The FitProfile holds chest/waist/height/weight — sensitive personal data. If
"anyone with the code can read the account" and codes are shared publicly, body
data can leak.
- **Mitigation (core design rule): split the shareable CLOSET from the private
  BODY PROFILE.** A shared code exposes closet items (brand/category/size/
  fit-rating/notes) only. Raw body measurements are NEVER exposed by code unless
  the owner explicitly opts in. Default: OFF.

### B. Account code is a bearer token
Codes travel in URLs, history, screenshots, chats. No true revocation.
- High-entropy random codes (≥128-bit), never sequential (else enumerable).
- Offer "rotate code" as an escape hatch (invalidates old shared links).
- Rate-limit code lookups to slow scraping.

### C. Optional password = write-authorization hole
If no password is set, who can edit? Nobody, or everybody — both wrong.
- Require a password at creation (the "private key"), OR issue a one-time
  recovery code.
- Hash with bcrypt/argon2. Never store or log plaintext. HTTPS only.

### D. No email = no recovery
- Issue a recovery code at signup ("write this down"). Lost password + lost
  recovery = locked out (but data stays public → a data-subject problem).

### E. Community = publishing a dataset
World-readable codes listed in a community = the whole set is scrapeable.
- Separate "share by code with a friend" from "list publicly in community."
- Community listing is explicit opt-in; consider requiring an account to browse;
  rate-limit.

### F. Right-to-delete / copies / minors
Export + public read → others can copy; deleting the origin doesn't recall copies.
- UI must disclose "shared/exported data can't be recalled."
- GDPR/CPRA delete-right implications. Minors' body data is extra-sensitive:
  consider 18+ gate or no body data for minors.
- Default export = password holder only; "anyone-with-code export" is an
  explicit high-risk opt-in.

### G. Impersonation
Usernames shown on code access → squatting ("Nike Official").
- Show username + a short code fingerprint; reserve/verify later.

### H. Community moderation
User-generated public content needs a report/abuse path (later, but noted).

## Safe defaults (summary)
1. Code exposes CLOSET only; body profile private unless opted in.
2. Password required at creation; hashed (bcrypt/argon2); recovery code issued.
3. Community listing is opt-in and separate from private code-sharing.
4. Export defaults to password-holder-only.
5. Codes are high-entropy and rotatable; lookups rate-limited.
6. Disclose non-recall of shared/exported data.

## Suggested phasing
- **Phase 1 (identity MVP):** code + required password + read-by-code /
  write-by-password + closet/profile split + safe defaults. No community yet.
- **Phase 2 (organization):** categories (default + user-editable, rename/move/
  order), tags, colors, per-item ordering, merge same-garment variants
  (Garment → Variant[size,color]). Schema migration; independent of auth.
- **Phase 3 (community):** opt-in public profiles, browse/search by code,
  moderation + reporting.

## Data-model implications (rough)
- `User` gains: `accountCode` (unique, indexed, high-entropy), `passwordHash`,
  `recoveryHash`, `shareBodyProfile` (bool, default false),
  `exportPolicy` ("owner" | "anyone"), `communityPublic` (bool, default false).
- Sessions/write-auth: a signed cookie/token issued on password login.
- Phase 2: `Category` (userId, name, sortIndex), KnownGoodItem gains
  `categoryId?`, `colorTag?`, `sortIndex`, and a `Garment`/`Variant` split for
  merged same-item different size/color.
