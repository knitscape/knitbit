// A 4×4 basketweave stitch tile. Pixel values are Op codes:
// 1 = FKNIT (front knit "V"), 3 = BKNIT (back knit "purl").
// The 4th arg to Bimp is a color palette for the bitmap editor.
// Click the ✎ button next to the literal to paint it visually.
const tile = new Bimp(4, 4, [
  1, 1, 3, 3,
  1, 1, 3, 3,
  3, 3, 1, 1,
  3, 3, 1, 1,
], ["#fbacda", "#08ccab", "#eb4034", "#079e85"]);

const w = 20, h = 20;
const ops = Bimp.fromTile(w, h, tile);

const yarnFeeder = new Array(h).fill(1);
const direction = [];
for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
}

return {
  ops,
  yarnFeeder,
  direction,
  palette: ["#a8dadc"],
};
