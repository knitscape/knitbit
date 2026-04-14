const w = 12, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];

// Scattered isolated tucks on a diagonal grid — each tuck sits alone
// in its column with plenty of plain knit rows around it.
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);

  for (let col = 0; col < w; col++) {
    // Tuck when (col + row/4) lands on a multiple of 3, but only
    // every 4th row so tucks are isolated vertically.
    const isTuckRow = row % 4 === 1;
    const isTuckCol = (col + Math.floor(row / 4)) % 3 === 0;
    ops.push(isTuckRow && isTuckCol ? Op.FTUCK : Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#c8b6e2"],
};
