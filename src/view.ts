import { html } from "lit-html";
import { EXAMPLES } from "./examples";

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
}

export interface ViewHandlers {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectExample: (i: number) => void;
  onRelax: () => void;
  onReset: () => void;
  onFitCamera: () => void;
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
            <textarea
              id="code-editor"
              class="flex-1 w-full resize-none border-0 outline-none font-mono text-[0.82rem] leading-[1.6] py-3 px-4 bg-[var(--base0)] text-[color:var(--base12)] [tab-size:2] whitespace-pre overflow-auto"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              .value=${state.code}></textarea>
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
  `;
}
