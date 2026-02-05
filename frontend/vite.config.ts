import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * WSL2 およびスマホ接続のため server.host: true を設定（design.md セクション7）
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
