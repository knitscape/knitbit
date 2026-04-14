const w = 12, h = 20;
const repeat = Math.floor(w / 2);
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  const section = Math.floor(row / 4) % repeat;
  const phase = row % 4;

  if (phase === 2) {
    // Transfer two stitches symmetrically toward center
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col === section || col === w - 1 - section
        ? Op.FTB : Op.MISS);
    }
  } else if (phase === 3) {
    // Return loops to front bed
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col === section + 1 || col === w - section
        ? Op.BTF : Op.MISS);
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
  palette: ["#c8b6e2"],
};
