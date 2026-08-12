import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server proxy: forward requests starting with `/api` to the backend
// Set backend URL with the VITE_API_URL env var (example: http://localhost:4000)
// This avoids CORS during development by proxying API calls through the dev server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
