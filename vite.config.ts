import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { externalPackages } from "./package-boundary.mjs";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: () => "index.js",
      formats: ["es"],
      name: "KmsfGridstack",
    },
    rollupOptions: {
      external: externalPackages,
    },
    sourcemap: true,
  },
});
