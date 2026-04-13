import { Bimp } from "./shared/Bimp";
import { Op } from "./shared/stitches";
import type { KnittingProgram } from "./simulation/types";

export function runScript(code: string): KnittingProgram {
  // eslint-disable-next-line no-new-func
  const fn = new Function("Bimp", "Op", code);
  const result = fn(Bimp, Op);

  if (!result || typeof result !== "object") {
    throw new Error("Script must return an object");
  }
  if (!(result.ops instanceof Bimp)) {
    throw new Error("result.ops must be a Bimp instance");
  }
  if (!Array.isArray(result.yarnFeeder)) {
    throw new Error("result.yarnFeeder must be an array");
  }
  if (!Array.isArray(result.direction)) {
    throw new Error("result.direction must be an array");
  }
  if (!Array.isArray(result.palette)) {
    throw new Error("result.palette must be an array of color strings");
  }

  const width = result.ops.width;
  const height = result.ops.height;

  // Default racking to all zeros if not provided
  const racking: number[] = result.racking ?? new Array(height).fill(0);

  return {
    width,
    height,
    ops: result.ops,
    yarnFeeder: result.yarnFeeder,
    direction: result.direction,
    racking,
    palette: result.palette,
  };
}
