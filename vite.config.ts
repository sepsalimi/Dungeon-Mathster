import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const configuredBasePath = process.env.VITE_BASE_PATH ?? "/";
const basePath = configuredBasePath.endsWith("/") ? configuredBasePath : `${configuredBasePath}/`;
const assetPath = (path: string) => `${basePath}${path}`.replace(/\/{2,}/g, "/");

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Dungeon Mathster",
        short_name: "Mathster",
        description: "A dungeon math battler with relics, floors, and BEDMAS puzzles.",
        theme_color: "#15121d",
        background_color: "#15121d",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone"],
        orientation: "portrait",
        id: basePath,
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: assetPath("pwa-192x192.png"),
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: assetPath("pwa-512x512.png"),
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: assetPath("pwa-maskable-512x512.png"),
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    allowedHosts: true,
  },
});
