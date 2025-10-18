import { defineConfig } from 'vite'

export default defineConfig({
  root: '.', // 專案根目錄是當前資料夾
  build: {
    outDir: 'site', // 對應 workflow 的輸出資料夾
    rollupOptions: {
      input: 'index.html'
    }
  }
})
