# Use a marketplace's per-size 身高/体重 range as a signal

**Found in Session 79a.**

Tmall's size table and size picker give, per size, the height and weight it is
cut for ("适合身高体重: 165-185cm/75-90kg"), and a 身高体重对照表 mapping height ×
weight to a size. The capture keeps the table's 身高 / 体重 columns, but the
engine reads only the measurements.

For a shopper with no chest measurement but a stated height and weight, this is
the seller's own rule and could be a weak signal — **the seller's**, so it would
carry its own provenance and never outrank measurements.

Open questions before building: how often sellers' ranges overlap (they do here:
M 160-180, L 160-185), and whether the profile stores weight at all.
