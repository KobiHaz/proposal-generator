import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "html2canvas": "html2canvas-pro",
        },
    },
    server: {
        port: 8085,
    },
});
