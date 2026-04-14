import { render } from "lit-html";
import Split from "split.js";

import { drawChart, sidebarLayout, sidebarColumnAt } from "./drawChart";
import { Op } from "./shared/opData";
import { simulate } from "./simulation/simulate";
import { runScript } from "./execute";
import { view, type AppState, type ViewHandlers } from "./view";
import {
  getEditorCode,
  setEditorCode,
  replaceBimpPixels,
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
  activeExample: 0,
  simState: "idle",
  topologyMs: 0,
  tickMs: 0,
  showHelp: false,
  layoutMode: "technical",
  editingBimp: null,
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
  });

  simDraw = result.draw;
  simStop = result.stopSim;
  simRelax = result.relax;
  simIsRelaxing = result.isRelaxing;
  simGetTickMs = result.getTickMs;
  simFitCamera = result.fitCamera;
  setState({ simState: "idle", topologyMs: result.topologyMs, tickMs: 0 });
}

function relaxSimulation() {
  if (simRelax) {
    simRelax();
    setState({ simState: "relaxing" });
  }
}

// ─── Run logic ────────────────────────────────────────────────────────────────

function runWithCode(code: string) {
  try {
    const program = runScript(code);
    lastProgram = program;

    const w = program.width;
    const h = program.height;
    setState({
      statusText: `OK \u2014 ${w}\u00d7${h}`,
      statusClass: "text-green-400",
    });

    renderChart();
    initSimulation();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    setState({ statusText: `Error: ${msg}`, statusClass: "text-red-400" });
  }
}

function runCurrentScript() {
  const code = getEditorCode();
  setState({ code, activeExample: -1 });
  runWithCode(code);
}

function selectExample(i: number) {
  const ex = EXAMPLES[i];
  setState({ code: ex.code, activeExample: i });
  setEditorCode(ex.code);
  runWithCode(ex.code);
}

// ─── Render loop ─────────────────────────────────────────────────────────────

const handlers: ViewHandlers = {
  onZoomIn: () => {
    setState({ cellSize: Math.min(state.cellSize + 4, MAX_CELL) });
    renderChart();
  },

  onZoomOut: () => {
    setState({ cellSize: Math.max(state.cellSize - 4, MIN_CELL) });
    renderChart();
  },

  onSelectExample: selectExample,
  onRelax: relaxSimulation,
  onReset: () => initSimulation(false),
  onFitCamera: () => {
    if (simFitCamera) simFitCamera();
  },
  onRun: runCurrentScript,
  onToggleHelp: () => setState({ showHelp: !state.showHelp }),
  onToggleLayoutMode: () => {
    setState({
      layoutMode: state.layoutMode === "technical" ? "compressed" : "technical",
    });
    initSimulation(false);
  },
  onEditBimp: (target: BimpEditTarget) => {
    setState({
      editingBimp: {
        arrayFrom: target.arrayFrom,
        arrayTo: target.arrayTo,
        width: target.width,
        height: target.height,
        pixels: target.pixels.slice(),
        palette: target.palette ? target.palette.slice() : undefined,
        brushValue: target.pixels[0] ?? 0,
      },
    });
  },
  onBimpCancel: () => setState({ editingBimp: null }),
  onBimpSave: () => {
    if (!state.editingBimp) return;
    const { arrayFrom, arrayTo, pixels } = state.editingBimp;
    replaceBimpPixels(arrayFrom, arrayTo, pixels);
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
  },
  onBimpBrushSelect: (value: number) => {
    if (!state.editingBimp) return;
    setState({ editingBimp: { ...state.editingBimp, brushValue: value } });
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
    chartScroll?.addEventListener("scroll", updateHover);

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
        }
      },
      { passive: false }
    );

    // Auto-run the first example on load
    runWithCode(EXAMPLES[0].code);
  });
}

window.onload = init;
