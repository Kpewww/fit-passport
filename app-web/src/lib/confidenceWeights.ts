// What each piece of evidence is worth to a recommendation's confidence.
//
// This lives in its own leaf module for two reasons that pull against each other,
// and both matter:
//
//   1. ONE HOME. `/check` tells people what adding a measurement or a closet
//      garment would buy them — "worth +35 points". That promise is only
//      defensible if it is the same arithmetic `computeConfidence` runs. A second
//      copy in the UI would be a number that drifts silently, which is exactly
//      what happened to the garment colour palette (invariant ㉛).
//
//   2. NOT THE WHOLE ENGINE. `fitEngine.ts` pulls in sizing, sizeSystems,
//      brandBias, fitDirection and closetConsistency. Importing this constant
//      from there added 1.3 kB to the /check client bundle, measured — the
//      tree-shaker could not drop the rest. A leaf module with no imports costs
//      nothing to send to a browser.
//
// Anything added here changes what the engine computes AND what the UI promises,
// in one edit. That is the point.

// The values, and where each came from, now live in `scoringConstants.ts` — the one
// registry every scoring number declares its provenance in. This file stays so
// existing imports keep working; it adds nothing of its own.
export { CONFIDENCE_WEIGHTS } from "./scoringConstants";
