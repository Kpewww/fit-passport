// What a new closet item may contain — the POST body of /api/closet.
// In lib (not the route) so its rules can be tested: a route file may only export
// its handlers.

import { z } from "zod";
import { isValidSize } from "./sizeSystems";
import { DIRECTION_MIN, DIRECTION_MAX } from "./fitDirection";

export const ItemSchema = z
  .object({
    brand: z.string().min(1).max(80),
    displayName: z.string().max(80).optional().nullable(),
    category: z.string().min(1).max(40),
    gender: z.enum(["mens", "womens", "unisex"]).optional().nullable(),
    size: z.string().min(1).max(20),
    region: z.string().max(10).optional().nullable(),
    fitRating: z.coerce.number().int().min(1).max(5).default(4),
    // Signed fit direction, -10 (too tight) .. 0 .. +10 (too loose). Optional so
    // an item added without a report stays null and the engine ignores it.
    fitDirection: z.coerce.number().int().min(DIRECTION_MIN).max(DIRECTION_MAX).optional().nullable(),
    areaNotesJson: z.string().max(2000).optional().nullable(),
    productUrl: z.string().url().optional().nullable(),
    imageDataUrl: z.string().max(400_000).regex(/^data:image\/(png|jpeg|webp);base64,/, "must be a small image").optional().nullable(),
    color: z.string().max(40).optional().nullable(),
    collectionId: z.string().optional().nullable(),
    groupId: z.string().optional().nullable(),
    groupName: z.string().max(80).optional().nullable(),
    onlineAvailable: z.boolean().optional(),
    // The garment's OWN measurements, as read from the retailer's chart at
    // add-by-URL time. All optional — hand-added items have none, and a page
    // with no chart yields none either.
    garmentChestCm: z.coerce.number().min(10).max(400).optional().nullable(),
    garmentShoulderCm: z.coerce.number().min(5).max(120).optional().nullable(),
    garmentSleeveCm: z.coerce.number().min(1).max(150).optional().nullable(),
    garmentLengthCm: z.coerce.number().min(5).max(250).optional().nullable(),
    garmentMeasuredFrom: z.enum(["page", "brand-chart", "fixture", "seller", "estimated"]).optional().nullable(),
    // Moving a to-buy product into the closet once it is bought (Session 80). The
    // saved row is removed in the same transaction as the garment is created.
    fromSavedId: z.string().max(40).optional().nullable(),
  })
  // A bought product joins the closet as a garment the user has WORN: it must
  // say how it fits. Without this, fitRating's default (4, "fits well") would make
  // an untried purchase a known-good anchor the engine learns from.
  .refine((d) => !d.fromSavedId || d.fitDirection != null, {
    message: "fitDirection is required when moving a saved product into the closet",
    path: ["fitDirection"],
  })
  // Guard the size against the category's size system so junk can't be stored.
  .refine((d) => isValidSize(d.category, d.size), {
    message: "Size is not valid for this garment type",
    path: ["size"],
  })
  // A garment measurement with no stated provenance is indistinguishable from a
  // measured one, which is the exact failure `source.sizesFrom` exists to stop.
  .refine(
    (d) =>
      d.garmentMeasuredFrom != null ||
      (d.garmentChestCm == null &&
        d.garmentShoulderCm == null &&
        d.garmentSleeveCm == null &&
        d.garmentLengthCm == null),
    {
      message: "garmentMeasuredFrom is required when any garment measurement is given",
      path: ["garmentMeasuredFrom"],
    },
  );
