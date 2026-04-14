import { defineConfig } from "vite";

// Deploy target: https://knitscape.github.io/knitbit/
// Setting base ensures built asset URLs are prefixed with the repo name.
export default defineConfig({
  base: "/knitbit/",
});
