import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev-only playground. The demo/ folder is not part of the published package.
export default defineConfig({
  root: "demo",
  plugins: [react(), tailwindcss()],
});
