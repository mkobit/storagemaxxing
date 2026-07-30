import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@storagemaxxing/catalog/lookup":
        process.env.E2E_DRILL_FIXTURE === "true"
          ? path.resolve(__dirname, "e2e/fixtures/catalogWithDrillFixture.ts")
          : path.resolve(__dirname, "../../packages/catalog/src/lookup.ts"),
      "@storagemaxxing/geometry": path.resolve(__dirname, "../../packages/geometry/src"),
      "@storagemaxxing/catalog": path.resolve(__dirname, "../../packages/catalog/src"),
      "@storagemaxxing/packer": path.resolve(__dirname, "../../packages/packer/src"),
      "@storagemaxxing/store": path.resolve(__dirname, "../../packages/store/src"),
      "@storagemaxxing/assembly": path.resolve(__dirname, "../../packages/assembly/src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    host: "localhost",
    strictPort: true,
  },
});
