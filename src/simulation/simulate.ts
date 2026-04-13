import { hexToRgb } from "../shared/hexToRgb";
import { yarnRelaxation } from "./relaxation";
import {
  segmentsToPoints,
  computeYarnPathSpline,
  layoutNodes,
} from "./layout";
import { generateTopology } from "./topology";
import type { KnittingProgram } from "./types";

import { noodleRenderer } from "./renderer";

let renderer = noodleRenderer;

const YARN_DIAMETER = 0.27;
const STITCH_WIDTH = 1;
const BED_OFFSET = 0.1;

export interface SimulateOptions {
  canvas: HTMLCanvasElement;
  cellAspect: number;
  resetCamera?: boolean;
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
  let relaxed = false;
  let sim: ReturnType<typeof yarnRelaxation> | undefined;
  let lastTickMs = 0;

  const t0 = performance.now();

  const topology = generateTopology(program);
  const { nodes, nodeMap } = layoutNodes(topology, program, params);
  const segments = computeYarnPathSpline(
    topology,
    program,
    nodes,
    nodeMap,
    params
  );

  const topologyMs = performance.now() - t0;

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

  renderer.init(yarnData, canvas, options.resetCamera ?? true);

  function draw() {
    if (sim && sim.running()) {
      const tickStart = performance.now();
      sim.tick(segments as any, nodes);

      for (let i = 0; i < yarnData.length; i++) {
        yarnData[i].pts = segmentsToPoints(
          segments[Number(yarnData[i].yarnIndex)],
          nodes
        );
      }

      renderer.updateYarnGeometry(yarnData);
      lastTickMs = performance.now() - tickStart;
    }
    renderer.draw();
  }

  function relax() {
    if (relaxed) return;
    sim = yarnRelaxation();
    relaxed = true;
  }

  function stopSim() {
    if (sim) sim.stop();
  }

  function isRelaxing() {
    return sim !== undefined && sim.running();
  }

  return {
    relax,
    stopSim,
    draw,
    isRelaxing,
    topologyMs,
    getTickMs: () => lastTickMs,
    fitCamera: () => renderer.fitCamera(),
  };
}
