import type { Bimp } from "../shared/Bimp";

// ─── Layout mode ─────────────────────────────────────────────────────────────

export type LayoutMode = "technical" | "compressed";

// ─── New input format ────────────────────────────────────────────────────────

export interface KnittingProgram {
  width: number; // number of needles
  height: number; // number of rows
  ops: Bimp; // width × height bitmap of Op values
  yarnFeeder: number[]; // per-row yarn index (1-based)
  direction: ("left" | "right")[]; // per-row carriage direction
  racking: number[]; // per-row bed offset
  palette: string[]; // yarn colors (indexed by yarnFeeder - 1)
}

// ─── Topology output ─────────────────────────────────────────────────────────

export interface TopologyNode {
  gridI: number; // 0..2*width-1 (two sub-positions per needle)
  gridJ: number; // 0..height (grid row)
  row: number; // program row that created this node
  bed: "front" | "back";
  isLeg: boolean; // leg node (lower) vs head node (upper)
  stackIndex: number; // position in z-stack (0 = deepest)
  stackSize: number; // total items in stack at this grid position
}

export interface TopologyResult {
  gridWidth: number; // 2 * program.width
  gridHeight: number; // program.height + 1
  nodes: TopologyNode[];
  yarnPaths: { yarnIndex: number; nodeIndices: number[] }[];
  /** Racking value at the point where topology generation stopped —
   *  applied to all back-bed nodes as a horizontal offset in layout. */
  currentRacking: number;
}

// ─── Downstream types (used by layout, relaxation, renderer) ─────────────────

export type NodeType = {
  pos: number[];
  f: number[];
  v: number[];
  q0: number[];
  q1: number[];
};

export type SegmentType = {
  source: number;
  target: number | undefined;
  sourceOffset: number[] | undefined;
  targetOffset: number[] | undefined;
  restLength: number | undefined;
  leg: [boolean, boolean | undefined];
};

export type YarnSegments = Record<number, SegmentType[]>;

export type ResolvedSegment = {
  source: number;
  target: number;
  sourceOffset: number[];
  targetOffset: number[];
  restLength: number;
};
