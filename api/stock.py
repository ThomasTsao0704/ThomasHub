# backend/api/stock.py
"""
股票 API 路由 - 處理股票相關的 HTTP 請求
"""

from fastapi import APIRouter, HTTPException
from services.stock_service import get_stock, get_latest, get_stats

router = APIRouter(prefix="/stock", tags=["股票查詢"])


@router.get("/{code}")
async def stock_history(code: str, limit: int = 100):
    """
    取得股票歷史資料
    
    - **code**: 股票代碼
    - **limit**: 資料筆數限制（預設 100）
    """
    try:
        data = get_stock(code, limit)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到股票代碼: {code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code}/latest")
async def stock_latest(code: str):
    """
    取得股票最新交易資料
    
    - **code**: 股票代碼
    """
    try:
        data = get_latest(code)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到股票代碼: {code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{code}/stats")
async def stock_stats(code: str, days: int = 20):
    """
    取得股票統計資訊
    
    - **code**: 股票代碼
    - **days**: 統計天數（預設 20）
    """
    try:
        data = get_stats(code, days)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到股票代碼: {code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
