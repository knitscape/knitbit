import { render } from "lit-html";
import Split from "split.js";

import { drawChart } from "./drawChart";
import { simulate } from "./simulation/simulate";
import { runScript } from "./execute";
import { view, type AppState, type ViewHandlers } from "./view";
import { getEditorCode, setEditorCode } from "./editor";
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

    // Escape closes the help modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.showHelp) {
        e.preventDefault();
        setState({ showHelp: false });
      }
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
        }
      },
      { passive: false }
    );

    // Auto-run the first example on load
    runWithCode(EXAMPLES[0].code);
  });
}

window.onload = init;
