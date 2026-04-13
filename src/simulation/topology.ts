import { Op } from "../shared/stitches";
import type { KnittingProgram, TopologyNode, TopologyResult } from "./types";

interface Loop {
  id: number;
}

export function generateTopology(program: KnittingProgram): TopologyResult {
  const { width, height } = program;
  const gridWidth = 2 * width;
  const gridHeight = height + 1;

  // Needle bed state — each needle holds a stack of loops (bottom → top)
  const frontBed: Loop[][] = Array.from({ length: width }, () => []);
  const backBed: Loop[][] = Array.from({ length: width }, () => []);

  // Output nodes and per-yarn paths
  const nodes: TopologyNode[] = [];
  const yarnPathMap = new Map<number, number[]>();

  // Track how many contact nodes are stacked at each grid position.
  // Used to assign stackIndex to each new node. stackSize is filled in
  // during a post-processing pass once all nodes exist.
  const stackAt = new Map<string, number>();

  function addNode(
    gridI: number,
    gridJ: number,
    row: number,
    bed: "front" | "back",
    isLeg: boolean
  ): number {
    const key = `${gridI},${gridJ}`;
    const stackIndex = stackAt.get(key) || 0;
    stackAt.set(key, stackIndex + 1);

    const idx = nodes.length;
    nodes.push({ gridI, gridJ, row, bed, isLeg, stackIndex, stackSize: -1 });
    return idx;
  }

  let nextLoopId = 0;

  // ── Initialise: pre-populate the front bed with one loop per needle ──────
  for (let n = 0; n < width; n++) {
    frontBed[n] = [{ id: nextLoopId++ }];
  }

  // ── Process each program row ─────────────────────────────────────────────
  for (let row = 0; row < height; row++) {
    const dir = program.direction[row];
    const yarn = program.yarnFeeder[row];
    const rack = program.racking[row];

    // Traverse needles in carriage direction
    const needles =
      dir === "right"
        ? Array.from({ length: width }, (_, i) => i)
        : Array.from({ length: width }, (_, i) => width - 1 - i);

    // Ensure a yarn path array exists
    if (!yarnPathMap.has(yarn)) yarnPathMap.set(yarn, []);
    const path = yarnPathMap.get(yarn)!;

    for (const n of needles) {
      const op = program.ops.pixel(n, row);

      // ── MISS: yarn floats past, no contact nodes ─────────────────────
      if (op === Op.MISS) continue;

      // ── Transfers: move loops between beds ───────────────────────────
      if (op === Op.FTB) {
        const dest = n + rack;
        if (dest >= 0 && dest < width) {
          backBed[dest].push(...frontBed[n]);
          frontBed[n] = [];
        }
        continue;
      }
      if (op === Op.BTF) {
        const dest = n - rack;
        if (dest >= 0 && dest < width) {
          frontBed[dest].push(...backBed[n]);
          backBed[n] = [];
        }
        continue;
      }

      // ── Knit or Tuck: create contact nodes ───────────────────────────
      const isFront = op === Op.FKNIT || op === Op.FTUCK;
      const isKnit = op === Op.FKNIT || op === Op.BKNIT;
      const bed: "front" | "back" = isFront ? "front" : "back";
      const bedArray = isFront ? frontBed : backBed;

      // Grid row for legs (lower, interlocking) and heads (upper, top of loop)
      const legRow = row;
      const headRow = row + 1;

      // Sub-needle positions depend on carriage direction:
      //   right → first=2n (left foot), second=2n+1 (right foot)
      //   left  → first=2n+1 (right foot), second=2n (left foot)
      const iFirst = dir === "right" ? 2 * n : 2 * n + 1;
      const iSecond = dir === "right" ? 2 * n + 1 : 2 * n;

      if (isKnit) {
        // Square wave: leg → head → head → leg
        const leg1 = addNode(iFirst, legRow, row, bed, true);
        const head1 = addNode(iFirst, headRow, row, bed, false);
        const head2 = addNode(iSecond, headRow, row, bed, false);
        const leg2 = addNode(iSecond, legRow, row, bed, true);
        path.push(leg1, head1, head2, leg2);

        // Knock off old loops, replace with new loop
        bedArray[n] = [{ id: nextLoopId++ }];
      } else {
        // Tuck: only head nodes (legs are not anchored)
        const head1 = addNode(iFirst, headRow, row, bed, false);
        const head2 = addNode(iSecond, headRow, row, bed, false);
        path.push(head1, head2);

        // Accumulate on the needle without removing existing loops
        bedArray[n].push({ id: nextLoopId++ });
      }
    }
  }

  // ── Post-process: fill in stackSize for every node ───────────────────────
  for (const node of nodes) {
    node.stackSize = stackAt.get(`${node.gridI},${node.gridJ}`) || 1;
  }

  // ── Build output ─────────────────────────────────────────────────────────
  const yarnPaths = Array.from(yarnPathMap.entries()).map(
    ([yarnIndex, nodeIndices]) => ({ yarnIndex, nodeIndices })
  );

  return { gridWidth, gridHeight, nodes, yarnPaths };
}
