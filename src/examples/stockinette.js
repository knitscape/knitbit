const w = 10, h = 10;
const ops = [];
const yarnFeeder = [];

for (let row = 0; row < h; row++) {
  yarnFeeder.push(1);
  for (let col = 0; col < w; col++) {
    ops.push(Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, ops),
  yarnFeeder,
  palette: ["#a8dadc"],
};
