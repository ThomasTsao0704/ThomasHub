import { defineConfig } from 'vite'

export default defineConfig({
  root: '.', // 專案根目錄是當前資料夾
  build: {
    outDir: 'site',
    rollupOptions: {
      input: 'index.html'
    }
  }
})
