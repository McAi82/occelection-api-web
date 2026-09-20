import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/css/app.css", "resources/js/main.tsx"],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    css: {
        transformer: "lightningcss",
    },
    build: {
        chunkSizeWarningLimit: 5000, // Increase warning limit (optional)
    },
});
