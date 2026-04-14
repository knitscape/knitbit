const w = 10, h = 10;
const ops = [];
const yarnFeeder = [];
const direction = [];

// One isolated tuck in the middle of a stockinette field.
const tuckCol = Math.floor(w / 2);
const tuckRow = Math.floor(h / 2);

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);

  for (let col = 0; col < w; col++) {
    ops.push(row === tuckRow && col === tuckCol ? Op.FTUCK : Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#a8dadc"],
};
