import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import {
  bracketMatching,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import {
  searchKeymap,
  highlightSelectionMatches,
} from "@codemirror/search";

import { knitscapeTheme, knitscapeHighlightStyle } from "./theme";
import { knitscapeCompletions } from "./completions";
import { bimpEditExtension, type OnEditBimp } from "./bimpWidget";

export type { BimpEditTarget, OnEditBimp } from "./bimpWidget";

let editorView: EditorView | null = null;

export function createEditor(
  parent: HTMLElement,
  initialCode: string,
  onRunScript: () => void,
  onEditBimp: OnEditBimp
): EditorView {
  if (editorView) {
    editorView.destroy();
  }

  editorView = new EditorView({
    state: EditorState.create({
      doc: initialCode,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        closeBrackets(),
        highlightSelectionMatches(),
        javascript(),
        autocompletion({ override: [knitscapeCompletions] }),
        syntaxHighlighting(knitscapeHighlightStyle),
        knitscapeTheme,
        bimpEditExtension(onEditBimp),
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onRunScript();
              return true;
            },
          },
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        EditorState.tabSize.of(2),
      ],
    }),
    parent,
  });

  new ResizeObserver(() => {
    editorView?.requestMeasure();
  }).observe(parent);

  return editorView;
}

export function getEditorCode(): string {
  return editorView?.state.doc.toString() ?? "";
}

export function setEditorCode(code: string): void {
  if (!editorView) return;
  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: code,
    },
  });
}

export function replaceBimpPixels(
  from: number,
  to: number,
  pixels: number[]
): void {
  if (!editorView) return;
  editorView.dispatch({
    changes: { from, to, insert: `[${pixels.join(", ")}]` },
  });
}
