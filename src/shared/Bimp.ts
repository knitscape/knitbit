import type { Vec2 } from "../math/Vec2";

export interface BimpJSON {
  width: number;
  height: number;
  pixels: number[];
}

export interface PixelChange {
  x: number;
  y: number;
  color: number;
}

export interface IndexedChange {
  index: number;
  color: number;
}

export class Bimp {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  palette?: (string | { color: string; label?: string })[];

  constructor(
    width: number,
    height: number,
    pixels: ArrayLike<number>,
    palette?: (string | { color: string; label?: string })[]
  ) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8ClampedArray(pixels);
    if (palette) this.palette = palette;
  }

  static fromJSON(jsonObj: BimpJSON): Bimp {
    return new Bimp(jsonObj.width, jsonObj.height, jsonObj.pixels);
  }

  static empty(width: number, height: number, color: number): Bimp {
    const pixels = new Array(width * height).fill(color);
    return new Bimp(width, height, pixels);
  }

  static fromTile(width: number, height: number, tile: Bimp): Bimp {
    const tiled: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiled.push(tile.pixel(x % tile.width, y % tile.height));
      }
    }
    return new Bimp(width, height, tiled, tile.palette);
  }

  overlay(overlayBimp: Bimp, pos: Vec2, skip?: number, avoid?: number): Bimp {
    const changes: PixelChange[] = [];
    for (let y = 0; y < overlayBimp.height; y++) {
      for (let x = 0; x < overlayBimp.width; x++) {
        const color = overlayBimp.pixel(x, y);
        if (skip !== undefined && skip !== null && color === skip) continue;
        if (avoid !== undefined && avoid !== null && this.pixel(x, y) === avoid)
          continue;
        changes.push({ x: pos[0] + x, y: pos[1] + y, color });
      }
    }
    return this.draw(changes);
  }

  toJSON(): BimpJSON {
    return {
      pixels: Array.from(this.pixels),
      width: this.width,
      height: this.height,
    };
  }

  pad(paddingX: number, paddingY: number, color: number): Bimp {
    const filled = Array(paddingY * (this.width + 2 * paddingX)).fill(color);
    const col = Array(paddingX).fill(color);
    const twod = this.make2d();
    return new Bimp(
      this.width + 2 * paddingX,
      this.height + 2 * paddingY,
      [
        ...twod.reduce(
          (acc: number[], row: number[]) => [...acc, ...col, ...row, ...col],
          [...filled]
        ),
        ...filled,
      ],
      this.palette
    );
  }

  resize(width: number, height: number, emptyColor: number = 0): Bimp {
    const resized: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        resized.push(
          y >= this.height || x >= this.width ? emptyColor : this.pixel(x, y)
        );
      }
    }
    return new Bimp(width, height, resized, this.palette);
  }

  make2d(): number[][] {
    const copy = Array.from(this.pixels).slice();
    const newArray: number[][] = [];
    while (copy.length > 0) newArray.push(copy.splice(0, this.width));
    return newArray;
  }

  vFlip(): Bimp {
    return new Bimp(
      this.width,
      this.height,
      this.make2d().toReversed().flat(),
      this.palette
    );
  }

  hFlip(): Bimp {
    return new Bimp(
      this.width,
      this.height,
      this.make2d()
        .map((row) => row.toReversed())
        .flat(),
      this.palette
    );
  }

  // ── Composition ──────────────────────────────────────────────────────────

  crop(x: number, y: number, w: number, h: number): Bimp {
    const out: number[] = [];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const sx = x + i;
        const sy = y + j;
        const inside =
          sx >= 0 && sx < this.width && sy >= 0 && sy < this.height;
        out.push(inside ? this.pixels[sx + sy * this.width] : 0);
      }
    }
    return new Bimp(w, h, out, this.palette);
  }

  concat(other: Bimp, axis: "x" | "y"): Bimp {
    if (axis === "x") {
      if (this.height !== other.height)
        throw new Error("concat axis=x requires matching height");
      const w = this.width + other.width;
      const out: number[] = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++)
          out.push(this.pixels[x + y * this.width]);
        for (let x = 0; x < other.width; x++)
          out.push(other.pixels[x + y * other.width]);
      }
      return new Bimp(w, this.height, out, this.palette);
    }
    if (axis === "y") {
      if (this.width !== other.width)
        throw new Error("concat axis=y requires matching width");
      const h = this.height + other.height;
      const out = new Array<number>(this.width * h);
      for (let i = 0; i < this.pixels.length; i++) out[i] = this.pixels[i];
      for (let i = 0; i < other.pixels.length; i++)
        out[this.pixels.length + i] = other.pixels[i];
      return new Bimp(this.width, h, out, this.palette);
    }
    throw new Error(`concat axis must be "x" or "y"`);
  }

  repeat(nx: number, ny: number): Bimp {
    return Bimp.fromTile(this.width * nx, this.height * ny, this);
  }

  trim(bgColor: number = 0): Bimp {
    let minX = this.width;
    let minY = this.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.pixels[x + y * this.width] !== bgColor) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return new Bimp(0, 0, [], this.palette);
    return this.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
  }

  // ── Rotation / transpose ─────────────────────────────────────────────────

  rotate90(): Bimp {
    const w = this.height;
    const h = this.width;
    const out = new Array<number>(w * h);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // (x, y) → (w - 1 - y, x) in the rotated frame
        out[(this.height - 1 - y) + x * w] = this.pixels[x + y * this.width];
      }
    }
    return new Bimp(w, h, out, this.palette);
  }

  rotate180(): Bimp {
    const out = new Array<number>(this.pixels.length);
    for (let i = 0; i < this.pixels.length; i++) {
      out[this.pixels.length - 1 - i] = this.pixels[i];
    }
    return new Bimp(this.width, this.height, out, this.palette);
  }

  rotate270(): Bimp {
    const w = this.height;
    const h = this.width;
    const out = new Array<number>(w * h);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // (x, y) → (y, h - 1 - x)
        out[y + (this.width - 1 - x) * w] = this.pixels[x + y * this.width];
      }
    }
    return new Bimp(w, h, out, this.palette);
  }

  transpose(): Bimp {
    const w = this.height;
    const h = this.width;
    const out = new Array<number>(w * h);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        out[y + x * w] = this.pixels[x + y * this.width];
      }
    }
    return new Bimp(w, h, out, this.palette);
  }

  // ── Value mapping ────────────────────────────────────────────────────────

  map(fn: (value: number, x: number, y: number) => number): Bimp {
    const out = new Array<number>(this.pixels.length);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = x + y * this.width;
        out[i] = fn(this.pixels[i], x, y);
      }
    }
    return new Bimp(this.width, this.height, out, this.palette);
  }

  replace(oldColor: number, newColor: number): Bimp {
    return this.map((v) => (v === oldColor ? newColor : v));
  }

  remap(table: Record<number, number> | number[]): Bimp {
    const isArr = Array.isArray(table);
    return this.map((v) => {
      const replacement = isArr
        ? (table as number[])[v]
        : (table as Record<number, number>)[v];
      return replacement === undefined ? v : replacement;
    });
  }

  // ── Inspection ───────────────────────────────────────────────────────────

  uniqueValues(): number[] {
    const seen = new Set<number>();
    for (let i = 0; i < this.pixels.length; i++) seen.add(this.pixels[i]);
    return Array.from(seen).sort((a, b) => a - b);
  }

  count(color: number): number {
    let n = 0;
    for (let i = 0; i < this.pixels.length; i++) {
      if (this.pixels[i] === color) n++;
    }
    return n;
  }

  equals(other: Bimp): boolean {
    if (this.width !== other.width || this.height !== other.height)
      return false;
    if (this.pixels.length !== other.pixels.length) return false;
    for (let i = 0; i < this.pixels.length; i++) {
      if (this.pixels[i] !== other.pixels[i]) return false;
    }
    return true;
  }

  forEach(fn: (value: number, x: number, y: number) => void): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fn(this.pixels[x + y * this.width], x, y);
      }
    }
  }

  // ── Palette helpers ──────────────────────────────────────────────────────

  withPalette(
    palette?: (string | { color: string; label?: string })[]
  ): Bimp {
    return new Bimp(this.width, this.height, this.pixels, palette);
  }

  // ── Drawing primitive ────────────────────────────────────────────────────

  circle(center: Vec2, radius: number, color: number): Bimp {
    const [cx, cy] = center;
    const changes: PixelChange[] = [];
    const r2 = radius * radius;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(this.width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(this.height - 1, Math.ceil(cy + radius));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) changes.push({ x, y, color });
      }
    }
    return this.draw(changes);
  }

  pixel(x: number, y: number): number {
    if (x > this.width - 1 || x < 0 || y > this.height - 1 || y < 0)
      return -1;
    return this.pixels.at(x + y * this.width)!;
  }

  pixelAt(x: number, y: number): number {
    if (x >= this.width || y >= this.height) return -1;
    if (x < 0) x = this.width + x;
    if (y < 0) y = this.height + y;
    return this.pixels.at(x + y * this.width)!;
  }

  draw(changes: PixelChange[]): Bimp {
    const copy = this.pixels.slice();
    for (const { x, y, color } of changes) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
      copy[x + y * this.width] = color;
    }
    return new Bimp(this.width, this.height, copy, this.palette);
  }

  indexedDraw(changes: IndexedChange[]): Bimp {
    const copy = this.pixels.slice();
    for (const { index, color } of changes) {
      if (index >= this.pixels.length) continue;
      copy[index] = color;
    }
    return new Bimp(this.width, this.height, copy, this.palette);
  }

  indexedBrush(index: number, color: number): Bimp {
    return this.indexedDraw([{ index, color }]);
  }

  brush(pos: Vec2, color: number): Bimp {
    return this.draw([{ x: pos[0], y: pos[1], color }]);
  }

  flood(pos: Vec2, color: number): Bimp {
    const targetColor = this.pixel(pos[0], pos[1]);
    if (targetColor === color) return this.draw([]);
    const around: Vec2[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const drawn: PixelChange[] = [{ x: pos[0], y: pos[1], color }];
    for (let done = 0; done < drawn.length; done++) {
      for (const [dx, dy] of around) {
        const x = drawn[done].x + dx;
        const y = drawn[done].y + dy;
        if (
          x >= 0 &&
          x < this.width &&
          y >= 0 &&
          y < this.height &&
          this.pixel(x, y) === targetColor &&
          !drawn.some((p) => p.x === x && p.y === y)
        ) {
          drawn.push({ x, y, color });
        }
      }
    }
    return this.draw(drawn);
  }

  shift(dx: number, dy: number): Bimp {
    const changes: PixelChange[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        changes.push({
          x: (x - (dx % this.width) + this.width) % this.width,
          y: (y - (dy % this.height) + this.height) % this.height,
          color: this.pixel(x, y),
        });
      }
    }
    return this.draw(changes);
  }

  rect(start: Vec2, end: Vec2, color: number): Bimp {
    const xStart = Math.min(start[0], end[0]);
    const yStart = Math.min(start[1], end[1]);
    const xEnd = Math.max(start[0], end[0]);
    const yEnd = Math.max(start[1], end[1]);
    const changes: PixelChange[] = [];
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        changes.push({ x, y, color });
      }
    }
    return this.draw(changes);
  }

  line(from: Vec2, to: Vec2, color: number): Bimp {
    if (from[0] === to[0] && from[1] === to[1])
      return this.draw([{ x: from[0], y: from[1], color }]);
    const changes: PixelChange[] = [];
    if (Math.abs(from[0] - to[0]) > Math.abs(from[1] - to[1])) {
      if (from[0] > to[0]) [from, to] = [to, from];
      const slope = (to[1] - from[1]) / (to[0] - from[0]);
      let y = from[1];
      for (let x = from[0]; x <= to[0]; x++) {
        changes.push({ x, y: Math.round(y), color });
        y += slope;
      }
    } else {
      if (from[1] > to[1]) [from, to] = [to, from];
      const slope = (to[0] - from[0]) / (to[1] - from[1]);
      let x = from[0];
      for (let y = from[1]; y <= to[1]; y++) {
        changes.push({ x: Math.round(x), y, color });
        x += slope;
      }
    }
    return this.draw(changes);
  }
}
