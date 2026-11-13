import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const catalogProxy = {
  "^/api/v1/products(?:[/?]|$)": "http://127.0.0.1:8000",
  "^/api/v1/product-3d-models/[^/]+/file(?:\\?|$)": "http://127.0.0.1:8000",
  "/storage/": "http://127.0.0.1:8000",
};

export default defineConfig({
  base: "/ar/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("/three/")) return "three";
          if (id.includes("/lucide-react/")) return "icons";
          if (id.includes("/@radix-ui/")) return "ui";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/")
          ) {
            return "react";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: catalogProxy,
    allowedHosts: [".ngrok-free.dev"],
    headers: {
      "Permissions-Policy": "xr-spatial-tracking=(self), camera=(self)",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    proxy: catalogProxy,
    allowedHosts: [".ngrok-free.dev"],
    headers: {
      "Permissions-Policy": "xr-spatial-tracking=(self), camera=(self)",
    },
  },
});
