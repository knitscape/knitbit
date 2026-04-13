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

function eyeletLace(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  const phase = row % 4;

  if (phase === 2) {
    // Transfer every 4th stitch to back bed, offset by 1
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 1 ? Op.FTB : Op.MISS);
    }
  } else if (phase === 3) {
    // Return loops to front bed (now shifted one needle right)
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col % 4 === 2 ? Op.BTF : Op.MISS);
    }
  } else {
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(Op.FKNIT);
    }
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  racking,
  palette: ["#a8dadc"],
};`;
}

function diagonalLace(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

let eyeletPos = 1;

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  const phase = row % 4;

  if (phase === 2) {
    // Transfer one stitch to back bed
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col === eyeletPos ? Op.FTB : Op.MISS);
    }
  } else if (phase === 3) {
    // Return loop to front bed, shifted right
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col === eyeletPos + 1 ? Op.BTF : Op.MISS);
    }
    eyeletPos = (eyeletPos + 1) % (w - 1);
  } else {
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(Op.FKNIT);
    }
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  racking,
  palette: ["#e8d5b7"],
};`;
}

function chevronLace(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
const repeat = Math.floor(w / 2);
const ops = [];
const yarnFeeder = [];
const direction = [];
const racking = [];

for (let row = 0; row < h; row++) {
  direction.push(row % 2 === 0 ? "right" : "left");
  yarnFeeder.push(1);
  const section = Math.floor(row / 4) % repeat;
  const phase = row % 4;

  if (phase === 2) {
    // Transfer two stitches symmetrically toward center
    racking.push(1);
    for (let col = 0; col < w; col++) {
      ops.push(col === section || col === w - 1 - section
        ? Op.FTB : Op.MISS);
    }
  } else if (phase === 3) {
    // Return loops to front bed
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(col === section + 1 || col === w - section
        ? Op.BTF : Op.MISS);
    }
  } else {
    racking.push(0);
    for (let col = 0; col < w; col++) {
      ops.push(Op.FKNIT);
    }
  }
}

return {
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  racking,
  palette: ["#c8b6e2"],
};`;
}

function floatJacquard(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
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
  ops: new Bimp(w, h, new Uint8ClampedArray(ops)),
  yarnFeeder,
  direction,
  palette: ["#264653", "#e9c46a"],
};`;
}

function tuckStitch(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
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
};`;
}

function birdseye(w: number, h: number): string {
  return `const w = ${w}, h = ${h};
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
  {
    name: "Eyelet Lace 10\u00d716",
    description: "Simple lace with a row of eyelets every 4 rows",
    code: eyeletLace(10, 16),
  },
  {
    name: "Diagonal Lace 10\u00d720",
    description: "Lace with eyelets stepping diagonally across the fabric",
    code: diagonalLace(10, 20),
  },
  {
    name: "Chevron Lace 12\u00d720",
    description: "Lace with eyelets forming a V/chevron pattern",
    code: chevronLace(12, 20),
  },
  {
    name: "Float Jacquard 10\u00d716",
    description: "Two-color checkerboard using misses for yarn floats",
    code: floatJacquard(10, 16),
  },
  {
    name: "Tuck Texture 10\u00d716",
    description: "Brick-pattern tuck stitch for bumpy texture",
    code: tuckStitch(10, 16),
  },
  {
    name: "Bird's Eye 10\u00d716",
    description: "Two-color tuck pattern creating small color dots",
    code: birdseye(10, 16),
  },
];
