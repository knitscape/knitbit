export enum Op {
  MISS = 0,
  FKNIT = 1,
  FTUCK = 2,
  BKNIT = 3,
  BTUCK = 4,
  FTB = 5,
  BTF = 6,
}

export const OP_NAMES: string[] = [
  "MISS",
  "FKNIT",
  "FTUCK",
  "BKNIT",
  "BTUCK",
  "FTB",
  "BTF",
];

export const BACK_OPS = new Set([Op.BKNIT, Op.BTUCK, Op.BTF]);
