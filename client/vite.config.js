import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the existing Next.js backend (running on :3000)
      "/api": "http://localhost:3000"
    }
  }
});

