import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const port = Number(process.env.COMINS_GRID_LAYOUT_PORT ?? process.env.PORT ?? 6001);

export default defineConfig({
  plugins: [react(), vue()],
  root: "example",
  build: { outDir: "../dist-examples", emptyOutDir: true, rollupOptions: { input: { index: fileURLToPath(new URL("./example/index.html", import.meta.url)), vue: fileURLToPath(new URL("./example/vue.html", import.meta.url)) } } },
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
  },
});
