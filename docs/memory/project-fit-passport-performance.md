---
name: project-fit-passport-performance
description: "Fit Passport rendering-performance rules — what made the app heavy, what was removed, and the traps to not re-introduce"
metadata: 
  node_type: memory
  type: project
  originSessionId: a5a32dc1-574a-4a47-b97d-7385708796b6
  modified: 2026-08-25T02:31:23.539Z
---

Hard-won performance findings for [[project-fit-passport]], from Session 42 (2026-08-25). These are **not** obvious from the code, and two of them were reintroduced-then-caught in the same session.

**The founder's machine matters, and it is a real confound.** The app was designed on a **Mac** and felt fine there; on the **Windows 11 machine** () the same production build ran heavy (~800MB tab). macOS's compositor + unified memory absorb high composited-layer counts that a Windows integrated-GPU path does not. So *"it used to be smooth locally"* compares two different computers — never accept that as evidence the server or a recent commit is at fault.

**It was never the server.** Measured: warm production latency `/` 76–248ms, `/api/status` ~310ms, `/api/community` ~196ms. The only server-side penalty is Neon free-tier autosuspend, **~852ms on the first request after ~6min idle** (measured). Before a live demo, just hit the site a few times to wake it; keeping Neon warm 24/7 would exceed the free plan's 100 CU-hours.

**Four causes, in the order they actually mattered:**
1. **React state per `pointermove`.** `MetalCard` (and again `BadgeCoin`) called `setState` in the move handler → full subtree re-render 60–120×/sec, plus a `getBoundingClientRect` each move = read-layout/write-state/re-render thrash. **Rule: pointer-driven visuals write CSS custom properties to the DOM via ref, rAF-coalesced, with the rect measured once on enter.** Never `setState` per move.
2. **Leaked WebGL contexts.** `renderer.dispose()` does **NOT** release the context — `renderer.forceContextLoss()` is required. Without it every True-3D badge inspect leaked a context; Chrome caps ~16 and holds GPU memory until eviction. **Symptom: the whole tab gets heavier the more you navigate, with no error anywhere.**
3. **Lenis smooth-scroll — REMOVED, do not re-add casually.** It was the amplifier, not a cost of its own: native scroll runs on the compositor, Lenis moves it to a main-thread rAF loop whose synthetic scroll events made all four `useScroll` sections re-measure (~16 transforms/frame), continuing ~20 frames after input stopped at `lerp: 0.1`. `will-change` does nothing for layout thrash — that's why the first fix attempt failed. Its removal also fixed the nested horizontal scroller hitch (`data-lenis-prevent` existed only to stop Lenis fighting it).
4. **Badge dimensionality — a DESIGN cost, now flattened by founder decision.** Per badge: up to 12 rim slices inside `preserve-3d` (each its own layer) + a face SVG with **18 gradients + 2 filters** (one `feDropShadow` = offscreen blur buffer). `/badges` renders 20 → ~140 layers, 40 filter passes, textures 4× CSS area at DPR 2.

**How badges work now:** `BadgeCoin` has a `dimensional` prop, **default FALSE** = flat medallion SVG (no 3D context, rim stack, back face, or pointer state). Dimensional survives only in `BadgeInspect` (one badge at a time). **`MetalCard` is deliberately untouched and stays lavish** — the founder's call: "flat everywhere except the card". Restoring dimensional badges later = flip the default, or pass the prop per call site, once they get a redesign.

**Cheap wins worth reusing:** `content-visibility: auto` + `contain-intrinsic-size` on repeated heavy blocks (badge tracks); replace `filter: brightness()` with a flat black overlay gradient (a CSS filter costs a layer **and** a buffer); promote with `will-change: transform` **only while interacting**, and **alone** — never with `translateZ(0)` on a framer-motion element, which composes `transform` itself and will fight for the property.

See [[project-fit-passport-design-system]] for the visual system these costs come from, and `DEVLOG.md` Session 41–42 for the full write-up.
