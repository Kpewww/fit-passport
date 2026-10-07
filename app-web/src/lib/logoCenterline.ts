// The thread the mark is drawn with — Sessions 89 and 90.
//
// The mark (brand/fit-passport-mark-master.svg) is a FILLED outline, not a line, so
// it cannot be "drawn" by animating its own path. These strokes follow its centre, at
// the master's stroke width, closely enough that the reveal can end by crossfading
// into the real thing without a visible swap. They are a drawing aid only: no frame
// at rest ever shows them, and the settled frame is <Logo> itself.
//
// Two threads draw the mark (Session 90, the founder's route):
//   A — the small p:  entryBar, notch, innerCurl
//   B — the big P:    lowerLoop, crossing, spineUp (stem, junction, big upper loop)
// The mark has six free ends and a four-way junction, so no single line covers it;
// two do, crossing two gaps between them. Those two CONNECTORS are not part of the
// mark: the reveal draws through them, then fades them, so the mark's real gaps
// appear (the notch at the junction; the stem passing under the lower bar).
//
// Derived, not drawn by hand: rough paths were snapped to the midpoint between the
// fill's edges, smoothed and thinned, and the connectors built from the pieces' ends
// and directions, by brand/tests/centerline-fit.mjs. Measured on a 1000 px render at a
// 22-unit stroke, the four mark pieces cover 98.6% of the mark, and 1.8% of the
// stroke falls outside it. Re-run that script with --write if the master changes.
//
// Coordinates are the master's own (viewBox 0 0 536.03 501.64).

/** The master's measured median stroke width, in its own units. */
export const CENTERLINE_STROKE = 22;

/** The mark's own strokes. */
export const CENTERLINE = {
  /** Thread A: enter from the top-left, along the bar, up to the junction. */
  entryBar: "M10.2 35.3C12.1 37.4 17.7 43.1 21.2 47.7C24.7 52.2 27.6 57.8 31.1 62.8C34.7 67.7 38.4 72.6 42.3 77.2C46.3 81.8 50.5 86.3 54.9 90.5C59.3 94.8 63.9 98.8 68.7 102.6C73.4 106.4 78.4 110 83.6 113.3C88.7 116.6 94 119.7 99.4 122.5C104.9 125.3 110.4 127.8 116.1 130.1C121.7 132.4 127.5 134.4 133.3 136.2C139.1 138 145 139.5 150.9 140.8C156.8 142.1 162.8 143.2 168.8 143.9C174.8 144.7 180.8 145.2 186.8 145.5C192.9 145.8 198.9 145.8 204.9 145.8C210.9 145.8 216.9 145.7 222.9 145.7C228.9 145.6 234.9 145.6 240.7 145.6C246.6 145.5 253.6 145.5 258.2 145.4C262.7 145.3 266.4 145.1 268 145",
  /** Thread A: the inner bar and its curl — the small p. */
  innerCurl: "M290 146C293.1 145.9 302.5 145.7 308.5 145.6C314.5 145.5 320.1 145.7 326 145.7C331.9 145.7 337.9 145.7 343.9 145.7C349.9 145.7 355.9 145.7 361.9 145.7C367.9 145.8 373.8 145.7 379.8 145.7C385.8 145.7 391.8 145.8 397.8 145.7C403.8 145.7 409.8 146 415.8 145.7C421.8 145.5 428.1 145.7 433.8 144.2C439.4 142.6 445.5 140.2 449.8 136.4C454.2 132.7 458 127.1 459.9 121.7C461.8 116.2 462.5 109.5 461.3 103.9C460.2 98.3 456.9 92.5 453 88.2C449.2 84 443.5 80.5 438.1 78.4C432.7 76.2 426.4 75.4 420.5 75.2C414.7 75 408.6 75.9 402.9 77.4C397.3 78.8 391.7 81 386.6 83.8C381.5 86.5 376.9 90.3 372.4 93.9C367.9 97.4 361.9 103.3 359.8 105.2",
  /** Thread B: from the lower loop's tip, round the loop, up to the lower bar. */
  lowerLoop: "M385 281.9C382.9 283.9 377 289.8 372.6 293.8C368.3 297.9 363.9 302.6 358.8 306.1C353.8 309.6 348 312.6 342.3 314.8C336.5 317.1 330.4 318.6 324.3 319.6C318.2 320.6 312 320.8 305.9 321C299.8 321.3 293.7 321.1 287.6 321.2C281.6 321.2 275.6 321.2 269.6 321.4C263.6 321.7 257.6 322.1 251.7 322.7C245.7 323.3 239.8 324.3 233.8 325.1C227.9 325.9 221.9 326.5 216 327.6C210.2 328.7 204.3 330.2 198.6 331.9C192.8 333.5 187.1 335.4 181.5 337.5C175.9 339.7 170.4 342 165 344.6C159.7 347.2 154.4 350 149.4 353.1C144.5 356.2 139.6 359.6 135.2 363.2C130.8 366.7 126.6 370.5 122.9 374.5C119.1 378.4 115.8 382.5 112.7 386.9C109.7 391.3 106.9 395.9 104.5 400.8C102.1 405.8 100 411 98.4 416.4C96.9 421.8 95.7 427.5 95.3 433.2C94.9 438.8 95 444.7 96.1 450.3C97.2 455.9 99 461.7 101.9 466.6C104.7 471.5 108.8 476.1 113.3 479.7C117.8 483.2 123.3 486.1 128.8 487.8C134.4 489.6 140.6 490.3 146.6 490.1C152.5 489.9 158.8 488.7 164.4 486.6C170.1 484.6 175.8 481.5 180.7 477.9C185.6 474.2 190 469.5 193.8 464.8C197.7 460 200.9 454.6 203.9 449.2C206.9 443.8 209.3 438.2 211.6 432.5C213.8 426.9 215.7 421 217.5 415.2C219.3 409.4 220.8 403.6 222.3 397.7C223.9 391.9 225.2 386 226.6 380.2C228 374.3 229.4 368.5 230.6 362.7C231.8 357 233.2 350.7 234.1 345.8C235 340.8 235.7 335.1 236 333",
  /** Thread B: up the stem, through the junction, round the big upper loop. */
  spineUp: "M244.8 289.8C245.4 286.8 247 277.7 248 271.9C249.1 266 250.1 260.3 251.2 254.5C252.3 248.6 253.4 242.7 254.6 236.9C255.7 231 256.9 225.1 258.1 219.2C259.3 213.3 260.5 207.4 261.7 201.6C262.9 195.7 264.1 189.8 265.4 183.9C266.7 178 268.2 172.2 269.5 166.4C270.8 160.6 271.6 154.7 273.2 149.1C274.9 143.5 277.1 138.2 279.3 132.7C281.4 127.3 283.7 121.8 286.1 116.3C288.5 110.9 290.8 105.4 293.5 100C296.1 94.7 298.8 89.3 301.9 84.2C304.9 79 308.1 73.9 311.7 69.1C315.2 64.2 319.1 59.5 323.2 55.1C327.3 50.7 331.7 46.4 336.3 42.5C341 38.5 345.9 34.9 351 31.6C356.1 28.3 361.5 25.4 367.1 22.9C372.6 20.4 378.4 18.4 384.3 16.7C390.1 15 396.1 13.7 402.1 12.7C408.1 11.8 414.2 11.2 420.2 11.2C426.2 11.2 432.3 11.9 438.3 12.8C444.3 13.7 450.3 15 456 16.9C461.8 18.7 467.5 21 472.8 23.8C478.1 26.6 483.3 29.8 488.1 33.5C492.8 37.2 497.2 41.4 501.2 45.9C505.1 50.3 508.6 55.3 511.6 60.4C514.6 65.5 517.2 71 519.2 76.5C521.2 82.1 522.6 87.9 523.5 93.7C524.5 99.5 525 105.5 524.9 111.4C524.8 117.4 524.2 123.4 523.1 129.3C522 135.1 520.4 141.1 518.2 146.7C516 152.3 513.1 157.8 509.9 163C506.7 168.1 502.9 173.2 498.7 177.6C494.5 182.1 489.7 186.2 484.7 189.7C479.7 193.3 474.2 196.4 468.7 198.9C463.1 201.4 457.2 203.3 451.2 204.8C445.3 206.3 439.3 207.3 433.2 207.9C427.2 208.6 421.1 208.6 415.1 208.8C409 209 403 208.9 397 208.9C391 208.9 385 208.8 379 208.7C373 208.7 367 208.7 361 208.6C355 208.6 349 208.3 343.2 208.5C337.3 208.7 329.3 209.5 326.1 209.9C322.8 210.3 324.1 210.7 323.7 210.9",
} as const;

/** Through the gaps between pieces: drawn, then faded so the mark's gaps appear. */
export const CONNECTORS = {
  /** Thread A: through the junction's notch, from the bar into the inner bar. */
  notch: "M268 145C275.3 144.7 282.7 146.2 290 146",
  /** Thread B: the stem passing under the lower bar. */
  crossing: "M236 333C238.2 318.5 242.2 304.3 244.8 289.8",
} as const;
