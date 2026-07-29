import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ExcelJS is loaded only when a user exports a report. Keep the warning
    // threshold above that isolated optional chunk while the initial bundle
    // remains below Vite's default 500 kB recommendation.
    chunkSizeWarningLimit: 1000,
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});
