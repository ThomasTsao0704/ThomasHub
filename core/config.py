# backend/core/config.py
"""
核心設定模組 - 定義所有路徑與常數
"""

from pathlib import Path

# 專案根目錄
BASE_DIR = Path(__file__).resolve().parent.parent

# 資料目錄
DATA_DIR = BASE_DIR / "data"
STOCK_DIR = DATA_DIR / "stock"
DAILY_DIR = DATA_DIR / "daily"

# 前端靜態檔案目錄
STATIC_DIR = BASE_DIR / "static"

# API 設定
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"

# 確保必要目錄存在
for directory in [DATA_DIR, STOCK_DIR, DAILY_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# 除錯模式
DEBUG = True

if DEBUG:
    print(f"✅ 設定已載入")
    print(f"   BASE_DIR: {BASE_DIR}")
    print(f"   STOCK_DIR: {STOCK_DIR}")
    print(f"   DAILY_DIR: {DAILY_DIR}")
    print(f"   STATIC_DIR: {STATIC_DIR}")
