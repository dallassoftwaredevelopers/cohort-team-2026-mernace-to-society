import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: "..",
  build: {
    rollupOptions: {
      output: {
        // Split big libraries into their own files so browsers can cache them
        manualChunks(id) {
          if (id.includes("node_modules/@supabase")) return "supabase";
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/scheduler")
          )
            return "react";
        },
      },
    },
  },
});
