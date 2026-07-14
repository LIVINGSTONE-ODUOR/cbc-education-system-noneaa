import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    host: true, // safer & clearer than "::"
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Proxy API requests to backend to bypass CORS
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Strip console.* and debugger statements from production builds only —
  // keeps them available while running `vite dev`, removes them from
  // everything shipped to real users.
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
}));
