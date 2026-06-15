import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { prerenderPlugin } from "./scripts/seo/vite-prerender";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerenderPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large third-party dependencies into stable, cacheable chunks
        // so the main entry stays small and parses faster (lower TBT).
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "router";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "forms";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("react-helmet-async")
          ) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
  },
}));
