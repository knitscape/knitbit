const w = 10, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  const phase = row % 4;

  if (phase === 2) {
    // Transfer every 4th stitch to back bed, offset by 1
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 1 ? Op.FTB : Op.MISS);
    }
  } else if (phase === 3) {
    // Return loops to front bed (now shifted one needle right)
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 2 ? Op.BTF : Op.MISS);
    }
  } else {
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
