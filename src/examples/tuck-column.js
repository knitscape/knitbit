const w = 10, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];

// One column with a tuck every 4 rows, rest is stockinette.
const tuckCol = Math.floor(w / 2);

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);

  for (let col = 0; col < w; col++) {
    const isTuckRow = row % 4 === 2;
    ops.push(isTuckRow && col === tuckCol ? Op.FTUCK : Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#f4a261"],
};
