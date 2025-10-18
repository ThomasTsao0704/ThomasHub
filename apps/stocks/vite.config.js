import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    root: ".",                       // 專案根目錄
    base: "./",                      // 使用相對路徑，避免 Pages 404
    build: {
        outDir: "dist",                // 預設輸出資料夾
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, "index.html"),
        },
    },
    server: { port: 5173 }
});
