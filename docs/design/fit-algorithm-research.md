# Fit Algorithm Research & Upgrade Plan

> **Purpose.** Survey how existing apparel **size-recommendation** and **virtual
> try-on** systems work — commercial products, academic papers, and (intended)
> Chinese-market channels — and translate the findings into concrete upgrades for
> Fit Passport's **transparent, rule/score** fit engine.
>
> **Method / honesty note.** Compiled 2026-08-20 from focused web research. Vendor
> performance numbers are self-reported marketing and are **not independently
> verified**. General search was rate-limited, so findings come from directly
> fetched authoritative pages (vendor sites, arXiv, ACM abstracts). The
> **Chinese-channel survey (Taobao/Tmall/得物/京东) did not complete** and is a
> known gap (see §5). Sources are listed at the end.

---

## 1. The single most important finding

**Every mainstream image-based virtual try-on system transfers _appearance_, not
_fit_.** GAN and diffusion methods alike (VITON → CP-VTON → VITON-HD → HR-VITON →
TryOnDiffusion → OOTDiffusion / IDM-VTON / StableVITON) warp a garment so it *looks*
natural on a body; none predict whether a given **size** would be tight, correct, or
loose on that person's measurements. Google's own TryOnDiffusion project page states
it verbatim:

> "we don't promise fit and for now focus only on visualization of the try on."

Google's consumer **Doppl** app carries an explicit disclaimer that "fit, appearance
and clothing details may not always be accurate." The only work that models true fit
is a small, separate line (ClothFit, FIT, FitVTON, Size-Variable VTO, SiCo) that
relies on **3D/physics simulation or explicit measurements**, not 2D image synthesis.

**Implication for us.** Our measurement-based, explainable fit engine is doing the
thing the flashy VTO systems explicitly *don't*. This is a genuine differentiator, and
it means: **keep size recommendation separate from any try-on visual** — a try-on
image is a marketing/visualization layer, never the fit decision. (This also reaffirms
our no-scraped-imagery stance: we don't need their images to do our core job.)

---

## 2. How commercial size-recommendation products work

Four mechanism families emerged. All figures are vendor self-reported.

| Family | Who | How | Claimed results |
|---|---|---|---|
| **Purchase/return collaborative signal** | True Fit, Fit Analytics, Secret Sauce "Fit Predictor", Amazon | Aggregate keep/return outcomes across shoppers & brands; recommend the size most-likely-kept. Mostly passive (no measurements). | True Fit: up to **−40%** fit returns, +1–2% conversion. Fit Analytics: **+4–6%** conversion, **−2–4%** returns. |
| **Reference-garment comparison** | Virtusize, Secret Sauce (survey) | "Pick a garment you already own & love"; compare its construction/size to the target. | Virtusize: **−20%** returns (client-dependent). |
| **Predicted body model from few inputs** | Bold Metrics, EyeFitU, Sizebay | 4–6 simple inputs (height/weight/age…) → 50+ predicted measurements → size per style. No scan. | Bold Metrics: "tailor-level" (no %). EyeFitU: −35–55% returns (range). |
| **Photo / 3D body scan** | 3DLOOK, (Amazon "Made for You", historical) | 2 phone photos → 80+ measurements via CV + parametric body model. | 3DLOOK: **96–97%** measurement accuracy; up to −20% returns. |

**What this tells us.**
- The **reference-garment** family is *exactly our closet anchor* ("a garment you own
  that fits") — validated as a leading commercial approach. We already do this and can
  lean into it harder.
- The **purchase/return** family is *exactly our outcome + brand-bias learning*. Also
  validated. Its power is entirely a function of scale — a cold-start weakness for us,
  which is why the measurement path must be strong on day one.
- None of the leaders are a black box the user can't question — but none *explain* the
  way we do either. **Explainability is our wedge; the mechanisms are otherwise
  industry-standard**, so we're not doing anything naive.

---

## 3. Academic size/fit models (the useful theory)

Two lineages, both worth borrowing from **conceptually** while keeping our engine
transparent:

**(a) Latent "true size" + ordinal fit** — Amazon (Sembium et al., RecSys 2017; WWW
2018 Bayesian) and Zalando (Guigourès et al., RecSys 2018).
- Fit is modeled as a function of the **difference between a customer's latent size and
  a product's latent size**, classified into an **ordinal {Small, Fit, Large}**.
- Zalando keeps **size continuous** and factors `p(size,return) = p(size|return)·p(return)`;
  crucially, a **return-shift term η** moves the size distribution: `η_small ~ N(−1,1)`,
  `η_big ~ N(+1,1)`. **This is precisely our per-user brand-bias / outcome learning** —
  the literature independently arrives at the same "returns shift the target size by ±1"
  idea we already ship. Strong validation.
- Recommendation rule: **recommend the size with the highest probability of being kept.**
- Cold start handled with **brand/category priors** (a new article inherits its brand's
  and category's historical fit behavior).

**(b) Representation / deep models** — Misra-Wan-McAuley (RecSys 2018, the ModCloth /
RentTheRunway datasets), Zalando SFnet (RecSys 2019), eBay PreSizE (SIGIR 2021, a
Transformer over purchase history), Zalando SizeNet (image-based, for new-article cold
start).
- Misra adds **monotonicity constraints** (a bigger catalog size must score "larger")
  and handles the **"Fit"-label imbalance** with metric learning — most transactions
  are "fit", so naive accuracy is misleading.
- Notably, the **production deep systems (SFnet, PreSizE) deliberately reject
  ordinality**, arguing size *labels* are incompatible across brands (an M is not an M).
  **We sidestep this entirely by scoring in centimetres, not labels** — a real
  structural advantage of the measurement-first design.

**Adoptable ideas (kept transparent):** ordinal fit **verdict** per size
(too-small/snug/true/relaxed/too-big) from the signed body-vs-garment delta;
**monotonicity** as a sanity check; **brand/category priors** for cold start;
**recommend-most-likely-kept** framing for confidence.

---

## 4. What we will change in the engine (grounded in the above)

Prioritised impact-vs-effort for a solo build. Each stays transparent and testable.

1. **Multi-dimensional measurement fit (chest + waist + shoulder), not chest-only.**
   *Today the engine scores only chest.* A shirt can match the chest yet fail at the
   shoulders. Score each available dimension with the same soft Gaussian, combine
   (chest-dominant), and **name the binding constraint** in the reason. Biggest
   correctness gain; fully explainable. *(Academic: fit is multi-measurement.)*
2. **Use the retailer's body-measurement range when the chart provides it.** Charts
   like Levi's give a **body** chest min–max per size — the retailer's own intended
   fit. When present, score by in-range membership instead of guessing ease against the
   garment chest. *(Was parsed but unused.)*
3. **Garment-aware ease.** Ease target depends on garment type, not just preference —
   a puffer needs layering room a tee doesn't. Additive per-category adjustment on top
   of the preference ease. *(Physical-fit literature; common sense.)*
4. **Per-size ordinal fit verdict.** Expose too-small / snug / true-to-size / relaxed /
   too-big from the signed delta. User-facing and directly from the ordinal literature.
5. **Confidence reflects the margin.** Drop confidence when the top two sizes are
   near-tied (genuine ambiguity), not just when data is missing. *(Recommend-most-
   likely-kept ⇒ confidence should track how decisive that pick is.)*

Deliberately **NOT** doing: a learned latent-factor model (kills explainability, needs
scale we don't have), or an image/VTO fit model (the whole field says image ≠ fit).

---

## 5. Known gaps / to verify later

- **Chinese channels (Taobao/Tmall 尺码助手, 得物, 京东, SHEIN) not surveyed** — the
  sub-agent didn't complete. Our size-table parser already handles Chinese headers
  (胸围/腰围/肩宽/袖长), so the extraction side is prepared; the *recommendation
  mechanisms* of these platforms remain unresearched.
- All vendor accuracy/return numbers are **self-reported**; several vendors' own pages
  are internally inconsistent (True Fit, Virtusize). No third-party benchmark obtained.
- Two fit-aware VTO arXiv IDs (FIT 2604.*, FitVTON 2606.*) imply 2026 submissions and
  were **not independently verified**.

---

## Sources
**Commercial:** truefit.com, fitanalytics.com, virtusize.com, sizebay.com,
boldmetrics.com, 3dlook.ai, eyefitu.com, secretsaucepartners.com. (Amazon fit pages
404'd; covered from prior knowledge, unverified.)
**Academic (arXiv / ACM):** Sembium et al. "Recommending Product Sizes to Customers"
(RecSys 2017); Sembium et al. "Bayesian Models for Product Size Recommendations" (WWW
2018); Guigourès et al. "A Hierarchical Bayesian Model for Size Recommendation in
Fashion" (1908.00825, RecSys 2018); Misra-Wan-McAuley "Decomposing Fit Semantics"
(RecSys 2018); Sheikh et al. SFnet (1907.09844, RecSys 2019); Eshel et al. PreSizE
(2105.01564, SIGIR 2021); Karessli et al. SizeNet (1905.11784, CVPR-W 2019).
**VTO:** VITON (1711.08447), CP-VTON (1807.07688), VITON-HD (2103.16874), HR-VITON
(2206.14180), TryOnDiffusion (2306.08276 + tryondiffusion.github.io), StableVITON
(2312.01725), OOTDiffusion (2403.01779), IDM-VTON (2403.05139), Diffuse-to-Choose
(2401.13795); Google Shopping try-on & Doppl (blog.google).
