import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { externalPackages } from "./package-boundary.mjs";

export default defineConfig({
  plugins: [react(), vue()],
  build: {
    lib: {
      entry: { index: "src/index.ts", core: "src/core.ts", react: "src/react.ts", vue: "src/vue.ts" },
      fileName: (_format, entry) => entry + ".js",
      formats: ["es"],
      name: "KmsfGridstack",
    },
    rollupOptions: {
      external: externalPackages,
    },
    sourcemap: true,
  },
});
