import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
      external: ["react", "react-dom", "react/jsx-runtime", "gridstack", "lucide-react"],
    },
    sourcemap: true,
  },
});
