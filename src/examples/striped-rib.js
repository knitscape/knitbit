const w = 10, h = 10;
const ops = [];
const yarnFeeder = [];
const direction = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(Math.floor(row / 2) % 2 + 1);
  for (let col = 0; col < w; col++) {
    ops.push(col % 2 === 0 ? Op.FKNIT : Op.BKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#a8dadc", "#e63946"],
};
