const w = 10, h = 16;
const ops = [];
const yarnFeeder = [];
const direction = [];

// Two-color jacquard: each pair of rows uses a different yarn.
// Needles that should show the other color get MISS (yarn floats behind).
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  const colorBlock = Math.floor(row / 2) % 2; // alternates every 2 rows
  yarnFeeder.push(colorBlock + 1);

  for (let col = 0; col < w; col++) {
    // Checkerboard: 2x2 blocks
    const inBlock = (Math.floor(col / 2) + Math.floor(row / 2)) % 2 === 0;
    ops.push(inBlock ? Op.FKNIT : Op.MISS);
  }
}

return {
  ops: new Bimp(w, h, ops),
  yarnFeeder,
  direction,
  palette: ["#264653", "#e9c46a"],
};
