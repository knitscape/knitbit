const w = 10, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];

// Tuck stitch texture: tucks accumulate loops on selected needles,
// creating a bumpy, textured fabric.
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);

  for (let col = 0; col < w; col++) {
    // Tuck every 3rd needle, offset each row pair for a brick pattern
    const offset = Math.floor(row / 2) % 3;
    ops.push((col + offset) % 3 === 0 ? Op.FTUCK : Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#f4a261"],
};
