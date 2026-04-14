# knitbit

A tool for tinkering with knitting programs. Write some JavaScript to manipulate
bitmaps into a program of knit ops and get a live 3d visualization of the knit
topology.

## Run

```sh
npm install
npm run dev
```

Vite will print a local URL; open it in a browser.

## How it works

Your script is evaluated with two globals — `Bimp` (a bitmap class) and `Op` (a
stitch-operation enum) — and returns a program description:

```js
return {
  ops, // Bimp of Op values (width × height)
  yarnFeeder, // per-row feeder id, or null for transfer-only rows
  palette, // CSS colors indexed by feeder id - 1
  racking, // optional per-row bed offset
  direction, // optional "left"|"right" per row; inferred if omitted
};
```

See the in-app help pane (top-right `?`) for the full op set, return value, and
keyboard shortcuts.

## Features

- **Editor** — CodeMirror 6 with JavaScript highlighting, autocomplete, folding,
  and inline widgets.
- **Bitmap editor** — a `✎` badge appears on each
  `new Bimp(w, h, [...], [palette])` literal. Click it to paint the bitmap
  visually: brush / line / rect / flood tools, shift arrows, resize, zoom, and
  editable palette labels.
- **Auto-run** — toggle to re-execute the script on every edit (typing, paints,
  resizes) with a debounced preview.
- **Chart + 3D preview** — click a chart cell to scrub the simulation to that
  stitch.
- **Script workspace** — scripts auto-save to `localStorage` under editable
  names; bundled examples are read-only until you edit them (then they fork into
  `Untitled`).

## Layout

- `src/index.ts` — app state, handlers, boot.
- `src/view.ts` — lit-html view / modals.
- `src/editor/` — CodeMirror setup, bitmap widget, completions, theme.
- `src/simulation/` — topology and relaxation for the 3D preview.
- `src/shared/` — `Bimp` class and `Op` enum.
- `src/examples/*.js` — bundled example scripts (plain JS files, loaded via
  `import.meta.glob` as raw text).

## License

MIT
