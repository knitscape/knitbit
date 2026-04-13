import { SYMBOL_DATA, BACK_OPS } from "./shared/chartSymbols";
import type { Bimp } from "./shared/Bimp";
import type { ColorMode } from "./shared/chartSymbols";

const DIM = "#0000002a";

export function drawChart(
  canvas: HTMLCanvasElement,
  mode: ColorMode,
  opsChart: Bimp,
  yarnFeeder: number[],
  palette: string[],
  cellWidth: number,
  cellHeight: number
) {
  const { width, height } = opsChart;

  const ctx = canvas.getContext("2d")!;
  ctx.lineWidth = 0.03;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const opIndex = opsChart.pixel(x, y);
      const yarnIndex = yarnFeeder[y] ?? 0;

      ctx.save();
      ctx.translate(x * cellWidth, (height - y - 1) * cellHeight);
      ctx.scale(cellWidth, cellHeight);

      const symbolData = SYMBOL_DATA[opIndex];

      if (mode === "operation") {
        ctx.fillStyle = symbolData?.color ?? "#555555";
        ctx.fillRect(0, 0, 1, 1);
      } else if (mode === "yarn") {
        if (yarnIndex === 0) {
          ctx.fillStyle = "#555555";
        } else {
          ctx.fillStyle = palette[yarnIndex - 1] ?? "#555555";
        }
        ctx.fillRect(0, 0, 1, 1);

        if (BACK_OPS.has(opIndex)) {
          ctx.fillStyle = DIM;
          ctx.fillRect(0, 0, 1, 1);
        }
      }

      if (symbolData?.path) ctx.stroke(symbolData.path);

      ctx.restore();
    }
  }
}
