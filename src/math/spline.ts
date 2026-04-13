import { Vec3 } from "./Vec3";

interface Segment {
  a: number[];
  b: number[];
  c: number[];
  d: number[];
}

function catmullRom(
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  tension = 0
): Segment {
  const t01 = Vec3.distance(p0, p1);
  const t12 = Vec3.distance(p1, p2);
  const t23 = Vec3.distance(p2, p3);

  const m1 = [
    (1 - tension) *
      (p2[0] -
        p1[0] +
        t12 * ((p1[0] - p0[0]) / t01 - (p2[0] - p0[0]) / (t01 + t12))),
    (1 - tension) *
      (p2[1] -
        p1[1] +
        t12 * ((p1[1] - p0[1]) / t01 - (p2[1] - p0[1]) / (t01 + t12))),
    (1 - tension) *
      (p2[2] -
        p1[2] +
        t12 * ((p1[2] - p0[2]) / t01 - (p2[2] - p0[2]) / (t01 + t12))),
  ];

  const m2 = [
    (1 - tension) *
      (p2[0] -
        p1[0] +
        t12 * ((p3[0] - p2[0]) / t23 - (p3[0] - p1[0]) / (t12 + t23))),
    (1 - tension) *
      (p2[1] -
        p1[1] +
        t12 * ((p3[1] - p2[1]) / t23 - (p3[1] - p1[1]) / (t12 + t23))),
    (1 - tension) *
      (p2[2] -
        p1[2] +
        t12 * ((p3[2] - p2[2]) / t23 - (p3[2] - p1[2]) / (t12 + t23))),
  ];

  return {
    a: Vec3.add(Vec3.add(Vec3.scale(Vec3.subtract(p1, p2), 2), m1), m2),
    b: Vec3.subtract(
      Vec3.subtract(Vec3.subtract(Vec3.scale(Vec3.subtract(p1, p2), -3), m1), m1),
      m2
    ),
    c: [...m1],
    d: [...p1],
  };
}

function pointInSegment(seg: Segment, t: number): number[] {
  return Vec3.add(
    Vec3.add(
      Vec3.add(Vec3.scale(seg.a, t * t * t), Vec3.scale(seg.b, t * t)),
      Vec3.scale(seg.c, t)
    ),
    seg.d
  );
}

export function buildYarnCurve(
  pts: number[],
  divisions = 5,
  tension = 0.5
): number[] {
  const result: number[] = [];
  for (let i = 0; i < pts.length - 9; i += 3) {
    const cp1 = [pts[i], pts[i + 1], pts[i + 2]];
    const p1 = [pts[i + 3], pts[i + 4], pts[i + 5]];
    const p2 = [pts[i + 6], pts[i + 7], pts[i + 8]];
    const cp2 = [pts[i + 9], pts[i + 10], pts[i + 11]];
    const coefficients = catmullRom(cp1, p1, p2, cp2, tension);

    for (let t = 0; t < 1; t += 1 / divisions) {
      const pt = pointInSegment(coefficients, t);
      result.push(pt[0], pt[1], pt[2]);
    }
  }
  return result;
}
