import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import { resolve } from "path";

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

// Determine if we're building for GitHub Pages
const isGitHubPages = process.env.VITE_ENABLE_GITHUB_PAGES === "true";
const repoName = "masterlinc"; // Change this to your repository name

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
  // GitHub Pages base path configuration
  base: isGitHubPages ? `/${repoName}/` : "/",
  // Build configuration
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-tabs",
          ],
          "chart-vendor": ["recharts", "d3"],
        },
      },
    },
  },
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
});
