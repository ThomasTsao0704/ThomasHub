# backend/api/daily.py
"""
每日行情 API 路由 - 處理每日市場行情的 HTTP 請求
"""

from fastapi import APIRouter, HTTPException
from core.config import DAILY_DIR
from core.csv_loader import load_csv
from core.json_utils import sanitize_json

router = APIRouter(prefix="/daily", tags=["每日行情"])


@router.get("/{date}")
async def daily_market(date: str):
    """
    取得指定日期的市場行情
    
    - **date**: 日期 (YYYYMMDD)
    """
    try:
        csv_path = DAILY_DIR / f"{date}.csv"
        df = load_csv(csv_path)
        
        # 轉換為字典列表
        data = sanitize_json(df.to_dict(orient='records'))
        
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到日期: {date}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{date}/gainers")
async def daily_gainers(date: str, limit: int = 10):
    """
    取得當日漲幅排行
    
    - **date**: 日期 (YYYYMMDD)
    - **limit**: 限制筆數（預設 10）
    """
    try:
        csv_path = DAILY_DIR / f"{date}.csv"
        df = load_csv(csv_path)
        
        # 假設有 ChangePercent 欄位
        if 'ChangePercent' not in df.columns:
            raise HTTPException(status_code=400, detail="資料中缺少 ChangePercent 欄位")
        
        # 篩選並排序
        gainers = df.sort_values('ChangePercent', ascending=False).head(limit)
        
        return sanitize_json(gainers.to_dict(orient='records'))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到日期: {date}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{date}/losers")
async def daily_losers(date: str, limit: int = 10):
    """
    取得當日跌幅排行
    
    - **date**: 日期 (YYYYMMDD)
    - **limit**: 限制筆數（預設 10）
    """
    try:
        csv_path = DAILY_DIR / f"{date}.csv"
        df = load_csv(csv_path)
        
        if 'ChangePercent' not in df.columns:
            raise HTTPException(status_code=400, detail="資料中缺少 ChangePercent 欄位")
        
        # 篩選並排序
        losers = df.sort_values('ChangePercent', ascending=True).head(limit)
        
        return sanitize_json(losers.to_dict(orient='records'))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到日期: {date}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
