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
        //
        // IMPORTANT: React (react / react-dom / scheduler) MUST stay in the SAME
        // chunk as every library that calls React.createContext at module-init
        // time (react-router, @radix-ui, react-helmet-async, react-hook-form…).
        // Splitting React into its own chunk created a circular / out-of-order
        // chunk evaluation where `React` was undefined when those libs ran
        // ("Cannot read properties of undefined (reading 'createContext')"),
        // crashing the whole app and leaving only the raw prerendered HTML.
        // We therefore only peel off leaf libraries that depend on React in a
        // strictly one-directional (acyclic) way and never feed it back.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          if (id.includes("lucide-react")) return "icons";
          // React core + all its eager context consumers live together.
          return "vendor";
        },
      },
    },
  },
}));
