const w = 40,
  h = 80;
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  const phase = row % 4;

  if (phase === 2) {
    // Transfer every 4th stitch to back bed, offset by 1
    yarnFeeder.push(null);
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 1 ? Op.FTB : Op.EMPTY);
    }
  } else if (phase === 3) {
    // Return loops to front bed (now shifted one needle right)
    yarnFeeder.push(null);
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 2 ? Op.BTF : Op.EMPTY);
    }
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
  palette: ["#a8dadc"],
};
