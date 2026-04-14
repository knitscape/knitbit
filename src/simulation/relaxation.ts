import { Vec3 } from "../math/Vec3";
import type { NodeType, ResolvedSegment } from "./types";

export function yarnRelaxation(
  kYarn = 0.4,
  tYarn = 0.01,
  alphaMin = 0.001,
  alphaTarget = 0,
  iterations = 4,
  velocityDecay = 0.5
) {
  let ALPHA = 1;
  const ALPHA_MIN = alphaMin;
  const ALPHA_TARGET = alphaTarget;
  const ALPHA_DECAY = 1 - Math.pow(ALPHA_MIN, 1 / 300);

  let running = true;

  function applyYarnForce(
    nodes: NodeType[],
    seg: ResolvedSegment,
    K_YARN: number
  ): void {
    const cn1 = nodes[seg.source];
    const cn2 = nodes[seg.target];

    const offset1 = Vec3.add(cn1.pos, seg.sourceOffset);
    const offset2 = Vec3.add(cn2.pos, seg.targetOffset);

    const p1 = cn1.pos;
    const p2 = cn2.pos;

    const currentLength = Vec3.magnitude(Vec3.subtract(p2, p1));
    const forceMagnitude = K_YARN * (currentLength - seg.restLength);
    const direction = Vec3.normalize(Vec3.subtract(offset1, offset2));
    const force = Vec3.scale(direction, -forceMagnitude * ALPHA);

    cn1.f = Vec3.add(cn1.f, force);
    cn2.f = Vec3.subtract(cn2.f, force);
  }

  function torsion(
    nodes: NodeType[],
    seg1: ResolvedSegment,
    seg2: ResolvedSegment,
    seg3: ResolvedSegment
  ): void {
    const p0 = Vec3.add(nodes[seg1.target].pos, seg1.targetOffset);
    const p1 = Vec3.add(nodes[seg2.source].pos, seg2.sourceOffset);
    const p2 = Vec3.add(nodes[seg2.target].pos, seg2.targetOffset);
    const p3 = Vec3.add(nodes[seg3.source].pos, seg3.sourceOffset);

    const v01 = Vec3.subtract(p1, p0);
    const v12 = Vec3.subtract(p2, p1);
    const v23 = Vec3.subtract(p3, p2);

    const T01 = Vec3.normalize(v01);
    const T12 = Vec3.normalize(v12);
    const T23 = Vec3.normalize(v23);

    const B1 = Vec3.cross(T01, T12);
    const B2 = Vec3.cross(T12, T23);

    let omega = -Math.acos(
      Vec3.dot(Vec3.normalize(B1), Vec3.normalize(B2))
    );
    if (Vec3.dot(T12, Vec3.cross(B1, B2)) < 0) {
      omega = -omega;
    }

    let mag = 0;
    if (!isNaN(omega)) {
      mag = tYarn * ALPHA * omega;
    }
    if (mag === 0) return;

    const f1 = Vec3.scale(Vec3.normalize(B1), mag);
    const f2 = Vec3.scale(Vec3.normalize(B2), -mag);


    nodes[seg2.source].f = Vec3.add(nodes[seg2.source].f, f1);
    nodes[seg2.target].f = Vec3.add(nodes[seg2.target].f, f2);
    nodes[seg1.source].f = Vec3.subtract(nodes[seg1.source].f, f1);
    nodes[seg3.target].f = Vec3.subtract(nodes[seg3.target].f, f2);
  }

  function updatePositions(nodes: NodeType[]): void {
    for (const node of nodes) {
      node.v = Vec3.scale(Vec3.add(node.v, node.f), velocityDecay);
      node.pos = Vec3.add(node.pos, node.v);
      node.f = [0, 0, 0];
    }
  }

  function tick(
    yarns: Record<string, ResolvedSegment[]>,
    nodes: NodeType[]
  ): void {
    for (let k = 0; k < iterations; ++k) {
      ALPHA += (ALPHA_TARGET - ALPHA) * ALPHA_DECAY;

      Object.entries(yarns).forEach(
        ([_yarnIndex, segArr]: [string, ResolvedSegment[]]) => {
          for (let segIndex = 0; segIndex < segArr.length; segIndex++) {
            applyYarnForce(nodes, segArr[segIndex], kYarn);
          }
          for (let segIndex = 1; segIndex + 1 < segArr.length; segIndex++) {
            torsion(nodes, segArr[segIndex - 1], segArr[segIndex], segArr[segIndex + 1]);
          }
        }
      );

      updatePositions(nodes);
    }

    if (ALPHA < ALPHA_MIN) {
      stop();
    }
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
