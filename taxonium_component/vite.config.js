import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  worker: {
    format: "umd",
  },
  plugins: [
    nodePolyfills({
      exclude: ["fs"],
      protocolImports: true,
    }),
    react({
      // This ensures React is properly treated as external
      jsxRuntime: "automatic",
    }),
    cssInjectedByJsPlugin(),
    tailwindcss(),
  ],
  define: {},

  build: {
    lib: {
      entry: "src/index.js",
      name: "Taxonium",
      fileName: (format) => `taxonium-component.${format}.js`,
      formats: ["es", "umd"], // Be explicit about formats
    },
    minify: true,
    sourcemap: true,

    rollupOptions: {
      // Externalize react and all its subpaths (react-dom/client,
      // react-dom/server, ...) so the consumer supplies a single React.
      external: (id) =>
        id === "prop-types" || /^react(-dom)?(\/|$)/.test(id),

      output: {
        globals: (id) => {
          if (id === "prop-types") return "PropTypes";
          if (id === "react/jsx-runtime") return "jsxRuntime";
          if (/^react-dom(\/|$)/.test(id)) return "ReactDOM";
          if (/^react(\/|$)/.test(id)) return "React";
          return id;
        },
        // Ensure chunking is handled properly
        manualChunks: undefined,
      },
    },

    // Prevents code splitting that might include React
    cssCodeSplit: false,
    emptyOutDir: true,
  },

  optimizeDeps: {
    // exclude: ["react", "react-dom", "prop-types"],
  },

  resolve: {
    alias: {
      "process/": "process",
      "stream/web": "web-streams-polyfill/dist/ponyfill",
    },
  },
});
