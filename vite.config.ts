import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    host: true,
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "three-core": ["three"],
          "three-fiber": ["@react-three/fiber", "@react-three/drei"],
          "three-post": ["@react-three/postprocessing"],
          "three-physics": ["@react-three/rapier"],
          "gsap-vendor": ["gsap", "@gsap/react"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["three", "@react-three/fiber", "@react-three/drei"],
  },
});
