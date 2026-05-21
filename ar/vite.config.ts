import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".ngrok-free.dev"],
    headers: {
      "Permissions-Policy": "xr-spatial-tracking=(self), camera=(self)",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [".ngrok-free.dev"],
    headers: {
      "Permissions-Policy": "xr-spatial-tracking=(self), camera=(self)",
    },
  },
});
