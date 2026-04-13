export interface Example {
  name: string;
  description: string;
  code: string;
}

function stockinette(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const ops = [];
const yarnFeeder = [];
const direction = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  for (let col = 0; col < w; col++) {
    ops.push(Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#a8dadc"],
};`;
}

function stripedStockinette(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const ops = [];
const yarnFeeder = [];
const direction = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(Math.floor(row / 2) % 2 + 1);
  for (let col = 0; col < w; col++) {
    ops.push(Op.FKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#a8dadc", "#e63946"],
};`;
}

function rib(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const ops = [];
const yarnFeeder = [];
const direction = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  for (let col = 0; col < w; col++) {
    ops.push(col % 2 === 0 ? Op.FKNIT : Op.BKNIT);
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#08ccab"],
};`;
}

function stripedRib(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
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
};`;
}

export const EXAMPLES: Example[] = [
  {
    name: "Stockinette 10\u00d710",
    description: "Plain stockinette, 10\u00d710",
    code: stockinette(10, 10),
  },
  {
    name: "Striped Stockinette 10\u00d710",
    description: "Two-color striped stockinette, 10\u00d710",
    code: stripedStockinette(10, 10),
  },
  {
    name: "1\u00d71 Rib 10\u00d710",
    description: "1\u00d71 rib stitch, 10\u00d710",
    code: rib(10, 10),
  },
  {
    name: "Striped Rib 10\u00d710",
    description: "1\u00d71 rib with two-color stripes, 10\u00d710",
    code: stripedRib(10, 10),
  },
  {
    name: "Striped Rib 50\u00d750",
    description: "1\u00d71 rib with two-color stripes, 50\u00d750",
    code: stripedRib(50, 50),
  },
];
