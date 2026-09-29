// What an outcome record must contain. Kept out of the route file because a Next
// App Router route may only export the framework's own symbols, and this needs
// tests (outcomeInput.test.ts).

import { z } from "zod";
import { DIRECTION_MAX, DIRECTION_MIN } from "./fitDirection";

// How it fit is recorded on the SIGNED scale (fitDirection.ts), the same one the
// closet uses. The old 1–5 `overallFit` cannot say which way a return was wrong —
// the one thing outcome learning needs — and the form defaulted it to 4, so an
// untouched form was stored as "good fit". `overallFit` is now derived from the
// direction when one is given (invariant ⑮), never asked for separately.
export const OutcomeSchema = z
  .object({
    productId: z.string().min(1),
    purchasedSize: z.string().min(1).max(20),
    decision: z.enum(["keep", "return", "exchange"]),
    exchangedForSize: z.string().max(20).optional().nullable(),
    fitDirection: z.coerce.number().int().min(DIRECTION_MIN).max(DIRECTION_MAX).optional().nullable(),
    overallFit: z.coerce.number().int().min(1).max(5).optional().nullable(),
    areaIssuesJson: z.string().max(2000).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
  })
  // A return or an exchange with no direction is the least useful record there is:
  // it says a size was wrong and not which way. Required, not defaulted — a resting
  // default makes "didn't answer" indistinguishable from an answer (⑱).
  .refine((o) => o.decision === "keep" || o.fitDirection != null, {
    path: ["fitDirection"],
    message: "say how it fit — too tight or too loose — so we know which way to adjust",
  })
  .refine((o) => o.decision !== "exchange" || !!o.exchangedForSize?.trim(), {
    path: ["exchangedForSize"],
    message: "an exchange needs the size you swapped it for",
  });
