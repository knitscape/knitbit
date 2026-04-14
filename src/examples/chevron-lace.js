const w = 12, h = 20;
const repeat = Math.floor(w / 2);
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  const section = Math.floor(row / 4) % repeat;
  const phase = row % 4;

  if (phase === 2) {
    // Transfer two stitches symmetrically toward center
    yarnFeeder.push(null);
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col === section || col === w - 1 - section
        ? Op.FTB : Op.EMPTY);
    }
  } else if (phase === 3) {
    // Return loops to front bed
    yarnFeeder.push(null);
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col === section + 1 || col === w - section
        ? Op.BTF : Op.EMPTY);
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
  ops: new Bimp(w, h, ops),
  yarnFeeder,
  direction,
  racking,
  palette: ["#c8b6e2"],
};
