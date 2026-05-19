import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@storagemaxxing/geometry": path.resolve(__dirname, "../../packages/geometry/src"),
      "@storagemaxxing/catalog": path.resolve(__dirname, "../../packages/catalog/src"),
      "@storagemaxxing/packer": path.resolve(__dirname, "../../packages/packer/src"),
      "@storagemaxxing/solver": path.resolve(__dirname, "../../packages/solver/src"),
      "@storagemaxxing/store": path.resolve(__dirname, "../../packages/store/src"),
      "@storagemaxxing/assembly": path.resolve(__dirname, "../../packages/assembly/src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
