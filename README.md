# Branch Hub Starter

自動生成 GitHub 首頁，列出所有分支的子頁連結。  
每當你建立或刪除分支、或在分支中新增 `docs/index.html`，首頁都會自動更新。

---

## 🔧 使用方式
1. **建立新分支**
   ```bash
   git checkout -b feature-demo
   mkdir -p docs
   echo "<h1>Hello Feature Demo!</h1>" > docs/index.html
   git add .
   git commit -m "add feature demo page"
   git push origin feature-demo
