import { EditorView } from "@codemirror/view";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const knitscapeTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--base0)",
      color: "var(--base12)",
      fontSize: "0.82rem",
      lineHeight: "1.6",
      height: "100%",
    },
    ".cm-content": {
      fontFamily: "monospace",
      padding: "0.75rem 0",
      caretColor: "var(--base13)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--base1)",
      color: "var(--base6)",
      border: "none",
      borderRight: "1px solid var(--base3)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--base2)",
      color: "var(--base10)",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--base13)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.15) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.15) !important",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--base1)",
      color: "var(--base12)",
      border: "1px solid var(--base3)",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--base3)",
      color: "var(--base13)",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      outline: "1px solid var(--base5)",
    },
    ".cm-bimp-edit-btn": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "1.1rem",
      height: "1.1rem",
      marginLeft: "0.3rem",
      verticalAlign: "middle",
      backgroundColor: "var(--base2)",
      color: "var(--base10)",
      border: "1px solid var(--base4)",
      borderRadius: "3px",
      fontSize: "0.7rem",
      fontFamily: "inherit",
      cursor: "pointer",
      padding: "0",
      lineHeight: "1",
      userSelect: "none",
      transition: "background 80ms, color 80ms",
    },
    ".cm-bimp-edit-btn:hover": {
      backgroundColor: "var(--accent)",
      color: "white",
      borderColor: "var(--accent)",
    },
  },
  { dark: true }
);

export const knitscapeHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "hsl(316, 29%, 64%)" },
  { tag: tags.controlKeyword, color: "hsl(316, 29%, 64%)" },
  { tag: tags.string, color: "#a8dadc" },
  { tag: tags.number, color: "#f4a261" },
  { tag: tags.bool, color: "#f4a261" },
  { tag: tags.null, color: "#f4a261" },
  { tag: tags.operator, color: "var(--base10)" },
  { tag: tags.punctuation, color: "var(--base7)" },
  { tag: tags.comment, color: "var(--base5)", fontStyle: "italic" },
  { tag: tags.variableName, color: "var(--base12)" },
  { tag: tags.function(tags.variableName), color: "#08ccab" },
  { tag: tags.propertyName, color: "#e9c46a" },
  { tag: tags.typeName, color: "#2a9d8f" },
  { tag: tags.className, color: "#2a9d8f" },
  { tag: tags.definition(tags.variableName), color: "var(--base13)" },
]);
