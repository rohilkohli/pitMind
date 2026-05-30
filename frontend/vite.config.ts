import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Remove console.log and debugger in production
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:8000",

        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path,
      },
    },
    // Relaxing security headers to allow Firebase Auth popups and iframes
    // headers: {
    //   "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    //   "Cross-Origin-Embedder-Policy": "require-corp",
    // },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("recharts")) return "vendor-charts";
          if (id.includes("firebase")) return "vendor-firebase";
          if (id.includes("@radix-ui") || id.includes("class-variance-authority") || id.includes("clsx") || id.includes("tailwind-merge")) {
            return "vendor-ui";
          }
          if (id.includes("lucide-react")) return "vendor-icons";

          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
}));
