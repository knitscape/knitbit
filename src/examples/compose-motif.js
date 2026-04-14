// Build a larger pattern by mirroring and tiling a small asymmetric
// motif. Demonstrates concat, hFlip / vFlip, repeat, and remap.
//
// Paint the base motif below (✎). Values map: 0 → knit stitch ("V"),
// 1 → back knit (shows as a "purl" bump). The motif is mirrored into
// a 4-fold-symmetric block and then tiled 3 × 3 across the swatch.

const motif = new Bimp(
  4,
  4,
  [1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1],
  [
    { color: "#f1faee", label: "knit (V)" },
    { color: "#457b9d", label: "purl (bump)" },
  ],
);

// Mirror horizontally → a 2-wide pair; then vertically → a 4-fold block.
const top = motif.concat(motif.hFlip(), "x");
const block = top.concat(top.vFlip(), "y");
// Make a new chart by tiling the block.
const chart = block.repeat(10, 10);

// Substitute palette indices with Op codes: 0 → FKNIT, 1 → BKNIT.
const ops = chart.remap({ 0: Op.FKNIT, 1: Op.BKNIT });

const yarnFeeder = new Array(ops.height).fill(1);

return {
  ops,
  yarnFeeder,
  palette: ["#a8dadc"],
};
