import { SYMBOL_DATA, BACK_OPS } from "./shared/opData";
import type { Bimp } from "./shared/Bimp";

const DIM = "#0000002a";
const GUTTER = 0.15; // fraction of cell width between sections

export function drawChart(
  sidebarCanvas: HTMLCanvasElement,
  opsCanvas: HTMLCanvasElement,
  ops: Bimp,
  yarnFeeder: number[],
  direction: ("left" | "right")[],
  racking: number[],
  palette: string[],
  cellSize: number
) {
  const { width, height } = ops;

  const gutterPx = Math.round(cellSize * GUTTER);
  const colWidth = cellSize;
  // Sidebar layout (left → right): [racking] [gutter] [yarn] [gutter] [direction]
  const sidebarWidth = colWidth * 3 + gutterPx * 2;
  const opsWidth = width * cellSize;
  const totalHeight = height * cellSize;

  sidebarCanvas.width = sidebarWidth;
  sidebarCanvas.height = totalHeight;
  opsCanvas.width = opsWidth;
  opsCanvas.height = totalHeight;

  const sCtx = sidebarCanvas.getContext("2d")!;
  const oCtx = opsCanvas.getContext("2d")!;
  sCtx.clearRect(0, 0, sidebarWidth, totalHeight);
  oCtx.clearRect(0, 0, opsWidth, totalHeight);

  const styles = getComputedStyle(document.documentElement);
  const colBg = styles.getPropertyValue("--base2").trim() || "#2a2a2a";
  const colFg = styles.getPropertyValue("--base10").trim() || "#ccc";

  const rackX = 0;
  const yarnX = colWidth + gutterPx;
  const dirX = yarnX + colWidth + gutterPx;

  for (let y = 0; y < height; y++) {
    const canvasY = (height - y - 1) * cellSize;

    // ── Racking column ────────────────────────────────────────────────
    const rack = racking[y] ?? 0;
    sCtx.save();
    sCtx.translate(rackX, canvasY);
    sCtx.fillStyle = colBg;
    sCtx.fillRect(0, 0, colWidth, cellSize);
    sCtx.fillStyle = colFg;
    sCtx.font = `${Math.round(cellSize * 0.45)}px monospace`;
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    sCtx.fillText(String(rack), colWidth / 2, cellSize / 2);
    sCtx.restore();

    // ── Yarn column ───────────────────────────────────────────────────
    const yarnIndex = yarnFeeder[y] ?? 0;
    sCtx.save();
    sCtx.translate(yarnX, canvasY);
    sCtx.fillStyle =
      yarnIndex === 0 ? "#555555" : (palette[yarnIndex - 1] ?? "#555555");
    sCtx.fillRect(0, 0, colWidth, cellSize);
    sCtx.restore();

    // ── Direction column ──────────────────────────────────────────────
    sCtx.save();
    sCtx.translate(dirX, canvasY);
    sCtx.fillStyle = colBg;
    sCtx.fillRect(0, 0, colWidth, cellSize);
    sCtx.fillStyle = colFg;
    sCtx.font = `${Math.round(cellSize * 0.5)}px sans-serif`;
    sCtx.textAlign = "center";
    sCtx.textBaseline = "middle";
    const dir = direction[y] ?? "right";
    const arrow = dir === "right" ? "\u2192" : "\u2190";
    sCtx.fillText(arrow, colWidth / 2, cellSize / 2);
    sCtx.restore();

    // ── Operations grid ───────────────────────────────────────────────
    for (let x = 0; x < width; x++) {
      const opIndex = ops.pixel(x, y);
      const symbolData = SYMBOL_DATA[opIndex];

      oCtx.save();
      oCtx.translate(x * cellSize, canvasY);
      oCtx.scale(cellSize, cellSize);

      oCtx.fillStyle = symbolData?.color ?? "#555555";
      oCtx.fillRect(0, 0, 1, 1);

      if (BACK_OPS.has(opIndex)) {
        oCtx.fillStyle = DIM;
        oCtx.fillRect(0, 0, 1, 1);
      }

      oCtx.lineWidth = 0.03;
      if (symbolData?.path) oCtx.stroke(symbolData.path);

      oCtx.restore();
    }
  }
}
