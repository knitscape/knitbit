import type {
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";

const OP_MEMBERS = [
  { label: "Op.MISS", type: "enum", detail: "= 0", info: "Yarn floats past the needle" },
  { label: "Op.FKNIT", type: "enum", detail: "= 1", info: "Front bed knit" },
  { label: "Op.FTUCK", type: "enum", detail: "= 2", info: "Front bed tuck" },
  { label: "Op.BKNIT", type: "enum", detail: "= 3", info: "Back bed knit" },
  { label: "Op.BTUCK", type: "enum", detail: "= 4", info: "Back bed tuck" },
  { label: "Op.FTB", type: "enum", detail: "= 5", info: "Transfer front to back" },
  { label: "Op.BTF", type: "enum", detail: "= 6", info: "Transfer back to front" },
  { label: "Op.FDROP", type: "enum", detail: "= 7", info: "Drop loop from front bed" },
  { label: "Op.BDROP", type: "enum", detail: "= 8", info: "Drop loop from back bed" },
  { label: "Op.EMPTY", type: "enum", detail: "= 9", info: "No action at this cell" },
];

const BIMP_STATIC_METHODS = [
  { label: "Bimp.empty", type: "function", detail: "(width, height, color)", info: "Create a Bimp filled with a single color" },
  { label: "Bimp.fromJSON", type: "function", detail: "(jsonObj)", info: "Create a Bimp from a JSON object" },
  { label: "Bimp.fromTile", type: "function", detail: "(width, height, tile)", info: "Create a Bimp by tiling a smaller Bimp" },
];

const BIMP_INSTANCE_MEMBERS = [
  { label: "width", type: "property" },
  { label: "height", type: "property" },
  { label: "pixels", type: "property", info: "Uint8ClampedArray of pixel data" },
  { label: "pixel", type: "method", detail: "(x, y)", info: "Get pixel value at (x, y)" },
  { label: "pixelAt", type: "method", detail: "(x, y)", info: "Get pixel with negative index wrapping" },
  { label: "draw", type: "method", detail: "(changes)", info: "Return new Bimp with pixel changes applied" },
  { label: "indexedDraw", type: "method", detail: "(changes)", info: "Draw with index-based changes" },
  { label: "indexedBrush", type: "method", detail: "(index, color)" },
  { label: "brush", type: "method", detail: "(pos, color)" },
  { label: "overlay", type: "method", detail: "(overlayBimp, pos, skip?, avoid?)" },
  { label: "pad", type: "method", detail: "(paddingX, paddingY, color)" },
  { label: "resize", type: "method", detail: "(width, height, emptyColor?)" },
  { label: "vFlip", type: "method", detail: "()", info: "Flip vertically" },
  { label: "vMirror", type: "method", detail: "()", info: "Mirror vertically" },
  { label: "hFlip", type: "method", detail: "()", info: "Flip horizontally" },
  { label: "shift", type: "method", detail: "(dx, dy)", info: "Shift with wrapping" },
  { label: "rect", type: "method", detail: "(start, end, color)" },
  { label: "line", type: "method", detail: "(from, to, color)" },
  { label: "flood", type: "method", detail: "(pos, color)", info: "Flood fill" },
  { label: "make2d", type: "method", detail: "()", info: "Return 2D array" },
  { label: "toJSON", type: "method", detail: "()" },
];

const TOP_LEVEL = [
  { label: "Bimp", type: "class", info: "Bitmap class for knitting operations" },
  { label: "Op", type: "enum", info: "Knitting operation enum" },
];

export function knitbitCompletions(
  context: CompletionContext
): CompletionResult | null {
  const opDot = context.matchBefore(/Op\.\w*/);
  if (opDot) {
    return { from: opDot.from, options: OP_MEMBERS, validFor: /^Op\.\w*$/ };
  }

  const bimpDot = context.matchBefore(/Bimp\.\w*/);
  if (bimpDot) {
    return {
      from: bimpDot.from,
      options: BIMP_STATIC_METHODS,
      validFor: /^Bimp\.\w*$/,
    };
  }

  const dotAccess = context.matchBefore(/\.\w+/);
  if (dotAccess) {
    return { from: dotAccess.from + 1, options: BIMP_INSTANCE_MEMBERS };
  }

  const word = context.matchBefore(/\w+/);
  if (word && word.from !== word.to) {
    return { from: word.from, options: TOP_LEVEL };
  }

  return null;
}
