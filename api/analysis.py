# backend/api/analysis.py
"""
分析 API 路由 - 處理股票分析相關的 HTTP 請求
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from services.analysis_service import range_data, compare, get_summary

router = APIRouter(prefix="/analysis", tags=["股票分析"])


@router.get("/range")
async def analysis_range(
    code: str = Query(..., description="股票代碼"),
    start: str = Query(..., description="起始日期 (YYYYMMDD)"),
    end: str = Query(..., description="結束日期 (YYYYMMDD)")
):
    """
    取得指定日期區間的股票資料
    
    - **code**: 股票代碼
    - **start**: 起始日期 (YYYYMMDD)
    - **end**: 結束日期 (YYYYMMDD)
    """
    try:
        data = range_data(code, start, end)
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"找不到股票代碼: {code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
async def analysis_compare(
    codes: str = Query(..., description="股票代碼列表（逗號分隔）"),
    days: int = Query(20, description="比較天數")
):
    """
    比較多檔股票的表現
    
    - **codes**: 股票代碼列表，使用逗號分隔（例: 2330,2317,2454）
    - **days**: 比較天數（預設 20）
    """
    try:
        # 解析股票代碼
        code_list = [c.strip() for c in codes.split(',') if c.strip()]
        
        if len(code_list) == 0:
            raise HTTPException(status_code=400, detail="請提供至少一個股票代碼")
        
        data = compare(code_list, days)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def analysis_summary(
    codes: str = Query(..., description="股票代碼列表（逗號分隔）")
):
    """
    取得多檔股票的摘要資訊
    
    - **codes**: 股票代碼列表，使用逗號分隔
    """
    try:
        code_list = [c.strip() for c in codes.split(',') if c.strip()]
        
        if len(code_list) == 0:
            raise HTTPException(status_code=400, detail="請提供至少一個股票代碼")
        
        data = get_summary(code_list)
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
