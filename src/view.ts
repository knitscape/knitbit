import { html } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { EXAMPLES } from "./examples";
import { createEditor, type BimpEditTarget } from "./editor";
import type { LayoutMode } from "./simulation/types";
import { SYMBOL_DATA } from "./shared/opData";
import { Bimp } from "./shared/Bimp";
import type { SavedScript } from "./scripts";

export type ScriptId =
  | { type: "saved"; name: string }
  | { type: "example"; name: string };

export type SimState = "idle" | "relaxing" | "relaxed";

export type BimpTool = "brush" | "line" | "rect" | "flood";

export interface BimpEditState {
  exprFrom: number;
  exprTo: number;
  width: number;
  height: number;
  pixels: number[];
  palette?: string[];
  brushValue: number;
  activeTool: BimpTool;
  dragFrom: [number, number] | null;
  dragTo: [number, number] | null;
}

export interface AppState {
  code: string;
  cellSize: number;
  statusText: string;
  statusClass: string;
  simState: SimState;
  topologyMs: number;
  tickMs: number;
  showHelp: boolean;
  showExamplePicker: boolean;
  layoutMode: LayoutMode;
  editingBimp: BimpEditState | null;
  maxStitch: number;
  totalStitches: number;
  autoRun: boolean;
  scriptId: ScriptId;
  showScriptPicker: boolean;
  savedScripts: Record<string, SavedScript>;
}

export interface ViewHandlers {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectExample: (i: number) => void;
  onToggleExamplePicker: () => void;
  onToggleScriptPicker: () => void;
  onLoadScript: (name: string) => void;
  onDeleteScript: (name: string) => void;
  onRenameCurrentScript: (newName: string) => void;
  onRelax: () => void;
  onReset: () => void;
  onFitCamera: () => void;
  onRun: () => void;
  onToggleHelp: () => void;
  onToggleLayoutMode: () => void;
  onScrub: (n: number) => void;
  onEditBimp: (target: BimpEditTarget) => void;
  onBimpCancel: () => void;
  onBimpSave: () => void;
  onBimpPointerDown: (x: number, y: number) => void;
  onBimpPointerMove: (x: number, y: number) => void;
  onBimpPointerUp: () => void;
  onBimpToolSelect: (tool: BimpTool) => void;
  onBimpShift: (dx: number, dy: number) => void;
  onBimpBrushSelect: (value: number) => void;
  onBimpResize: (width: number, height: number) => void;
  onBimpPaletteColorChange: (index: number, color: string) => void;
  onBimpPaletteAdd: () => void;
  onToggleAutoRun: () => void;
  onDocChange: () => void;
  onDownloadBmp: () => void;
  onDownloadJson: () => void;
  onDownloadScript: () => void;
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
        <div id="editor-pane" class="flex flex-col overflow-hidden min-w-0">
          <div id="code-pane" class="flex flex-col overflow-hidden min-h-0 relative">
            <div
              class="shrink-0 flex items-center justify-between gap-2 py-[0.3rem] px-3 bg-[var(--base1)] [border-bottom:1px_solid_var(--base3)]">
              ${state.scriptId.type === "saved"
                ? html`<input
                    type="text"
                    .value=${state.scriptId.name}
                    @change=${(e: Event) =>
                      handlers.onRenameCurrentScript(
                        (e.target as HTMLInputElement).value
                      )}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === "Enter")
                        (e.target as HTMLInputElement).blur();
                    }}
                    spellcheck="false"
                    class="min-w-0 w-[14rem] bg-transparent border border-transparent hover:border-[color:var(--base4)] focus:border-[color:var(--base5)] focus:bg-[var(--base2)] focus:outline-none rounded-[3px] py-[0.1rem] px-[0.35rem] text-[0.82rem] [font-variation-settings:'wght'_600] text-[color:var(--base13)]" />`
                : html`<span
                    class="text-[0.78rem] text-[color:var(--base7)] italic truncate"
                    title=${state.scriptId.name + " (example)"}>
                    ${state.scriptId.name}
                    <span class="text-[0.68rem] opacity-70">(example)</span>
                  </span>`}
              <div class="flex items-center gap-[0.3rem]">
                <button
                  class="flex items-center gap-[0.35rem] bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.5rem] text-[0.72rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Load a saved script"
                  @click=${handlers.onToggleScriptPicker}>
                  <i class="fa-solid fa-folder-open"></i> Load
                </button>
                <button
                  class="flex items-center gap-[0.35rem] bg-[var(--base2)] border border-[color:var(--base4)] py-[0.2rem] px-[0.5rem] text-[0.72rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Load an example"
                  @click=${handlers.onToggleExamplePicker}>
                  <i class="fa-solid fa-book-open"></i> Load Example
                </button>
                <button
                  class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Help"
                  @click=${handlers.onToggleHelp}>
                  <i class="fa-solid fa-question"></i>
                </button>
                <button
                  class="flex items-center gap-[0.3rem] py-[0.2rem] px-[0.5rem] text-[0.72rem] rounded-[3px] cursor-pointer [transition:background_80ms,color_80ms] ${state.autoRun
                    ? "bg-[var(--accent)] text-white border-0 hover:brightness-110"
                    : "bg-[var(--base2)] border border-[color:var(--base4)] text-[color:var(--base10)] hover:bg-[var(--base4)] hover:text-[color:var(--base13)]"}"
                  title=${state.autoRun
                    ? "Auto-run is ON \u2014 click to turn off"
                    : "Auto-run is OFF \u2014 click to run on every edit"}
                  @click=${handlers.onToggleAutoRun}>
                  <i class="fa-solid fa-bolt"></i> Auto
                </button>
                <button
                  class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                  title="Download this script as a .js file"
                  @click=${handlers.onDownloadScript}>
                  <i class="fa-solid fa-download"></i>
                </button>
                <button
                  ?disabled=${state.autoRun}
                  class="flex items-center gap-[0.4rem] [font-variation-settings:'wght'_600] py-[0.2rem] px-[0.6rem] text-[0.75rem] rounded-[3px] border-0 [transition:filter_80ms] ${state.autoRun
                    ? "bg-[var(--base3)] text-[color:var(--base7)] cursor-not-allowed"
                    : "bg-[var(--accent)] text-white cursor-pointer hover:brightness-110"}"
                  title=${state.autoRun
                    ? "Auto-run is on \u2014 the script runs automatically"
                    : "Run script (Ctrl/Cmd+Enter)"}
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
                    handlers.onEditBimp,
                    handlers.onDocChange
                  );
              })}
              class="flex-1 w-full overflow-hidden bg-[var(--base0)]"></div>
            ${state.editingBimp ? bimpEditorPane(state.editingBimp, handlers) : ""}
          </div>
          <div
            id="chart-pane"
            class="flex flex-col overflow-hidden min-h-0 bg-[var(--base1)] [border-top:1px_solid_var(--base3)]">
            <div
              id="chart-content"
              class="flex flex-1 overflow-hidden relative">
              <div
                id="chart-sidebar-wrap"
                class="shrink-0 overflow-hidden bg-[var(--base2)] [border-right:1px_solid_var(--base3)] cursor-grab">
                <div
                  id="chart-sidebar-inner"
                  class="px-2 py-3 will-change-transform">
                  <canvas id="chart-sidebar" class="block"></canvas>
                </div>
              </div>
              <div
                id="chart-scroll"
                class="flex-1 overflow-auto chart-scrollbar cursor-grab">
                <div class="px-3 py-3 w-max">
                  <div class="relative">
                    <canvas id="chart-canvas" class="block"></canvas>
                    <div
                      id="chart-col-highlight"
                      class="chart-col-highlight pointer-events-none absolute hidden"></div>
                    <div
                      id="chart-scrub-cell"
                      class="chart-scrub-cell pointer-events-none absolute hidden"></div>
                  </div>
                </div>
              </div>
              <div
                id="chart-row-highlight"
                class="chart-row-highlight pointer-events-none absolute left-0 right-0 hidden"></div>
              <div
                id="chart-scrub-row"
                class="chart-scrub-row pointer-events-none absolute left-0 right-0 hidden"></div>
            </div>
            <div
              class="shrink-0 flex items-center justify-between gap-2 py-[0.3rem] px-3 bg-[var(--base1)] [border-top:1px_solid_var(--base3)]">
              <span
                id="chart-coord"
                class="font-mono text-[0.72rem] text-[color:var(--base7)] tabular-nums">
                &nbsp;
              </span>
              <div class="flex items-center gap-[0.3rem]">
                <details class="chart-menu relative">
                  <summary
                    class="list-none flex items-center gap-[0.3rem] h-[1.5rem] px-[0.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.72rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                    title="Download program data">
                    <i class="fa-solid fa-download text-[0.7rem]"></i>
                    <span>Download</span>
                    <i class="fa-solid fa-caret-down text-[0.6rem] opacity-70"></i>
                  </summary>
                  <div
                    class="absolute right-0 bottom-full mb-1 min-w-[11rem] bg-[var(--base2)] border border-[color:var(--base4)] rounded-[3px] shadow-lg z-20 overflow-hidden">
                    <button
                      class="block w-full text-left py-[0.35rem] px-[0.6rem] text-[0.78rem] text-[color:var(--base12)] bg-transparent border-0 cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                      @click=${(e: MouseEvent) => {
                        (
                          (e.currentTarget as HTMLElement).closest(
                            "details"
                          ) as HTMLDetailsElement
                        ).open = false;
                        handlers.onDownloadBmp();
                      }}>
                      Bitmap (.bmp)
                    </button>
                    <button
                      class="block w-full text-left py-[0.35rem] px-[0.6rem] text-[0.78rem] text-[color:var(--base12)] bg-transparent border-0 cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
                      @click=${(e: MouseEvent) => {
                        (
                          (e.currentTarget as HTMLElement).closest(
                            "details"
                          ) as HTMLDetailsElement
                        ).open = false;
                        handlers.onDownloadJson();
                      }}>
                      Control data (.json)
                    </button>
                  </div>
                </details>
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
          ${state.totalStitches > 0
            ? html`<div
                class="shrink-0 flex items-center gap-3 py-[0.35rem] px-3 bg-[var(--base1)] [border-top:1px_solid_var(--base3)]">
                <span
                  class="text-[0.7rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] shrink-0">
                  Step
                </span>
                <input
                  type="range"
                  min="0"
                  max=${state.totalStitches}
                  step="1"
                  .value=${String(state.maxStitch)}
                  @input=${(e: Event) =>
                    handlers.onScrub(+(e.target as HTMLInputElement).value)}
                  class="flex-1 accent-[var(--accent)]" />
                <span
                  class="font-mono text-[0.72rem] text-[color:var(--base10)] tabular-nums w-[5.5rem] text-right shrink-0">
                  ${state.maxStitch} / ${state.totalStitches}
                </span>
              </div>`
            : ""}
        </div>
    </div>

    <div
      class="py-1 px-3 text-[0.78rem] bg-[var(--base1)] [border-top:1px_solid_var(--base3)] shrink-0 whitespace-nowrap overflow-hidden text-ellipsis min-h-[1.7rem] ${state.statusClass}">
      ${state.statusText}
    </div>

    ${state.showHelp ? helpModal(handlers) : ""}
    ${state.showExamplePicker ? examplePickerModal(handlers) : ""}
    ${state.showScriptPicker ? scriptPickerModal(state, handlers) : ""}
  `;
}

function scriptPickerModal(state: AppState, handlers: ViewHandlers) {
  const entries = Object.entries(state.savedScripts).sort(
    ([, a], [, b]) => b.updatedAt - a.updatedAt
  );
  return html`
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) handlers.onToggleScriptPicker();
      }}>
      <div
        class="bg-[var(--base1)] border border-[color:var(--base3)] rounded-[4px] shadow-xl w-[min(420px,100%)] max-h-[80vh] flex flex-col overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 py-[0.5rem] px-4 [border-bottom:1px_solid_var(--base3)] shrink-0">
          <span
            class="text-[0.78rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base10)]">
            Load script
          </span>
          <button
            class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
            title="Close"
            @click=${handlers.onToggleScriptPicker}>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="overflow-y-auto flex-1 py-[0.3rem]">
          ${entries.length === 0
            ? html`<div
                class="py-6 px-4 text-center text-[0.82rem] text-[color:var(--base7)] italic">
                No saved scripts yet.
              </div>`
            : entries.map(
                ([name, entry]) => html`<div
                  class="flex items-center gap-2 py-[0.25rem] pl-4 pr-2 [transition:background_80ms] hover:bg-[var(--base2)]">
                  <button
                    class="flex-1 min-w-0 text-left py-[0.3rem] bg-transparent border-0 text-[color:var(--base12)] cursor-pointer hover:text-[color:var(--base13)]"
                    @click=${() => handlers.onLoadScript(name)}>
                    <div class="text-[0.82rem] truncate">${name}</div>
                    <div
                      class="text-[0.68rem] text-[color:var(--base7)] tabular-nums">
                      ${new Date(entry.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <button
                    class="flex items-center justify-center w-[1.6rem] h-[1.6rem] bg-transparent border-0 text-[0.75rem] rounded-[3px] text-[color:var(--base7)] cursor-pointer [transition:background_80ms,color_80ms] hover:bg-[var(--base3)] hover:text-red-400 shrink-0"
                    title="Delete ${name}"
                    @click=${(e: MouseEvent) => {
                      e.stopPropagation();
                      handlers.onDeleteScript(name);
                    }}>
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>`
              )}
        </div>
      </div>
    </div>
  `;
}

function examplePickerModal(handlers: ViewHandlers) {
  return html`
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget) handlers.onToggleExamplePicker();
      }}>
      <div
        class="bg-[var(--base1)] border border-[color:var(--base3)] rounded-[4px] shadow-xl w-[min(360px,100%)] max-h-[80vh] flex flex-col overflow-hidden">
        <div
          class="flex items-center justify-between gap-3 py-[0.5rem] px-4 [border-bottom:1px_solid_var(--base3)] shrink-0">
          <span
            class="text-[0.78rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base10)]">
            Load example
          </span>
          <button
            class="flex items-center justify-center w-[1.5rem] h-[1.5rem] bg-[var(--base2)] border border-[color:var(--base4)] text-[0.75rem] rounded-[3px] text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base4)]"
            title="Close"
            @click=${handlers.onToggleExamplePicker}>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="overflow-y-auto flex-1 py-[0.3rem]">
          ${EXAMPLES.map(
            (ex, i) => html`<button
              class="block w-full text-left py-[0.4rem] px-4 text-[0.82rem] bg-transparent border-0 text-[color:var(--base12)] cursor-pointer [transition:background_80ms] hover:bg-[var(--base3)] hover:text-[color:var(--base13)]"
              @click=${() => handlers.onSelectExample(i)}>
              ${ex.name}
            </button>`
          )}
        </div>
      </div>
    </div>
  `;
}

function bimpEditorPane(edit: BimpEditState, handlers: ViewHandlers) {
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
      class="absolute inset-0 z-10 bg-[var(--base1)] flex flex-col overflow-hidden">
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

        <div class="flex-1 overflow-auto px-5 py-4 flex flex-col gap-4">
          <div class="flex items-center gap-3 flex-wrap">
            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)]">
              Size
            </span>
            <div class="flex items-center gap-[0.3rem]">
              <input
                type="number"
                min="1"
                max="64"
                step="1"
                .value=${String(width)}
                @change=${(e: Event) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (Number.isFinite(v)) handlers.onBimpResize(v, height);
                }}
                class="w-[3.5rem] bg-[var(--base2)] border border-[color:var(--base4)] rounded-[3px] py-[0.15rem] px-[0.35rem] text-[0.78rem] font-mono text-[color:var(--base12)] text-right" />
              <span class="text-[color:var(--base7)] text-[0.78rem]">\u00D7</span>
              <input
                type="number"
                min="1"
                max="64"
                step="1"
                .value=${String(height)}
                @change=${(e: Event) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  if (Number.isFinite(v)) handlers.onBimpResize(width, v);
                }}
                class="w-[3.5rem] bg-[var(--base2)] border border-[color:var(--base4)] rounded-[3px] py-[0.15rem] px-[0.35rem] text-[0.78rem] font-mono text-[color:var(--base12)] text-right" />
            </div>

            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] ml-3">
              Shift
            </span>
            ${[
              { dx: -1, dy: 0, icon: "fa-arrow-left", title: "Shift left" },
              { dx: 1, dy: 0, icon: "fa-arrow-right", title: "Shift right" },
              { dx: 0, dy: -1, icon: "fa-arrow-up", title: "Shift up" },
              { dx: 0, dy: 1, icon: "fa-arrow-down", title: "Shift down" },
            ].map(
              (d) => html`<button
                class="flex items-center justify-center w-[1.6rem] h-[1.6rem] text-[0.72rem] rounded-[3px] cursor-pointer bg-[var(--base2)] border border-[color:var(--base4)] text-[color:var(--base10)] hover:bg-[var(--base3)] hover:text-[color:var(--base13)]"
                title=${d.title}
                @click=${() => handlers.onBimpShift(d.dx, d.dy)}>
                <i class="fa-solid ${d.icon}"></i>
              </button>`
            )}
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mr-1">
              Tool
            </span>
            ${(
              [
                { tool: "brush", icon: "fa-paintbrush", title: "Brush" },
                { tool: "line", icon: "fa-slash", title: "Line" },
                { tool: "rect", icon: "fa-vector-square", title: "Rectangle" },
                { tool: "flood", icon: "fa-fill-drip", title: "Flood fill" },
              ] as const
            ).map(
              (t) => html`<button
                class="flex items-center justify-center w-[2rem] h-[2rem] text-[0.8rem] rounded-[3px] cursor-pointer [transition:background_80ms,color_80ms] ${edit.activeTool ===
                t.tool
                  ? "bg-[var(--accent)] text-white border-0"
                  : "bg-[var(--base2)] border border-[color:var(--base4)] text-[color:var(--base10)] hover:bg-[var(--base3)] hover:text-[color:var(--base13)]"}"
                title=${t.title}
                @click=${() => handlers.onBimpToolSelect(t.tool)}>
                <i class="fa-solid ${t.icon}"></i>
              </button>`
            )}
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="text-[0.72rem] [font-variation-settings:'wght'_600] tracking-[0.08em] uppercase text-[color:var(--base7)] mr-1">
              ${palette ? "Palette" : "Brush"}
            </span>
            ${brushValues.map((v) => {
              const bg = colorFor(v, palette);
              const isInPalette = !!palette && v < palette.length;
              return html`<div class="relative">
                <button
                  class="flex items-center justify-center w-[2rem] h-[2rem] text-[0.72rem] font-mono rounded-[3px] cursor-pointer ${brushValue ===
                  v
                    ? "outline outline-2 outline-[var(--accent)] outline-offset-1"
                    : "outline outline-1 outline-[color:var(--base4)]"}"
                  style="background: ${bg}; color: ${pickTextColor(bg)}"
                  title=${isInPalette ? `${v} \u2014 ${palette![v]}` : `${v}`}
                  @click=${() => handlers.onBimpBrushSelect(v)}>
                  ${v}
                </button>
                ${isInPalette
                  ? html`<input
                      type="color"
                      .value=${palette![v]}
                      @input=${(e: Event) =>
                        handlers.onBimpPaletteColorChange(
                          v,
                          (e.target as HTMLInputElement).value
                        )}
                      title="Edit color ${v}"
                      class="absolute -bottom-1 -right-1 w-[0.9rem] h-[0.9rem] p-0 border border-[color:var(--base1)] rounded-[2px] cursor-pointer bg-transparent" />`
                  : ""}
              </div>`;
            })}
            <button
              class="flex items-center justify-center w-[2rem] h-[2rem] text-[0.9rem] rounded-[3px] cursor-pointer bg-[var(--base2)] border border-[color:var(--base4)] text-[color:var(--base10)] hover:bg-[var(--base3)] hover:text-[color:var(--base13)]"
              title="Add a palette color"
              @click=${() => handlers.onBimpPaletteAdd()}>
              +
            </button>
          </div>

          <canvas
            class="block cursor-crosshair select-none rounded-[3px] bg-[var(--base3)]"
            style="width: ${width * cellSizePx}px; height: ${height * cellSizePx}px;"
            ${ref((el) => {
              if (el) drawBimpCanvas(el as HTMLCanvasElement, edit, cellSizePx);
            })}
            @pointerdown=${(e: PointerEvent) => {
              e.preventDefault();
              const [cx, cy] = canvasToCell(e, cellSizePx, height);
              (e.currentTarget as HTMLCanvasElement).setPointerCapture(
                e.pointerId
              );
              handlers.onBimpPointerDown(cx, cy);
            }}
            @pointermove=${(e: PointerEvent) => {
              if (!edit.dragFrom) return;
              const [cx, cy] = canvasToCell(e, cellSizePx, height);
              handlers.onBimpPointerMove(cx, cy);
            }}
            @pointerup=${(e: PointerEvent) => {
              (e.currentTarget as HTMLCanvasElement).releasePointerCapture(
                e.pointerId
              );
              handlers.onBimpPointerUp();
            }}
            @pointercancel=${() => handlers.onBimpPointerUp()}></canvas>
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
  `;
}

function canvasToCell(
  e: PointerEvent,
  cellSize: number,
  height: number
): [number, number] {
  const canvas = e.currentTarget as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.clientWidth / rect.width;
  const scaleY = canvas.clientHeight / rect.height;
  const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
  const yFromTop = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);
  // Flip so row 0 is at the bottom, matching how the knit chart reads.
  const y = height - 1 - yFromTop;
  return [x, y];
}

function getDisplayPixels(edit: BimpEditState): number[] {
  if (!edit.dragFrom || !edit.dragTo) return edit.pixels;
  if (edit.activeTool !== "line" && edit.activeTool !== "rect") {
    return edit.pixels;
  }
  const bimp = new Bimp(edit.width, edit.height, edit.pixels);
  const result =
    edit.activeTool === "line"
      ? bimp.line(edit.dragFrom, edit.dragTo, edit.brushValue)
      : bimp.rect(edit.dragFrom, edit.dragTo, edit.brushValue);
  return Array.from(result.pixels);
}

function drawBimpCanvas(
  canvas: HTMLCanvasElement,
  edit: BimpEditState,
  cellSize: number
): void {
  const { width, height, palette } = edit;
  const pixels = getDisplayPixels(edit);

  const dpr = window.devicePixelRatio || 1;
  const pxW = width * cellSize;
  const pxH = height * cellSize;
  if (canvas.width !== pxW * dpr || canvas.height !== pxH * dpr) {
    canvas.width = pxW * dpr;
    canvas.height = pxH * dpr;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const screenY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const v = pixels[y * width + x];
      ctx.fillStyle = colorFor(v, palette);
      ctx.fillRect(x * cellSize, screenY * cellSize, cellSize, cellSize);
    }
  }

  if (cellSize >= 10) {
    ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, pxH);
    }
    for (let y = 0; y <= height; y++) {
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(pxW, y * cellSize + 0.5);
    }
    ctx.stroke();
  }

  if (cellSize >= 24) {
    ctx.font = `${Math.floor(cellSize * 0.35)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let y = 0; y < height; y++) {
      const screenY = height - 1 - y;
      for (let x = 0; x < width; x++) {
        const v = pixels[y * width + x];
        ctx.fillStyle = pickTextColor(colorFor(v, palette));
        ctx.fillText(
          String(v),
          x * cellSize + cellSize / 2,
          screenY * cellSize + cellSize / 2
        );
      }
    }
  }
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
                  ["\u2318 / Ctrl + S", "Download script as .js"],
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
