import { hexToRgb } from "../shared/hexToRgb";
import {
  segmentsToPoints,
  computeYarnPathSpline,
  layoutNodes,
} from "./layout";
import { generateTopology } from "./topology";
import {
  DEFAULT_RELAX_SETTINGS,
  type KnittingProgram,
  type LayoutMode,
  type RelaxSettings,
} from "./types";
import type {
  WorkerCommand,
  WorkerTick,
} from "./relaxation.worker";

import { noodleRenderer } from "./renderer";

let renderer = noodleRenderer;

const YARN_DIAMETER = 0.27;
const STITCH_WIDTH = 1;
const BED_OFFSET = 0.25;

export interface SimulateOptions {
  canvas: HTMLCanvasElement;
  cellAspect: number;
  resetCamera?: boolean;
  layoutMode?: LayoutMode;
  maxStitch?: number;
  relaxSettings?: RelaxSettings;
}

export function simulate(program: KnittingProgram, options: SimulateOptions) {
  const ASPECT = options.cellAspect;
  const params = {
    YARN_RADIUS: YARN_DIAMETER / 2,
    STITCH_WIDTH,
    ASPECT,
    BED_OFFSET,
  };

  const canvas = options.canvas;
  const layoutMode: LayoutMode = options.layoutMode ?? "technical";
  const relaxSettings: RelaxSettings =
    options.relaxSettings ?? { ...DEFAULT_RELAX_SETTINGS };

  // Worker state mirrored on the main thread for the panel readouts.
  let lastTickMs = 0;
  let currentAlpha = 1;
  let running = false;
  let everStarted = false;

  function buildGeometry(maxStitch: number) {
    const topology = generateTopology(program, layoutMode, maxStitch);
    const { nodes, nodeMap } = layoutNodes(topology, program, params);
    const segments = computeYarnPathSpline(
      topology,
      program,
      nodes,
      nodeMap,
      params
    );
    const yarnData = Object.entries(segments).map(([yarnIndex, segmentArr]) => {
      return {
        yarnIndex: yarnIndex,
        pts: segmentsToPoints(segmentArr, nodes),
        diameter: YARN_DIAMETER,
        color: hexToRgb(program.palette[Number(yarnIndex) - 1]).map(
          (colorInt: number) => colorInt / 255
        ),
      };
    });
    return { nodes, segments, yarnData };
  }

  const t0 = performance.now();
  let { nodes, segments, yarnData } = buildGeometry(
    options.maxStitch ?? Infinity
  );
  const topologyMs = performance.now() - t0;

  renderer.init(yarnData, canvas, options.resetCamera ?? true);

  // ─── Worker wiring ──────────────────────────────────────────────────────────

  const worker = new Worker(
    new URL("./relaxation.worker.ts", import.meta.url),
    { type: "module" }
  );

  const send = (msg: WorkerCommand, transfer?: Transferable[]) => {
    worker.postMessage(msg, transfer ?? []);
  };

  function sendInit() {
    send({
      type: "init",
      nodes,
      segments,
      settings: relaxSettings,
    });
  }

  // Worker posts new control points per tick. We copy them into yarnData so
  // the existing renderer pipeline (updateYarnGeometry → draw) picks them up
  // on the next animation frame. The array is Float32Array → number[] because
  // buildYarnCurve is typed for number[]; the copy is cheap vs. a tick.
  worker.onmessage = (e: MessageEvent<WorkerTick>) => {
    const msg = e.data;
    if (msg.type !== "tick") return;
    for (const yd of yarnData) {
      const key = Number(yd.yarnIndex);
      const arr = msg.pts[key];
      if (arr) yd.pts = Array.from(arr);
    }
    currentAlpha = msg.alpha;
    lastTickMs = msg.tickMs;
    running = msg.running;
  };

  sendInit();

  // ─── Public API ─────────────────────────────────────────────────────────────

  function draw() {
    // The tick loop now runs in the worker; the main thread just keeps the
    // renderer fed with whatever pts arrived most recently.
    if (everStarted) {
      renderer.updateYarnGeometry(yarnData);
    }
    renderer.draw();
  }

  function relax() {
    if (everStarted) return;
    send({ type: "start" });
    running = true;
    everStarted = true;
  }

  function restart() {
    send({ type: "restart" });
    running = true;
    everStarted = true;
  }

  function stopSim() {
    send({ type: "stop" });
    running = false;
  }

  function isRelaxing() {
    return running;
  }

  function updateSettings(partial: Partial<RelaxSettings>) {
    Object.assign(relaxSettings, partial);
    send({ type: "setSettings", settings: partial });
  }

  function setMaxStitch(n: number) {
    send({ type: "stop" });
    running = false;
    everStarted = false;
    ({ nodes, segments, yarnData } = buildGeometry(n));
    renderer.init(yarnData, canvas, false);
    sendInit();
  }

  function terminate() {
    worker.terminate();
  }

  return {
    relax,
    restart,
    stopSim,
    draw,
    isRelaxing,
    setMaxStitch,
    updateSettings,
    terminate,
    topologyMs,
    getTickMs: () => lastTickMs,
    getAlpha: () => currentAlpha,
    fitCamera: () => renderer.fitCamera(),
  };
}
