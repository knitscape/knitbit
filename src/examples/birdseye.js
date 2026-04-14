const w = 10, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];

// Bird's eye backing: two-color tuck pattern.
// Each color tucks on alternating needles, swapping every 2 rows.
// Creates a dense, double-faced fabric with small color dots.
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  const colorPhase = Math.floor(row / 2) % 2;
  yarnFeeder.push(colorPhase + 1);

  for (let col = 0; col < w; col++) {
    const tuckPos = (col + colorPhase) % 2 === 0;
    ops.push(tuckPos ? Op.FTUCK : Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#2a9d8f", "#e76f51"],
};
