# Use a marketplace's per-size 身高/体重 range as a signal — DONE (Session 100)

**Found in Session 79a.** Tmall's size table gives, per size, the height and weight it
is cut for ("适合身高体重: 165-185cm/75-90kg"). The capture already kept those columns;
the engine read only the measurements.

**Built (Session 100):**
- `sellerBodyRanges` (`lib/pageParse.ts`) reads the 身高 / height and 体重 / weight
  columns (or rows) of the chosen chart, by size label, AFTER the measurements: they
  never count towards `ranged` (which would make a garment chart a body chart) and
  never move with the inch conversion.
  - Only a stated range counts.
  - Units: cm or in; kg, lb or 斤. A unitless Chinese 体重 column is read as 斤 when
    its median is over 95.
  - A fabric weight is ignored, and so is anything outside an adult's range.
- `SizeOption.bodyHeightMinCm/MaxCm`, `bodyWeightMinKg/MaxKg` (migration
  `20261019120000_size_seller_height_weight`).
- `scoreSellerRange` (`lib/fitEngine.ts`), signal `seller-range`.
  - It speaks only when the wearer has no chest of their own, no closet anchor in this
    domain, and both height and weight, on a chart with the guide for at least two
    sizes.
  - It scores 1 inside the range and fades outside it (σ 4 cm / 4 kg), averaged over
    the dimensions given.
  - Weight 0.2 (`SELLER_RANGE`, assumed). It adds no confidence.
  - The reason says it is the seller's own guide.

**The overlap question** (M 160-180 and L 160-185) is answered by scoring both
dimensions: height rarely separates neighbouring sizes, while weight usually does.
Where neither does, the signal favours no size, which is the honest outcome.

**Still open:** the 身高体重对照表 (a height × weight → size lookup grid) is still
dropped by the capture. It would need its own reader.
