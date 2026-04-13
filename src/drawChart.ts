import { SYMBOL_DATA, BACK_OPS } from "./shared/opData";
import type { Bimp } from "./shared/Bimp";

const DIM = "#0000002a";
const GUTTER = 0.15; // fraction of cell width between sections

export function drawChart(
  canvas: HTMLCanvasElement,
  ops: Bimp,
  yarnFeeder: number[],
  direction: ("left" | "right")[],
  racking: number[],
  palette: string[],
  cellSize: number
) {
  const { width, height } = ops;

  // Layout: [direction col] [gutter] [ops grid] [gutter] [yarn col] [gutter] [racking col]
  const gutterPx = Math.round(cellSize * GUTTER);
  const colWidth = cellSize;
  const totalWidth =
    colWidth + gutterPx + width * cellSize + gutterPx + colWidth + gutterPx + colWidth;
  const totalHeight = height * cellSize;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, totalWidth, totalHeight);

  // Resolve CSS custom properties for canvas use
  const styles = getComputedStyle(document.documentElement);
  const colBg = styles.getPropertyValue("--base2").trim() || "#2a2a2a";
  const colFg = styles.getPropertyValue("--base10").trim() || "#ccc";

  const dirX = 0;
  const opsX = colWidth + gutterPx;
  const yarnX = opsX + width * cellSize + gutterPx;
  const rackX = yarnX + colWidth + gutterPx;

  for (let y = 0; y < height; y++) {
    const canvasY = (height - y - 1) * cellSize;

    // ── Direction column ──────────────────────────────────────────────
    ctx.save();
    ctx.translate(dirX, canvasY);
    ctx.fillStyle = colBg;
    ctx.fillRect(0, 0, colWidth, cellSize);
    ctx.fillStyle = colFg;
    ctx.font = `${Math.round(cellSize * 0.5)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const dir = direction[y] ?? "right";
    const arrow = dir === "right" ? "\u2192" : "\u2190";
    ctx.fillText(arrow, colWidth / 2, cellSize / 2);
    ctx.restore();

    // ── Operations grid ───────────────────────────────────────────────
    for (let x = 0; x < width; x++) {
      const opIndex = ops.pixel(x, y);
      const symbolData = SYMBOL_DATA[opIndex];

      ctx.save();
      ctx.translate(opsX + x * cellSize, canvasY);
      ctx.scale(cellSize, cellSize);

      ctx.fillStyle = symbolData?.color ?? "#555555";
      ctx.fillRect(0, 0, 1, 1);

      if (BACK_OPS.has(opIndex)) {
        ctx.fillStyle = DIM;
        ctx.fillRect(0, 0, 1, 1);
      }

      ctx.lineWidth = 0.03;
      if (symbolData?.path) ctx.stroke(symbolData.path);

      ctx.restore();
    }

    // ── Yarn column ───────────────────────────────────────────────────
    const yarnIndex = yarnFeeder[y] ?? 0;
    ctx.save();
    ctx.translate(yarnX, canvasY);
    if (yarnIndex === 0) {
      ctx.fillStyle = "#555555";
    } else {
      ctx.fillStyle = palette[yarnIndex - 1] ?? "#555555";
    }
    ctx.fillRect(0, 0, colWidth, cellSize);
    ctx.restore();

    // ── Racking column ────────────────────────────────────────────────
    const rack = racking[y] ?? 0;
    ctx.save();
    ctx.translate(rackX, canvasY);
    ctx.fillStyle = colBg;
    ctx.fillRect(0, 0, colWidth, cellSize);
    ctx.fillStyle = colFg;
    ctx.font = `${Math.round(cellSize * 0.45)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(rack), colWidth / 2, cellSize / 2);
    ctx.restore();
  }
}
