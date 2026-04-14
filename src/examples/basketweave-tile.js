// A 4×4 basketweave stitch tile. Pixel values are Op codes:
// 1 = FKNIT (front knit "V"), 3 = BKNIT (back knit "purl").
// The 4th arg to Bimp is a color palette for the bitmap editor.
// Click the ✎ button next to the literal to paint it visually.
const tile = new Bimp(4, 4, [
  1, 1, 3, 3,
  1, 1, 3, 3,
  3, 3, 1, 1,
  3, 3, 1, 1,
], ["#fbacda", "#08ccab", "#eb4034", "#079e85"]);

const w = 20, h = 20;
const ops = Bimp.fromTile(w, h, tile);

const yarnFeeder = new Array(h).fill(1);
const direction = [];
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
}

// Insert transfer rows wherever a knit wants to happen on a different
// bed than the loop currently sits on. For each knit row, we inspect the
// row below: a column that previously knit on the opposite bed needs a
// transfer (FTB or BTF) inserted in a prepended row so the loop is on
// the correct bed before the carriage passes.
function bedTransfers(ops, yarnFeeder, direction) {
  const w = ops.width;
  const h = ops.height;
  const outOps = [];
  const outFeeder = [];
  const outDirection = [];
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
        outDirection.push(direction[row]);
        outRacking.push(0);
      }
    }

    for (let col = 0; col < w; col++) {
      outOps.push(ops.pixel(col, row));
    }
    outFeeder.push(yarnFeeder[row]);
    outDirection.push(direction[row]);
    outRacking.push(0);
  }

  return {
    ops: new Bimp(w, outOps.length / w, new Uint8ClampedArray(outOps)),
    yarnFeeder: outFeeder,
    direction: outDirection,
    racking: outRacking,
  };
}

const result = bedTransfers(ops, yarnFeeder, direction);

return {
  ops: result.ops,
  yarnFeeder: result.yarnFeeder,
  direction: result.direction,
  racking: result.racking,
  palette: ["#a8dadc"],
};
