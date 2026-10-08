# 3D try-on

**Asked by the founder, 2026-10-08 (Session 95):** add 3D try-on to the to-do list, and
explore how it could be built first. This file is that exploration. Nothing is built.
Choosing a path is a founder decision (end of file).

## What exists today

- `/outfits` shows a **stylized SVG mannequin** wearing the chosen garment types and
  colours, and a **"photoreal preview"** button. The button calls `/api/tryon`, which
  generates an image only when an image-generation key is set (`lib/tryonImage.ts`).
  It sends a coarse body descriptor and **never sends measurements** (the route's own
  comment). Without a key the button keeps the stylized view.
- `three` (0.169) is already a dependency (the 3D badges), so a browser 3D view adds
  no new library.
- The engine already computes, per size, **garment minus body** for chest, waist, hip
  and shoulder (the ease it scores with, `fitEngine.ts`). That number is what a fit
  view would show.

## The one product question

A try-on helps Fit Passport only if it shows **fit**: that M is snug across the chest
and L is roomy, on this person. A picture that only shows the **look** does not answer
"which size", and if it draws every size fitting perfectly, it suggests something the
engine did not say. That runs against "recommendations are explained, never guessed at
silently". So the paths below are ranked by whether they show size, not by how real
they look.

## Four paths

### A. A fit map on a measured mannequin, in the browser (recommended first)

- **Body:** built from the passport's numbers. The simplest version is a lofted body:
  ellipses at chest, waist, hip and shoulder height, sized from the measurements and
  joined. It needs no third-party model, and it is fully explainable, since every
  contour is one of the user's numbers.
  - A more realistic body could come from **Anny** (NAVER LABS Europe). It is a
    parametric human model for all ages, released under **Apache 2.0** with no gated
    download. Its sliders are age, height, weight and muscle; chest and waist are not
    among them. Code is at https://github.com/naver/anny. It would have to be baked
    offline into glTF morph targets for three.js; the page mentions no glTF or web
    export (UNVERIFIED whether that is straightforward).
- **Garment:** a shell around the body, at the size chart's own measurements for the
  chosen size. Switching S, M and L changes the shell.
- **Colour:** each zone coloured by the engine's ease: tight, just right or roomy,
  with the centimetres on hover. This is the same idea as CLO's Fit Map ("Can't Wear"
  red, "Very Tight" orange, "Tight" yellow), but driven by our numbers.
- **No cloth simulation.** It shows fit, not drape.
- Cost: engineering only; no runtime cost. Fits the privacy rule, since the body never
  leaves the page.

### B. Draped garments from sewing patterns, server-side (later)

- **GarmentCode** (ETH Zürich) programs parametric sewing patterns; its code is **MIT**
  (papers and dataset CC BY-SA 4.0). GarmentCodeData drapes them with an open XPBD
  simulator built on **NVIDIA Warp**.
- Warp's documentation states **Apache 2.0**. A secondary source dates the switch to
  v1.6.2 (March 2025), and earlier releases had an NVIDIA licence (UNVERIFIED: check the
  LICENSE file before relying on it).
- How it would work: grade a pattern to the chart's measurements per size, drape it on
  the user's body, and render an image or export a mesh. Tees, shirts and trousers
  first.
- Cost: needs a GPU worker and per-request compute, plus real 3D engineering.

### C. Real-time cloth in the browser (not now)

- No open project combines XPBD, WebGPU, three.js and garment-on-avatar draping. The
  parts exist separately:
  - a WebGPU XPBD cloth demo (jspdown/cloth);
  - the three.js WebGPU compute cloth example (Verlet);
  - a 2025 paper reporting 60 fps for mass-spring cloth on WebGPU.
- A course brief sets 30 fps on integrated graphics as the bar, which is where WebGPU
  struggles.
- High risk for a small team.

### D. Photoreal 2D try-on images (look only, optional)

- Hosted **FASHN API**: its terms allow commercial use of the results. About
  **US$0.075 per image** on-demand (1 credit for v1.6; Try-On Max costs 4).
- The open models **CatVTON** and **IDM-VTON** are **CC BY-NC-SA 4.0**, non-commercial,
  and so are the common training sets (VITON-HD, DressCode). They are not usable here
  without a separate licence.
- These models do not take garment measurements, so they cannot show size. If used,
  label them "how it looks, not how it fits", next to the fit map, never instead of it.

### Not recommended

- **SMPL / SMPL-X:** the licence is non-commercial; commercial use is licensed through
  Meshcapade.
- **Body-scan and fit vendors** (3DLOOK two-photo scan, WEARFITS fit heatmaps, The
  Fitting Room): buying instead of building means a vendor holds users' bodies, against
  "precise measurements never leave your account". Revisit only with that answered.
- **CLO / Browzwear / Style3D:** desktop design tools; no public web SDK for their fit
  maps was found.

## Suggested order

1. **A** on `/check` and `/outfits`:
   - a lofted body from the passport;
   - a shell per size, coloured by the engine's ease, sized from the chart's
     measurements;
   - a pixel test that the colours match the engine's verdicts.
2. Then decide between B (drape) and D (looks), with what A taught.

## Decisions for the founder

- Is A, a fit map that is honest but not photoreal, the first step?
- Is there a budget for B's GPU work or D's per-image cost?
- Body from measurements only, or also from photos? Photos raise the privacy bar;
  measurements alone keep today's rule.

## Sources

- Anny: [NAVER LABS Europe blog](https://europe.naverlabs.com/blog/anny-a-free-to-use-3d-human-parametric-model-for-all-ages/), [paper](https://arxiv.org/html/2511.03589v1)
- GarmentCode: [repository](https://github.com/maria-korosteleva/GarmentCode), [PyPI pygarment](https://pypi.org/project/pygarment/), [GarmentCodeData](https://arxiv.org/html/2405.17609), [ACM](https://dl.acm.org/doi/10.1145/3618351)
- NVIDIA Warp: [releases](https://github.com/NVIDIA/warp/releases), [secondary source on the Apache 2.0 date](https://aiwiki.ai/wiki/nvidia_warp/raw)
- CLO fit maps: [Fit Map](https://support.clo3d.com/hc/en-us/articles/115012380428-Fit-Map), [Garment Fit Maps guide](https://support.clo3d.com/hc/en-us/articles/360052622933-CLO-Garment-Fit-Maps-Guide)
- Browser cloth: [jspdown/cloth](https://github.com/jspdown/cloth), [three.js WebGPU cloth gist](https://gist.github.com/bandinopla/0ff5e437fb1a6a3dce5d355b93e22b68), [WebGPU cloth paper, 2025](https://arxiv.org/html/2507.11794v1), [three.js forum thread](https://discourse.threejs.org/t/3d-simulation-of-clothing-on-avatars/88486)
- FASHN: [API](https://fashn.ai/products/api), [pricing update](https://fashn.ai/blog/pricing-update-for-developer-api), [v1.6 docs](https://docs.fashn.ai/api-reference/tryon-v1-6)
- Open VTON licences: [FASHN's comparison](https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models), [IDM-VTON](https://idm-vton.github.io/), [developer's guide on dataset licences](https://fashn.ai/blog/so-you-want-to-build-a-virtual-try-on-app-a-developers-guide-to-not-getting)
- SMPL-X licence: [model licence](https://smpl-x.is.tue.mpg.de/modellicense.html)
- Vendors: [WEARFITS docs](https://github.com/WEARFITS/docs), [fitting software overview](https://www.guideflow.com/blog/virtual-fitting-software), [The Fitting Room](https://www.thefittingroom.tech/virtual-try-on)
