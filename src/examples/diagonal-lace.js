const w = 10, h = 20;
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

let eyeletPos = 1;

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  const phase = row % 4;

  if (phase === 2) {
    // Transfer one stitch to back bed
    yarnFeeder.push(null);
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col === eyeletPos ? Op.FTB : Op.EMPTY);
    }
  } else if (phase === 3) {
    // Return loop to front bed, shifted right
    yarnFeeder.push(null);
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col === eyeletPos + 1 ? Op.BTF : Op.EMPTY);
    }
    eyeletPos = (eyeletPos + 1) % (w - 1);
  } else {
    yarnFeeder.push(1);
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(Op.FKNIT);
    }
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  racking,
  palette: ["#e8d5b7"],
};
