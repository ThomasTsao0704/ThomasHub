from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os

from api.stock import router as stock_router
from api.analysis import router as analysis_router
from api.daily import router as daily_router
from core.config import STATIC_DIR, API_PREFIX, DEBUG

# ============================================================
# FastAPI App（⚠️ 全專案唯一一個 FastAPI()）
# ============================================================

app = FastAPI(
    title="台股分析系統 API",
    description="提供台灣股票市場資料查詢與分析功能",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# ============================================================
# No-Cache Middleware（開發環境專用）
# ============================================================

class NoCacheMiddleware(BaseHTTPMiddleware):
    """禁用靜態檔案快取（僅開發環境）"""
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # 只對 JS/CSS/HTML 檔案禁用快取
        if any(request.url.path.endswith(ext) for ext in ['.js', '.css', '.html']):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        
        return response

# ============================================================
# Middleware
# ============================================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 開發環境：添加 No-Cache Middleware
if DEBUG:
    app.add_middleware(NoCacheMiddleware)
    print("🔧 開發模式：已啟用 No-Cache Middleware")

# ============================================================
# Health Check
# ============================================================

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "message": "API 運作正常",
        "version": "2.0.0"
    }

# ============================================================
# API Routers
# ============================================================

app.include_router(stock_router, prefix=API_PREFIX, tags=["Stock"])
app.include_router(analysis_router, prefix=API_PREFIX, tags=["Analysis"])
app.include_router(daily_router, prefix=API_PREFIX, tags=["Daily"])

# ============================================================
# Frontend Static Files
# 👉 html=True 很重要（避免 index.html 類問題）
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR, html=True),
    name="static"
)

# ============================================================
# Frontend Entry（Root）
# ============================================================

@app.get("/", include_in_schema=False)
def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# ============================================================
# favicon（避免一直 404，順便專業）
# ============================================================

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    path = os.path.join(STATIC_DIR, "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    return {}

# ============================================================
# Startup Banner
# ============================================================

if DEBUG:
    print("\n" + "=" * 60)
    print("🚀 台股分析系統後端啟動")
    print("=" * 60)
    print("📍 前端網址: http://localhost:8000/")
    print("📍 API 文件: http://localhost:8000/api/docs")
    print("📍 健康檢查: http://localhost:8000/health")
    print("=" * 60 + "\n")