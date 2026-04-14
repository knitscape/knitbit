import { html } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { EXAMPLES } from "./examples";
import { createEditor } from "./editor";

export type SimState = "idle" | "relaxing" | "relaxed";

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
                    handlers.onRun
                  );
              })}
              class="flex-1 w-full overflow-hidden bg-[var(--base0)]"></div>
          </div>
          <div
            id="chart-pane"
            class="flex flex-col overflow-hidden min-h-0 bg-[var(--base1)] [border-top:1px_solid_var(--base3)] relative">
            <div
              class="flex-1 overflow-auto p-3">
              <canvas id="chart-canvas" class="block"></canvas>
            </div>
            <div class="absolute bottom-2 right-2 flex gap-[2px] z-10">
              <button
                class="bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.45rem] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                title="Zoom in"
                @click=${handlers.onZoomIn}>
                <i class="fa-solid fa-plus"></i>
              </button>
              <button
                class="bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.45rem] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                title="Zoom out"
                @click=${handlers.onZoomOut}>
                <i class="fa-solid fa-minus"></i>
              </button>
            </div>
          </div>
        </div>

        <div
          id="preview-pane"
          class="flex flex-col overflow-hidden min-w-0 bg-[var(--base1)] relative">
          <canvas id="sim-canvas" class="block w-full h-full"></canvas>
          <div
            class="absolute top-2 left-2 flex flex-col gap-[0.15rem] font-mono text-[0.7rem] text-[color:var(--base8)] pointer-events-none">
            <span>topology: ${state.topologyMs.toFixed(1)}ms</span>
            ${state.simState !== "idle"
              ? html`<span>tick: ${state.tickMs.toFixed(1)}ms</span>`
              : ""}
          </div>
          <button
            class="absolute top-2 right-2 bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.45rem] text-[0.75rem] z-10 cursor-pointer rounded-[3px] text-[color:var(--base12)] [transition:background_80ms] hover:bg-[var(--base4)]"
            title="Fit view"
            @click=${handlers.onFitCamera}>
            <i class="fa-solid fa-expand"></i>
          </button>
          ${state.simState === "idle"
            ? html`<button
                class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white [font-variation-settings:'wght'_600] py-[0.4rem] px-[1.2rem] text-[0.85rem] z-10 cursor-pointer border-0 rounded-[3px] hover:brightness-110"
                @click=${handlers.onRelax}>
                <i class="fa-solid fa-play"></i> Relax
              </button>`
            : state.simState === "relaxing"
              ? html`<button
                  class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--base4)] text-[color:var(--base7)] [font-variation-settings:'wght'_600] py-[0.4rem] px-[1.2rem] text-[0.85rem] z-10 cursor-default border-0 rounded-[3px]"
                  disabled>
                  Relaxing\u2026
                </button>`
              : html`<button
                  class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white [font-variation-settings:'wght'_600] py-[0.4rem] px-[1.2rem] text-[0.85rem] z-10 cursor-pointer border-0 rounded-[3px] hover:brightness-110"
                  @click=${handlers.onReset}>
                  <i class="fa-solid fa-rotate-left"></i> Reset
                </button>`}
        </div>
      </div>
    </div>

    <div
      class="py-1 px-3 text-[0.78rem] bg-[var(--base1)] [border-top:1px_solid_var(--base3)] shrink-0 whitespace-nowrap overflow-hidden text-ellipsis min-h-[1.7rem] ${state.statusClass}">
      ${state.statusText}
    </div>

    ${state.showHelp ? helpModal(handlers) : ""}
  `;
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
