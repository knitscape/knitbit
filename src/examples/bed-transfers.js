// A 4×4 basketweave stitch tile. Pixel values are Op codes:
// 1 = FKNIT (front knit "V"), 3 = BKNIT (back knit "purl").
// The 4th arg to Bimp is a color palette for the bitmap editor.
// Click the ✎ button next to the literal to paint it visually.
const tile = new Bimp(
  4,
  4,
  [1, 1, 3, 3, 1, 1, 3, 3, 3, 3, 1, 1, 3, 3, 1, 1],
  [
    { color: "#fbacda", label: "miss" },
    { color: "#08ccab", label: "front knit" },
    { color: "#eb4034", label: "front tuck" },
    { color: "#079e85", label: "back knit" },
    { color: "#b03027", label: "back tuck" },
    { color: "#fcff46", label: "ftb xfer" },
    { color: "#afff46", label: "btf xfer" },
    { color: "#d48cff", label: "front drop" },
    { color: "#8050c0", label: "back drop" },
    { color: "#1a1a1a", label: "empty" },
  ],
);

const w = 20,
  h = 20;
const ops = Bimp.fromTile(w, h, tile);

const yarnFeeder = new Array(h).fill(1);

// Insert transfer rows wherever a knit wants to happen on a different
// bed than the loop currently sits on. For each knit row, we inspect the
// row below: a column that previously knit on the opposite bed needs a
// transfer (FTB or BTF) inserted in a prepended row so the loop is on
// the correct bed before the carriage passes.
function bedTransfers(ops, yarnFeeder) {
  const w = ops.width;
  const h = ops.height;
  const outOps = [];
  const outFeeder = [];
  const outRacking = [];

  for (let row = 0; row < h; row++) {
    if (row > 0) {
      const transferRow = new Array(w).fill(Op.EMPTY);
      let needsTransfer = false;
      for (let col = 0; col < w; col++) {
        const cur = ops.pixel(col, row);
        const prev = ops.pixel(col, row - 1);
        if (cur === Op.FKNIT && prev === Op.BKNIT) {
          transferRow[col] = Op.BTF;
          needsTransfer = true;
        } else if (cur === Op.BKNIT && prev === Op.FKNIT) {
          transferRow[col] = Op.FTB;
          needsTransfer = true;
        }
      }
      if (needsTransfer) {
        outOps.push(...transferRow);
        // null yarn marks a transfer-only row (no yarn is being fed).
        outFeeder.push(null);
        outRacking.push(0);
      }
    }

    for (let col = 0; col < w; col++) {
      outOps.push(ops.pixel(col, row));
    }
    outFeeder.push(yarnFeeder[row]);
    outRacking.push(0);
  }

  return {
    ops: new Bimp(w, outOps.length / w, outOps),
    yarnFeeder: outFeeder,
    racking: outRacking,
  };
}

const result = bedTransfers(ops, yarnFeeder);

return {
  ops: result.ops,
  yarnFeeder: result.yarnFeeder,
  racking: result.racking,
  palette: ["#a8dadc"],
};
