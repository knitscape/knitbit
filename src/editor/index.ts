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
  codeFolding,
  foldGutter,
  foldKeymap,
  ensureSyntaxTree,
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
import {
  bimpEditExtension,
  bimpFoldService,
  foldAllBimpPixels,
  type OnEditBimp,
} from "./bimpWidget";

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
        codeFolding(),
        foldGutter(),
        bimpFoldService,
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
          ...foldKeymap,
        ]),
        EditorState.tabSize.of(2),
      ],
    }),
    parent,
  });

  new ResizeObserver(() => {
    editorView?.requestMeasure();
  }).observe(parent);

  if (ensureSyntaxTree(editorView.state, editorView.state.doc.length, 100)) {
    foldAllBimpPixels(editorView);
  }

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
  if (ensureSyntaxTree(editorView.state, editorView.state.doc.length, 100)) {
    foldAllBimpPixels(editorView);
  }
}

export function replaceBimpPixels(
  arrayFrom: number,
  arrayTo: number,
  pixels: number[]
): void {
  if (!editorView) return;
  // Replace only the content between `[` and `]` so any existing fold range
  // (which covers the inner span) stays valid after the edit.
  const innerFrom = arrayFrom + 1;
  const innerTo = arrayTo - 1;
  editorView.dispatch({
    changes: { from: innerFrom, to: innerTo, insert: pixels.join(", ") },
  });
}
