import type { NodeType, ResolvedSegment, RelaxSettings } from "./types";

// Hot-loop arithmetic is inlined at the scalar level: every helper that would
// allocate a fresh [x, y, z] in a naive implementation is expanded in place.
// This keeps the inner iteration allocation-free so it doesn't churn the GC.
//
// Matches the semantics of the Vec3 helpers exactly — in particular,
// `normalize([0,0,0])` resolves to zero (not NaN), via a length threshold.

const EPS = 1e-5;

export function yarnRelaxation(settings: RelaxSettings) {
  let ALPHA = 1;
  let running = true;

  function applyYarnForce(
    nodes: NodeType[],
    seg: ResolvedSegment,
    K_YARN: number
  ): void {
    const cn1 = nodes[seg.source];
    const cn2 = nodes[seg.target];
    const p1 = cn1.pos;
    const p2 = cn2.pos;
    const so = seg.sourceOffset;
    const to = seg.targetOffset;

    // currentLength = |p2 - p1|
    const dpx = p2[0] - p1[0];
    const dpy = p2[1] - p1[1];
    const dpz = p2[2] - p1[2];
    const currentLength = Math.sqrt(dpx * dpx + dpy * dpy + dpz * dpz);

    const forceMag = K_YARN * (currentLength - seg.restLength);

    // direction = normalize((p1 + so) - (p2 + to))
    const ox = p1[0] + so[0] - p2[0] - to[0];
    const oy = p1[1] + so[1] - p2[1] - to[1];
    const oz = p1[2] + so[2] - p2[2] - to[2];
    const oLen = Math.sqrt(ox * ox + oy * oy + oz * oz);
    if (oLen <= EPS) return; // normalize would zero out → no force

    const s = (-forceMag * ALPHA) / oLen;
    const fx = ox * s;
    const fy = oy * s;
    const fz = oz * s;

    const f1 = cn1.f;
    f1[0] += fx;
    f1[1] += fy;
    f1[2] += fz;
    const f2 = cn2.f;
    f2[0] -= fx;
    f2[1] -= fy;
    f2[2] -= fz;
  }

  function torsion(
    nodes: NodeType[],
    seg1: ResolvedSegment,
    seg2: ResolvedSegment,
    seg3: ResolvedSegment
  ): void {
    const n1t = nodes[seg1.target].pos;
    const n2s = nodes[seg2.source].pos;
    const n2t = nodes[seg2.target].pos;
    const n3s = nodes[seg3.source].pos;
    const s1to = seg1.targetOffset;
    const s2so = seg2.sourceOffset;
    const s2to = seg2.targetOffset;
    const s3so = seg3.sourceOffset;

    // Segment tangent vectors: v01 = p1 - p0, v12 = p2 - p1, v23 = p3 - p2
    const v01x = n2s[0] + s2so[0] - n1t[0] - s1to[0];
    const v01y = n2s[1] + s2so[1] - n1t[1] - s1to[1];
    const v01z = n2s[2] + s2so[2] - n1t[2] - s1to[2];
    const v12x = n2t[0] + s2to[0] - n2s[0] - s2so[0];
    const v12y = n2t[1] + s2to[1] - n2s[1] - s2so[1];
    const v12z = n2t[2] + s2to[2] - n2s[2] - s2so[2];
    const v23x = n3s[0] + s3so[0] - n2t[0] - s2to[0];
    const v23y = n3s[1] + s3so[1] - n2t[1] - s2to[1];
    const v23z = n3s[2] + s3so[2] - n2t[2] - s2to[2];

    // Normalize each. Mirroring Vec3.normalize, return zeros when too short.
    const l01 = Math.sqrt(v01x * v01x + v01y * v01y + v01z * v01z);
    const l12 = Math.sqrt(v12x * v12x + v12y * v12y + v12z * v12z);
    const l23 = Math.sqrt(v23x * v23x + v23y * v23y + v23z * v23z);
    const i01 = l01 > EPS ? 1 / l01 : 0;
    const i12 = l12 > EPS ? 1 / l12 : 0;
    const i23 = l23 > EPS ? 1 / l23 : 0;
    const t01x = v01x * i01;
    const t01y = v01y * i01;
    const t01z = v01z * i01;
    const t12x = v12x * i12;
    const t12y = v12y * i12;
    const t12z = v12z * i12;
    const t23x = v23x * i23;
    const t23y = v23y * i23;
    const t23z = v23z * i23;

    // B1 = T01 × T12, B2 = T12 × T23
    const b1x = t01y * t12z - t01z * t12y;
    const b1y = t01z * t12x - t01x * t12z;
    const b1z = t01x * t12y - t01y * t12x;
    const b2x = t12y * t23z - t12z * t23y;
    const b2y = t12z * t23x - t12x * t23z;
    const b2z = t12x * t23y - t12y * t23x;

    const bl1 = Math.sqrt(b1x * b1x + b1y * b1y + b1z * b1z);
    const bl2 = Math.sqrt(b2x * b2x + b2y * b2y + b2z * b2z);
    const ib1 = bl1 > EPS ? 1 / bl1 : 0;
    const ib2 = bl2 > EPS ? 1 / bl2 : 0;
    const b1nx = b1x * ib1;
    const b1ny = b1y * ib1;
    const b1nz = b1z * ib1;
    const b2nx = b2x * ib2;
    const b2ny = b2y * ib2;
    const b2nz = b2z * ib2;

    // omega = -acos(dot(B1n, B2n)), clamped to avoid NaN from FP drift.
    let dot = b1nx * b2nx + b1ny * b2ny + b1nz * b2nz;
    if (dot > 1) dot = 1;
    else if (dot < -1) dot = -1;
    let omega = -Math.acos(dot);

    // Sign-flip: if T12 · (B1 × B2) < 0 the bend winds the other way.
    const cbx = b1y * b2z - b1z * b2y;
    const cby = b1z * b2x - b1x * b2z;
    const cbz = b1x * b2y - b1y * b2x;
    if (t12x * cbx + t12y * cby + t12z * cbz < 0) omega = -omega;

    if (omega !== omega) return; // NaN
    const mag = settings.tYarn * ALPHA * omega;
    if (mag === 0) return;

    const m1x = b1nx * mag;
    const m1y = b1ny * mag;
    const m1z = b1nz * mag;
    const m2x = b2nx * mag;
    const m2y = b2ny * mag;
    const m2z = b2nz * mag;

    // Apply as two balanced force couples:
    // (+f1 on seg2.source, -f1 on seg1.source) torques seg1 around its joint,
    // (-f2 on seg2.target, +f2 on seg3.target) torques seg3 around its joint.
    const f_2s = nodes[seg2.source].f;
    f_2s[0] += m1x;
    f_2s[1] += m1y;
    f_2s[2] += m1z;
    const f_2t = nodes[seg2.target].f;
    f_2t[0] -= m2x;
    f_2t[1] -= m2y;
    f_2t[2] -= m2z;
    const f_1s = nodes[seg1.source].f;
    f_1s[0] -= m1x;
    f_1s[1] -= m1y;
    f_1s[2] -= m1z;
    const f_3t = nodes[seg3.target].f;
    f_3t[0] += m2x;
    f_3t[1] += m2y;
    f_3t[2] += m2z;
  }

  function updatePositions(nodes: NodeType[]): void {
    const decay = settings.velocityDecay;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const v = node.v;
      const pos = node.pos;
      const f = node.f;
      const vx = (v[0] + f[0]) * decay;
      const vy = (v[1] + f[1]) * decay;
      const vz = (v[2] + f[2]) * decay;
      v[0] = vx;
      v[1] = vy;
      v[2] = vz;
      pos[0] += vx;
      pos[1] += vy;
      pos[2] += vz;
      f[0] = 0;
      f[1] = 0;
      f[2] = 0;
    }
  }

  function tick(
    yarns: Record<string, ResolvedSegment[]>,
    nodes: NodeType[]
  ): void {
    const { iterations, kYarn, alphaTarget, alphaMin } = settings;
    const alphaDecay = 1 - Math.pow(Math.max(alphaMin, 1e-9), 1 / 300);

    // Hoist the yarn list once per tick instead of once per iteration.
    const yarnList: ResolvedSegment[][] = [];
    for (const k in yarns) yarnList.push(yarns[k]);

    for (let k = 0; k < iterations; ++k) {
      ALPHA += (alphaTarget - ALPHA) * alphaDecay;

      for (let y = 0; y < yarnList.length; y++) {
        const segArr = yarnList[y];
        const n = segArr.length;
        for (let s = 0; s < n; s++) {
          applyYarnForce(nodes, segArr[s], kYarn);
        }
        for (let s = 1; s + 1 < n; s++) {
          torsion(nodes, segArr[s - 1], segArr[s], segArr[s + 1]);
        }
      }

      updatePositions(nodes);
    }

    if (ALPHA < alphaMin) stop();
  }

  function stop(): void {
    running = false;
  }

  return {
    tick,
    stop,
    alpha: () => ALPHA,
    running: () => running,
  };
}
