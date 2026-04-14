import { html } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { EXAMPLES } from "./examples";
import { createEditor, type BimpEditTarget } from "./editor";
import type { LayoutMode } from "./simulation/types";
import { SYMBOL_DATA } from "./shared/opData";

export type SimState = "idle" | "relaxing" | "relaxed";

export interface BimpEditState {
  arrayFrom: number;
  arrayTo: number;
  width: number;
  height: number;
  pixels: number[];
  palette?: string[];
  brushValue: number;
}

export interface AppState {
  code: string;
  cellSize: number;
  statusText: string;
  statusClass: string;
  activeExample: number; // index into EXAMPLES, -1 = none
  simState: SimState;
  topologyMs: number;
  tickMs: number;
  showHelp: boolean;
  layoutMode: LayoutMode;
  editingBimp: BimpEditState | null;
}

export interface ViewHandlers {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectExample: (i: number) => void;
  onRelax: () => void;
  onReset: () => void;
  onFitCamera: () => void;
  onRun: () => void;
  onToggleHelp: () => void;
  onToggleLayoutMode: () => void;
  onEditBimp: (target: BimpEditTarget) => void;
  onBimpCancel: () => void;
  onBimpSave: () => void;
  onBimpCellPaint: (index: number) => void;
  onBimpBrushSelect: (value: number) => void;
}

const FALLBACK_COLORS: string[] = [
  SYMBOL_DATA[0].color,
  SYMBOL_DATA[1].color,
  SYMBOL_DATA[2].color,
  SYMBOL_DATA[3].color,
  SYMBOL_DATA[4].color,
  SYMBOL_DATA[5].color,
  SYMBOL_DATA[6].color,
  "#a8dadc",
  "#e63946",
  "#f4a261",
  "#e9c46a",
  "#2a9d8f",
  "#264653",
  "#f1faee",
  "#457b9d",
  "#1d3557",
];

function colorFor(value: number, palette?: string[]): string {
  if (palette && value >= 0 && value < palette.length) return palette[value];
  return FALLBACK_COLORS[Math.max(0, value) % FALLBACK_COLORS.length];
}

export function view(state: AppState, handlers: ViewHandlers) {
  return html`
    <div class="flex flex-1 overflow-hidden min-h-0">
      <div
        class="w-[158px] shrink-0 bg-[var(--base1)] [border-right:1px_solid_var(--base3)] flex flex-col overflow-hidden">
        <div
          class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] pt-[0.6rem] pb-[0.4rem] px-3 shrink-0 [border-bottom:1px_solid_var(--base3)]">
          Examples
        </div>
        <div class="sidebar-list overflow-y-auto flex-1 py-[0.3rem]">
          ${EXAMPLES.map(
            (ex, i) => html`
              <button
                class="block w-full text-left py-[0.35rem] px-3 rounded-none text-[0.8rem] border-0 leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer [transition:background_80ms] ${state.activeExample === i ? "bg-[var(--accent)] text-white" : "bg-transparent text-[color:var(--base10)] hover:bg-[var(--base3)] hover:text-[color:var(--base13)]"}"
                title=${ex.description}
                @click=${() => handlers.onSelectExample(i)}>
                ${ex.name}
              </button>
            `
          )}
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden min-w-0">
        <div id="editor-pane" class="flex flex-col overflow-hidden min-w-0">
          <div id="code-pane" class="flex flex-col overflow-hidden min-h-0">
            <div
              class="shrink-0 flex items-center justify-between gap-2 py-[0.3rem] px-3 bg-[var(--base1)] [border-bottom:1px_solid_var(--base3)]">
              <span
                class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)]">
                Script
              </span>
              <div class="flex items-center gap-[0.3rem]">
                <button
                  class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Help"
                  @click=${handlers.onToggleHelp}>
                  <i class="fa-solid fa-question"></i>
                </button>
                <button
                  class="flex items-center gap-[0.4rem] bg-[var(--accent)] text-white [font-variation-settings:'wght'_600] py-[0.2rem] px-[0.6rem] text-[0.75rem] rounded-[3px] border-0 cursor-pointer [transition:filter_80ms] hover:brightness-110"
                  title="Run script (Ctrl/Cmd+Enter)"
                  @click=${handlers.onRun}>
                  <i class="fa-solid fa-play"></i> Run
                  <span
                    class="text-[0.68rem] opacity-80 [font-variation-settings:'wght'_500]"
                    >\u2318\u21B5</span
                  >
                </button>
              </div>
            </div>
            <div
              id="code-editor"
              ${ref((el) => {
                if (el && !el.querySelector(".cm-editor"))
                  createEditor(
                    el as HTMLElement,
                    state.code,
                    handlers.onRun,
                    handlers.onEditBimp
                  );
              })}
              class="flex-1 w-full overflow-hidden bg-[var(--base0)]"></div>
          </div>
          <div
            id="chart-pane"
            class="flex flex-col overflow-hidden min-h-0 bg-[var(--base1)] [border-top:1px_solid_var(--base3)]">
            <div
              id="chart-content"
              class="flex flex-1 overflow-hidden relative">
              <div
                id="chart-sidebar-wrap"
                class="shrink-0 overflow-hidden bg-[var(--base2)] [border-right:1px_solid_var(--base3)]">
                <div
                  id="chart-sidebar-inner"
                  class="px-2 py-3 will-change-transform">
                  <canvas id="chart-sidebar" class="block"></canvas>
                </div>
              </div>
              <div
                id="chart-scroll"
                class="flex-1 overflow-auto chart-scrollbar">
                <div class="px-3 py-3 w-max">
                  <div class="relative">
                    <canvas id="chart-canvas" class="block"></canvas>
                    <div
                      id="chart-col-highlight"
                      class="chart-col-highlight pointer-events-none absolute hidden"></div>
                  </div>
                </div>
              </div>
              <div
                id="chart-row-highlight"
                class="chart-row-highlight pointer-events-none absolute left-0 right-0 hidden"></div>
            </div>
            <div
              class="shrink-0 flex items-center justify-between gap-2 py-[0.3rem] px-3 bg-[var(--base1)] [border-top:1px_solid_var(--base3)]">
              <span
                id="chart-coord"
                class="font-mono text-[0.72rem] text-[color:var(--base7)] tabular-nums">
                &nbsp;
              </span>
              <div class="flex items-center gap-[2px]">
                <button
                  class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.7rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Zoom out"
                  @click=${handlers.onZoomOut}>
                  <i class="fa-solid fa-minus"></i>
                </button>
                <button
                  class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.7rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Zoom in"
                  @click=${handlers.onZoomIn}>
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          id="preview-pane"
          class="flex flex-col overflow-hidden min-w-0 bg-[var(--base1)]">
          <div
            class="shrink-0 flex items-center justify-between gap-2 py-[0.3rem] px-3 bg-[var(--base1)] [border-bottom:1px_solid_var(--base3)]">
            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)]">
              Preview
            </span>
            <div class="flex items-center gap-[0.3rem]">
              <button
                class="bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.55rem] text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.04em] uppercase rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                title="Toggle between technical (row-based) and compressed (per-needle count) layout"
                @click=${handlers.onToggleLayoutMode}>
                ${state.layoutMode === "technical" ? "technical" : "compressed"}
              </button>
              <button
                class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                title="Fit view"
                @click=${handlers.onFitCamera}>
                <i class="fa-solid fa-expand"></i>
              </button>
              ${state.simState === "idle"
                ? html`<button
                    class="flex items-center gap-[0.4rem] bg-[var(--accent)] text-white [font-variation-settings:'wght'_600] py-[0.2rem] px-[0.6rem] text-[0.75rem] rounded-[3px] border-0 cursor-pointer [transition:filter_80ms] hover:brightness-110"
                    title="Relax simulation"
                    @click=${handlers.onRelax}>
                    <i class="fa-solid fa-play"></i> Relax
                  </button>`
                : state.simState === "relaxing"
                  ? html`<button
                      class="flex items-center gap-[0.4rem] bg-[var(--base4)] text-[color:var(--base7)] [font-variation-settings:'wght'_600] py-[0.2rem] px-[0.6rem] text-[0.75rem] rounded-[3px] border-0 cursor-default"
                      disabled>
                      Relaxing\u2026
                    </button>`
                  : html`<button
                      class="flex items-center gap-[0.4rem] bg-[var(--accent)] text-white [font-variation-settings:'wght'_600] py-[0.2rem] px-[0.6rem] text-[0.75rem] rounded-[3px] border-0 cursor-pointer [transition:filter_80ms] hover:brightness-110"
                      title="Reset simulation"
                      @click=${handlers.onReset}>
                      <i class="fa-solid fa-rotate-left"></i> Reset
                    </button>`}
            </div>
          </div>
          <div class="flex-1 min-h-0 relative">
            <canvas id="sim-canvas" class="block w-full h-full"></canvas>
            <div
              class="absolute top-2 left-2 flex flex-col gap-[0.15rem] font-mono text-[0.7rem] text-[color:var(--base8)] pointer-events-none">
              <span>topology: ${state.topologyMs.toFixed(1)}ms</span>
              ${state.simState !== "idle"
                ? html`<span>tick: ${state.tickMs.toFixed(1)}ms</span>`
                : ""}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="py-1 px-3 text-[0.78rem] bg-[var(--base1)] [border-top:1px_solid_var(--base3)] shrink-0 whitespace-nowrap overflow-hidden text-ellipsis min-h-[1.7rem] ${state.statusClass}">
      ${state.statusText}
    </div>

    ${state.showHelp ? helpModal(handlers) : ""}
    ${state.editingBimp ? bimpModal(state.editingBimp, handlers) : ""}
  `;
}

function bimpModal(edit: BimpEditState, handlers: ViewHandlers) {
  const { width, height, pixels, palette, brushValue } = edit;
  const cellSizePx = Math.max(18, Math.min(44, Math.floor(320 / Math.max(width, height))));

  const brushValues: number[] = [];
  if (palette && palette.length > 0) {
    for (let i = 0; i < palette.length; i++) brushValues.push(i);
  } else {
    const seen = new Set<number>();
    for (const v of pixels) seen.add(v);
    for (let i = 0; i <= 6; i++) seen.add(i);
    const arr = Array.from(seen).sort((a, b) => a - b);
    brushValues.push(...arr);
  }

  return html`
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) handlers.onBimpCancel();
      }}>
      <div
        class="bg-[var(--base1)] border border-[color:var(--base3)] rounded-[4px] shadow-xl flex flex-col overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 py-[0.5rem] px-4 [border-bottom:1px_solid_var(--base3)] shrink-0">
          <span
            class="text-[0.78rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base10)]">
            Bitmap editor \u2014 ${width}\u00D7${height}
          </span>
          <button
            class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
            title="Close without saving"
            @click=${handlers.onBimpCancel}>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="px-5 py-4 flex flex-col gap-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mr-1">
              Brush
            </span>
            ${brushValues.map(
              (v) => html`<button
                class="flex items-center justify-center w-[1.8rem] h-[1.8rem] text-[0.72rem] font-mono rounded-[3px] cursor-pointer ${brushValue ===
                v
                  ? "outline outline-2 outline-[var(--accent)] outline-offset-1"
                  : "outline outline-1 outline-[color:var(--base4)]"}"
                style="background: ${colorFor(v, palette)}; color: ${pickTextColor(
                  colorFor(v, palette)
                )}"
                title=${palette && v < palette.length
                  ? `${v} \u2014 ${palette[v]}`
                  : `${v}`}
                @click=${() => handlers.onBimpBrushSelect(v)}>
                ${v}
              </button>`
            )}
          </div>

          <div
            class="inline-grid gap-[2px] bg-[var(--base3)] p-[2px] rounded-[3px] self-start select-none"
            style="grid-template-columns: repeat(${width}, ${cellSizePx}px);"
            @mouseleave=${() => {}}>
            ${pixels.map(
              (v, idx) => html`<div
                class="flex items-center justify-center font-mono text-[0.65rem] cursor-pointer"
                style="width: ${cellSizePx}px; height: ${cellSizePx}px; background: ${colorFor(
                  v,
                  palette
                )}; color: ${pickTextColor(colorFor(v, palette))}"
                @mousedown=${(e: MouseEvent) => {
                  e.preventDefault();
                  handlers.onBimpCellPaint(idx);
                }}
                @mouseenter=${(e: MouseEvent) => {
                  if (e.buttons > 0) handlers.onBimpCellPaint(idx);
                }}>
                ${v}
              </div>`
            )}
          </div>

          ${palette
            ? ""
            : html`<p
                class="text-[0.72rem] text-[color:var(--base7)] italic">
                No palette defined. Pass a 4th arg like
                <code class="font-mono">["#f00", "#0f0"]</code> to set colors.
              </p>`}
        </div>

        <div
          class="flex justify-end gap-2 py-[0.5rem] px-4 [border-top:1px_solid_var(--base3)] shrink-0">
          <button
            class="py-[0.25rem] px-[0.7rem] text-[0.78rem] rounded-[3px] bg-[var(--base2)] border border-[color:var(--base4)] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
            @click=${handlers.onBimpCancel}>
            Cancel
          </button>
          <button
            autofocus
            class="py-[0.25rem] px-[0.9rem] text-[0.78rem] [font-variation-settings:'wght'_600] rounded-[3px] bg-[var(--accent)] text-white border-0 cursor-pointer [transition:filter_80ms] hover:brightness-110"
            @click=${handlers.onBimpSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  `;
}

function pickTextColor(bg: string): string {
  const hex = bg.replace("#", "");
  if (hex.length !== 3 && hex.length !== 6) return "var(--base13)";
  const expand = hex.length === 3
    ? hex.split("").map((c) => c + c).join("")
    : hex;
  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#111" : "#fff";
}

function helpModal(handlers: ViewHandlers) {
  return html`
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) handlers.onToggleHelp();
      }}>
      <div
        class="bg-[var(--base1)] border border-[color:var(--base3)] rounded-[4px] shadow-xl w-[min(720px,100%)] max-h-[85vh] flex flex-col overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 py-[0.5rem] px-4 [border-bottom:1px_solid_var(--base3)] shrink-0">
          <span
            class="text-[0.78rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base10)]">
            Script reference
          </span>
          <button
            class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
            title="Close"
            @click=${handlers.onToggleHelp}>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div
          class="overflow-y-auto px-5 py-4 text-[0.82rem] leading-[1.55] text-[color:var(--base12)] flex flex-col gap-5">
          <section>
            <h3
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mb-2">
              Keyboard shortcuts
            </h3>
            <table class="w-full font-mono text-[0.78rem]">
              <tbody>
                ${[
                  ["\u2318 / Ctrl + Enter", "Run script"],
                  ["Tab", "Indent (2 spaces)"],
                  ["Shift + Tab", "Outdent"],
                  ["\u2318 / Ctrl + Z", "Undo"],
                  ["\u2318 / Ctrl + Shift + Z", "Redo"],
                  ["\u2318 / Ctrl + F", "Find"],
                  ["\u2318 / Ctrl + Space", "Trigger autocomplete"],
                  ["Esc", "Close this dialog"],
                ].map(
                  ([k, v]) => html`<tr>
                    <td
                      class="py-[0.15rem] pr-4 text-[color:var(--base10)] whitespace-nowrap align-top">
                      ${k}
                    </td>
                    <td class="py-[0.15rem]">${v}</td>
                  </tr>`
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h3
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mb-2">
              Operations (Op)
            </h3>
            <p class="mb-2 text-[color:var(--base10)]">
              Each cell of the <code class="font-mono">ops</code> bitmap is one
              of:
            </p>
            <table class="w-full font-mono text-[0.78rem]">
              <tbody>
                ${[
                  ["Op.MISS", "0", "Yarn floats past the needle"],
                  ["Op.FKNIT", "1", "Front bed knit"],
                  ["Op.FTUCK", "2", "Front bed tuck"],
                  ["Op.BKNIT", "3", "Back bed knit"],
                  ["Op.BTUCK", "4", "Back bed tuck"],
                  ["Op.FTB", "5", "Transfer front \u2192 back"],
                  ["Op.BTF", "6", "Transfer back \u2192 front"],
                ].map(
                  ([name, val, desc]) => html`<tr>
                    <td
                      class="py-[0.15rem] pr-4 text-[color:var(--base13)] whitespace-nowrap align-top">
                      ${name}
                    </td>
                    <td
                      class="py-[0.15rem] pr-4 text-[color:var(--base7)] whitespace-nowrap align-top">
                      = ${val}
                    </td>
                    <td class="py-[0.15rem] font-sans">${desc}</td>
                  </tr>`
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h3
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mb-2">
              Return value
            </h3>
            <p class="mb-2 text-[color:var(--base10)]">
              Your script must return an object with the following fields:
            </p>
            <table class="w-full font-mono text-[0.78rem]">
              <tbody>
                ${[
                  [
                    "ops",
                    "Bimp",
                    "Bitmap of Op values (width \u00d7 height).",
                  ],
                  [
                    "yarnFeeder",
                    "number[]",
                    "Feeder id per row (length = height).",
                  ],
                  [
                    "direction",
                    '("left"|"right")[]',
                    "Carriage direction per row.",
                  ],
                  [
                    "palette",
                    "string[]",
                    "CSS colors, indexed by feeder id \u2212 1.",
                  ],
                  [
                    "racking",
                    "number[]?",
                    "Bed offset per row. Defaults to zeros.",
                  ],
                ].map(
                  ([name, type, desc]) => html`<tr>
                    <td
                      class="py-[0.2rem] pr-4 text-[color:var(--base13)] whitespace-nowrap align-top">
                      ${name}
                    </td>
                    <td
                      class="py-[0.2rem] pr-4 text-[color:var(--base7)] whitespace-nowrap align-top">
                      ${type}
                    </td>
                    <td class="py-[0.2rem] font-sans">${desc}</td>
                  </tr>`
                )}
              </tbody>
            </table>
          </section>

          <section>
            <h3
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mb-2">
              Available globals
            </h3>
            <p class="text-[color:var(--base10)]">
              <code class="font-mono text-[color:var(--base13)]">Bimp</code> —
              bitmap class. Construct with
              <code class="font-mono">new Bimp(w, h, pixels)</code> or the
              static helpers
              <code class="font-mono">Bimp.empty</code>,
              <code class="font-mono">Bimp.fromTile</code>,
              <code class="font-mono">Bimp.fromJSON</code>. Instances are
              immutable — methods like
              <code class="font-mono">draw</code>,
              <code class="font-mono">overlay</code>,
              <code class="font-mono">rect</code>,
              <code class="font-mono">line</code>,
              <code class="font-mono">flood</code>,
              <code class="font-mono">shift</code>,
              <code class="font-mono">hFlip</code>,
              <code class="font-mono">vFlip</code> return new Bimps.
            </p>
            <p class="mt-2 text-[color:var(--base10)]">
              <code class="font-mono text-[color:var(--base13)]">Op</code> —
              the enum above.
            </p>
          </section>
        </div>
      </div>
    </div>
  `;
}
