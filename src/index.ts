import { render } from "lit-html";
import Split from "split.js";

import { drawChart, sidebarLayout, sidebarColumnAt } from "./drawChart";
import { Op } from "./shared/opData";
import {
  encodeOpsBmp,
  encodeControlJson,
  triggerDownload,
} from "./download";
import { simulate } from "./simulation/simulate";
import { countStitches } from "./simulation/topology";
import { runScript } from "./execute";
import { view, type AppState, type ViewHandlers } from "./view";
import {
  getEditorCode,
  setEditorCode,
  replaceBimpExpression,
  formatBimpExpression,
  type BimpEditTarget,
} from "./editor";
import { EXAMPLES } from "./examples";
import type { KnittingProgram } from "./simulation/types";

const MIN_CELL = 6;
const MAX_CELL = 80;

let state: AppState = {
  code: EXAMPLES[0].code,
  cellSize: 20,
  statusText: "Press Run or Ctrl+Enter to generate the chart.",
  statusClass: "text-[color:var(--base7)]",
  showExamplePicker: false,
  simState: "idle",
  topologyMs: 0,
  tickMs: 0,
  showHelp: false,
  layoutMode: "compressed",
  editingBimp: null,
  maxStitch: 0,
  totalStitches: 0,
  autoRun: false,
};

// Last successful program — kept so we can re-render on zoom/mode changes
let lastProgram: KnittingProgram | null = null;

// Simulation handles
let simDraw: (() => void) | undefined;
let simStop: (() => void) | undefined;
let simRelax: (() => void) | undefined;
let simIsRelaxing: (() => boolean) | undefined;
let simGetTickMs: (() => number) | undefined;
let simFitCamera: (() => void) | undefined;
let simSetMaxStitch: ((n: number) => void) | undefined;

let needsRender = true;

function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  needsRender = true;
}

// ─── Chart rendering ──────────────────────────────────────────────────────────

function renderChart() {
  if (!lastProgram) return;
  const opsCanvas = document.getElementById(
    "chart-canvas"
  ) as HTMLCanvasElement | null;
  const sidebarCanvas = document.getElementById(
    "chart-sidebar"
  ) as HTMLCanvasElement | null;
  if (!opsCanvas || !sidebarCanvas) return;

  drawChart(
    sidebarCanvas,
    opsCanvas,
    lastProgram.ops,
    lastProgram.yarnFeeder,
    lastProgram.direction,
    lastProgram.racking,
    lastProgram.palette,
    state.cellSize
  );
}

// ─── Scrub-cursor highlight ──────────────────────────────────────────────────

/**
 * Walk the program in carriage order and find the (row, col) of the Nth
 * knit/tuck operation. Returns null when N is 0 or past the end.
 */
function stitchToRowCol(
  program: KnittingProgram,
  n: number
): { row: number; col: number } | null {
  if (n <= 0) return null;
  const w = program.width;
  const h = program.height;
  let count = 0;
  for (let row = 0; row < h; row++) {
    const dir = program.direction[row];
    for (let i = 0; i < w; i++) {
      const col = dir === "right" ? i : w - 1 - i;
      const op = program.ops.pixel(col, row);
      if (op === Op.MISS) continue;
      count++;
      if (count === n) return { row, col };
    }
  }
  return null;
}

function updateScrubHighlight() {
  const rowEl = document.getElementById("chart-scrub-row");
  const cellEl = document.getElementById("chart-scrub-cell");
  if (!rowEl || !cellEl) return;

  if (!lastProgram) {
    rowEl.classList.add("hidden");
    cellEl.classList.add("hidden");
    return;
  }

  const pos = stitchToRowCol(lastProgram, state.maxStitch);
  if (!pos) {
    rowEl.classList.add("hidden");
    cellEl.classList.add("hidden");
    return;
  }

  const opsCanvas = document.getElementById(
    "chart-canvas"
  ) as HTMLCanvasElement | null;
  const chartContent = document.getElementById("chart-content");
  if (!opsCanvas || !chartContent) return;

  const cs = state.cellSize;
  const h = lastProgram.height;
  const rowFromTop = h - 1 - pos.row;
  const opsRect = opsCanvas.getBoundingClientRect();
  const contentRect = chartContent.getBoundingClientRect();

  const rowTop = opsRect.top - contentRect.top + rowFromTop * cs;
  rowEl.style.top = `${rowTop}px`;
  rowEl.style.height = `${cs}px`;
  rowEl.classList.remove("hidden");

  // Cell marker lives inside the canvas wrapper, so coords are in
  // canvas-local pixel space.
  cellEl.style.top = `${rowFromTop * cs}px`;
  cellEl.style.left = `${pos.col * cs}px`;
  cellEl.style.width = `${cs}px`;
  cellEl.style.height = `${cs}px`;
  cellEl.classList.remove("hidden");
}

// ─── Simulation ───────────────────────────────────────────────────────────────

function initSimulation(resetCamera = true) {
  if (!lastProgram) return;

  if (simStop) {
    simStop();
    simStop = undefined;
    simDraw = undefined;
    simRelax = undefined;
    simIsRelaxing = undefined;
    simGetTickMs = undefined;
    simSetMaxStitch = undefined;
  }

  const simCanvas = document.getElementById(
    "sim-canvas"
  ) as HTMLCanvasElement | null;
  if (!simCanvas) return;

  const result = simulate(lastProgram, {
    canvas: simCanvas,
    cellAspect: 1,
    resetCamera,
    layoutMode: state.layoutMode,
    maxStitch: state.maxStitch,
  });

  simDraw = result.draw;
  simStop = result.stopSim;
  simRelax = result.relax;
  simIsRelaxing = result.isRelaxing;
  simGetTickMs = result.getTickMs;
  simFitCamera = result.fitCamera;
  simSetMaxStitch = result.setMaxStitch;
  setState({ simState: "idle", topologyMs: result.topologyMs, tickMs: 0 });
}

function relaxSimulation() {
  if (simRelax) {
    simRelax();
    setState({ simState: "relaxing" });
  }
}

// ─── Run logic ────────────────────────────────────────────────────────────────

function runWithCode(code: string, resetView = false) {
  try {
    const program = runScript(code);
    lastProgram = program;

    const w = program.width;
    const h = program.height;
    const total = countStitches(program);

    // If the user was scrubbing, keep their position (clamped to the new
    // total) instead of jumping back to the end on every re-run.
    const nextMaxStitch = resetView
      ? total
      : Math.min(state.maxStitch, total);

    setState({
      statusText: `OK \u2014 ${w}\u00d7${h}`,
      statusClass: "text-green-400",
      totalStitches: total,
      maxStitch: nextMaxStitch,
    });

    renderChart();
    updateScrubHighlight();
    initSimulation(resetView);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    setState({ statusText: `Error: ${msg}`, statusClass: "text-red-400" });
  }
}

function runCurrentScript() {
  let code = getEditorCode();
  // If the bitmap editor is open, splice its in-progress state into the code
  // so the chart/sim preview reflects the live edits without touching the doc.
  if (state.editingBimp) {
    const e = state.editingBimp;
    const replacement = formatBimpExpression(
      e.width,
      e.height,
      e.pixels,
      e.palette
    );
    code = code.slice(0, e.exprFrom) + replacement + code.slice(e.exprTo);
  }
  setState({ code });
  runWithCode(code);
}

let autoRunTimer: number | undefined;
function scheduleAutoRun() {
  if (!state.autoRun) return;
  if (autoRunTimer !== undefined) clearTimeout(autoRunTimer);
  autoRunTimer = window.setTimeout(() => {
    autoRunTimer = undefined;
    if (state.autoRun) runCurrentScript();
  }, 250);
}

function selectExample(i: number) {
  const ex = EXAMPLES[i];
  setState({ code: ex.code, showExamplePicker: false });
  setEditorCode(ex.code);
  runWithCode(ex.code, true);
}

// ─── Render loop ─────────────────────────────────────────────────────────────

const handlers: ViewHandlers = {
  onZoomIn: () => {
    setState({ cellSize: Math.min(state.cellSize + 4, MAX_CELL) });
    renderChart();
    updateScrubHighlight();
  },

  onZoomOut: () => {
    setState({ cellSize: Math.max(state.cellSize - 4, MIN_CELL) });
    renderChart();
    updateScrubHighlight();
  },

  onSelectExample: selectExample,
  onRelax: relaxSimulation,
  onReset: () => initSimulation(false),
  onFitCamera: () => {
    if (simFitCamera) simFitCamera();
  },
  onRun: runCurrentScript,
  onToggleHelp: () => setState({ showHelp: !state.showHelp }),
  onToggleExamplePicker: () =>
    setState({ showExamplePicker: !state.showExamplePicker }),
  onToggleLayoutMode: () => {
    setState({
      layoutMode: state.layoutMode === "technical" ? "compressed" : "technical",
    });
    initSimulation(false);
  },
  onScrub: (n: number) => {
    const clamped = Math.max(0, Math.min(n, state.totalStitches));
    setState({ maxStitch: clamped, simState: "idle" });
    if (simSetMaxStitch) simSetMaxStitch(clamped);
    updateScrubHighlight();
  },
  onEditBimp: (target: BimpEditTarget) => {
    setState({
      editingBimp: {
        exprFrom: target.exprFrom,
        exprTo: target.exprTo,
        width: target.width,
        height: target.height,
        pixels: target.pixels.slice(),
        palette: target.palette ? target.palette.slice() : undefined,
        brushValue: target.pixels[0] ?? 0,
      },
    });
  },
  onBimpCancel: () => {
    const wasEditing = !!state.editingBimp;
    setState({ editingBimp: null });
    // Revert any preview by re-running with the actual (un-edited) doc.
    if (wasEditing && state.autoRun) runCurrentScript();
  },
  onBimpSave: () => {
    if (!state.editingBimp) return;
    const { exprFrom, exprTo, width, height, pixels, palette } =
      state.editingBimp;
    replaceBimpExpression(exprFrom, exprTo, width, height, pixels, palette);
    setState({ editingBimp: null });
    runCurrentScript();
  },
  onBimpCellPaint: (idx: number) => {
    if (!state.editingBimp) return;
    const cur = state.editingBimp;
    if (cur.pixels[idx] === cur.brushValue) return;
    const pixels = cur.pixels.slice();
    pixels[idx] = cur.brushValue;
    setState({ editingBimp: { ...cur, pixels } });
    if (state.autoRun) runCurrentScript();
  },
  onBimpBrushSelect: (value: number) => {
    if (!state.editingBimp) return;
    setState({ editingBimp: { ...state.editingBimp, brushValue: value } });
  },
  onBimpResize: (newWidth: number, newHeight: number) => {
    if (!state.editingBimp) return;
    const cur = state.editingBimp;
    const w = Math.max(1, Math.min(64, Math.floor(newWidth)));
    const h = Math.max(1, Math.min(64, Math.floor(newHeight)));
    if (w === cur.width && h === cur.height) return;
    const pixels = new Array(w * h).fill(0);
    for (let y = 0; y < Math.min(h, cur.height); y++) {
      for (let x = 0; x < Math.min(w, cur.width); x++) {
        pixels[y * w + x] = cur.pixels[y * cur.width + x];
      }
    }
    setState({ editingBimp: { ...cur, width: w, height: h, pixels } });
    if (state.autoRun) runCurrentScript();
  },
  onBimpPaletteColorChange: (index: number, color: string) => {
    if (!state.editingBimp) return;
    const cur = state.editingBimp;
    const palette = (cur.palette ?? []).slice();
    if (index < 0 || index >= palette.length) return;
    if (palette[index] === color) return;
    palette[index] = color;
    setState({ editingBimp: { ...cur, palette } });
    if (state.autoRun) runCurrentScript();
  },
  onBimpPaletteAdd: () => {
    if (!state.editingBimp) return;
    const cur = state.editingBimp;
    const palette = (cur.palette ?? []).slice();
    palette.push("#888888");
    setState({ editingBimp: { ...cur, palette } });
    if (state.autoRun) runCurrentScript();
  },
  onToggleAutoRun: () => {
    const next = !state.autoRun;
    setState({ autoRun: next });
    // Turning auto-run on should sync the view with the current code.
    if (next) runCurrentScript();
  },
  onDocChange: () => scheduleAutoRun(),
  onDownloadBmp: () => {
    if (!lastProgram) return;
    triggerDownload(
      encodeOpsBmp(lastProgram.ops),
      "program.bmp",
      "image/bmp"
    );
  },
  onDownloadJson: () => {
    if (!lastProgram) return;
    triggerDownload(
      encodeControlJson(lastProgram),
      "program.json",
      "application/json"
    );
  },
};

function loop() {
  if (needsRender) {
    needsRender = false;
    render(view(state, handlers), document.body);
  }

  if (simDraw) simDraw();

  // Update tick timing and detect when relaxation finishes
  if (state.simState === "relaxing") {
    if (simGetTickMs) {
      setState({ tickMs: simGetTickMs() });
    }
    if (simIsRelaxing && !simIsRelaxing()) {
      setState({ simState: "relaxed" });
    }
  }

  requestAnimationFrame(loop);
}

// ─── Initialisation ───────────────────────────────────────────────────────────

function init() {
  loop();

  requestAnimationFrame(() => {
    Split(["#editor-pane", "#preview-pane"], {
      sizes: [50, 50],
      minSize: 200,
      gutterSize: 6,
    });

    Split(["#code-pane", "#chart-pane"], {
      sizes: [50, 50],
      minSize: 80,
      gutterSize: 6,
      direction: "vertical",
    });

    // Escape closes any open modal
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (state.editingBimp) {
        e.preventDefault();
        setState({ editingBimp: null });
      } else if (state.showHelp) {
        e.preventDefault();
        setState({ showHelp: false });
      } else if (state.showExamplePicker) {
        e.preventDefault();
        setState({ showExamplePicker: false });
      }
    });

    // Sync sidebar vertical position with the ops scroll container, and
    // forward wheel scrolls over the sidebar (it has overflow:hidden) to it.
    const chartScroll = document.getElementById("chart-scroll");
    const sidebarInner = document.getElementById("chart-sidebar-inner");
    const sidebarWrap = document.getElementById("chart-sidebar-wrap");
    chartScroll?.addEventListener("scroll", () => {
      if (sidebarInner)
        sidebarInner.style.transform = `translateY(${-chartScroll.scrollTop}px)`;
    });
    sidebarWrap?.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.metaKey || !chartScroll) return;
        e.preventDefault();
        chartScroll.scrollBy({ top: e.deltaY, left: e.deltaX });
      },
      { passive: false }
    );

    // Drag-to-pan: ops grid pans both axes, sidebar drags vertically only.
    const startPan = (e: PointerEvent, allowX: boolean) => {
      if (e.button !== 0 || !chartScroll) return;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const startScrollLeft = chartScroll.scrollLeft;
      const startScrollTop = chartScroll.scrollTop;
      document.body.style.cursor = "grabbing";

      const onMove = (ev: PointerEvent) => {
        chartScroll.scrollTop = startScrollTop - (ev.clientY - startY);
        if (allowX)
          chartScroll.scrollLeft = startScrollLeft - (ev.clientX - startX);
      };
      const onEnd = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onEnd);
        target.removeEventListener("pointercancel", onEnd);
        document.body.style.cursor = "";
      };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onEnd);
      target.addEventListener("pointercancel", onEnd);
      e.preventDefault();
    };
    chartScroll?.addEventListener("pointerdown", (e) => startPan(e, true));
    sidebarWrap?.addEventListener("pointerdown", (e) => startPan(e, false));

    // Hover: track row/col under cursor, update bottom-bar text and row stripe.
    const chartContent = document.getElementById("chart-content");
    const opsCanvas = document.getElementById(
      "chart-canvas"
    ) as HTMLCanvasElement | null;
    const sidebarCanvas = document.getElementById(
      "chart-sidebar"
    ) as HTMLCanvasElement | null;
    const coordEl = document.getElementById("chart-coord");
    const rowHighlight = document.getElementById("chart-row-highlight");
    const colHighlight = document.getElementById("chart-col-highlight");
    let lastMouse: { x: number; y: number } | null = null;

    const hideHover = () => {
      if (coordEl) coordEl.innerHTML = "&nbsp;";
      if (rowHighlight) rowHighlight.classList.add("hidden");
      if (colHighlight) colHighlight.classList.add("hidden");
    };

    const updateHover = () => {
      if (!lastMouse || !lastProgram || !opsCanvas || !chartContent)
        return hideHover();
      const cs = state.cellSize;
      const h = lastProgram.height;
      const w = lastProgram.width;

      const opsRect = opsCanvas.getBoundingClientRect();
      const yInCanvas = lastMouse.y - opsRect.top;
      const rowFromTop = Math.floor(yInCanvas / cs);
      if (rowFromTop < 0 || rowFromTop >= h) return hideHover();
      const row = h - 1 - rowFromTop;

      const xInCanvas = lastMouse.x - opsRect.left;
      const overOps =
        xInCanvas >= 0 && xInCanvas < w * cs && lastMouse.x <= opsRect.right;
      const col = overOps ? Math.floor(xInCanvas / cs) : -1;

      let label = `row ${row + 1}`;
      if (overOps) {
        const opIdx = lastProgram.ops.pixel(col, row);
        const opName = Op[opIdx] ?? "?";
        label = `row ${row + 1}, col ${col + 1} \u2014 Op.${opName}`;
      } else if (sidebarCanvas) {
        const sbRect = sidebarCanvas.getBoundingClientRect();
        const xInSb = lastMouse.x - sbRect.left;
        const layout = sidebarLayout(h);
        const which = sidebarColumnAt(xInSb, layout);
        if (which === "racking") {
          label += `, racking ${lastProgram.racking[row] ?? 0}`;
        } else if (which === "yarn") {
          label += `, yarn ${lastProgram.yarnFeeder[row] ?? 0}`;
        } else if (which === "direction") {
          label += `, direction ${lastProgram.direction[row] ?? "right"}`;
        }
      }
      if (coordEl) coordEl.textContent = label;

      if (rowHighlight) {
        const contentRect = chartContent.getBoundingClientRect();
        const top = opsRect.top - contentRect.top + rowFromTop * cs;
        rowHighlight.style.top = `${top}px`;
        rowHighlight.style.height = `${cs}px`;
        rowHighlight.classList.remove("hidden");
      }
      if (colHighlight) {
        if (overOps) {
          colHighlight.style.left = `${col * cs}px`;
          colHighlight.style.top = "0";
          colHighlight.style.width = `${cs}px`;
          colHighlight.style.height = `${h * cs}px`;
          colHighlight.classList.remove("hidden");
        } else {
          colHighlight.classList.add("hidden");
        }
      }
    };

    chartContent?.addEventListener("mousemove", (e) => {
      lastMouse = { x: e.clientX, y: e.clientY };
      updateHover();
    });
    chartContent?.addEventListener("mouseleave", () => {
      lastMouse = null;
      hideHover();
    });
    chartScroll?.addEventListener("scroll", () => {
      updateHover();
      updateScrubHighlight();
    });

    // Ctrl+scroll to zoom on the chart pane
    const chartPane = document.getElementById("chart-pane");
    chartPane?.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 2 : -2;
          setState({
            cellSize: Math.max(
              MIN_CELL,
              Math.min(state.cellSize + delta, MAX_CELL)
            ),
          });
          renderChart();
          updateScrubHighlight();
        }
      },
      { passive: false }
    );

    // Auto-run the first example on load
    runWithCode(EXAMPLES[0].code, true);
  });
}

window.onload = init;
