import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev: serves index.html (demo site). Build: one self-contained IIFE script.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : "development") },
  build: {
    lib: { entry: "src/main.tsx", name: "AgentChat", formats: ["iife"], fileName: () => "agent-chat.js" },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
}));
