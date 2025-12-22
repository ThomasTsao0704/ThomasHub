# backend/services/stock_service.py
"""
股票服務層 - 處理股票相關的業務邏輯
"""

from typing import List, Dict
from core.config import STOCK_DIR
from core.csv_loader import load_csv
from core.json_utils import sanitize_json


def get_stock(code: str, limit: int = 100) -> List[Dict]:
    """
    取得股票歷史資料
    
    Args:
        code: 股票代碼
        limit: 資料筆數限制
        
    Returns:
        股票資料列表（最新的在前面）
    """
    csv_path = STOCK_DIR / f"{code}.csv"
    df = load_csv(csv_path)
    
    # 確保有 Date 欄位
    if 'Date' not in df.columns:
        raise ValueError(f"CSV 檔案缺少 Date 欄位")
    
    # 按日期降序排序（最新的在前）
    df = df.sort_values('Date', ascending=False)
    
    # 限制筆數
    df = df.head(limit)
    
    # 轉換為字典列表
    return sanitize_json(df.to_dict(orient='records'))


def get_latest(code: str) -> Dict:
    """
    取得股票最新交易資料
    
    Args:
        code: 股票代碼
        
    Returns:
        最新交易資料字典
    """
    csv_path = STOCK_DIR / f"{code}.csv"
    df = load_csv(csv_path)
    
    # 取得最新一筆
    latest = df.sort_values('Date', ascending=False).iloc[0]
    
    return sanitize_json(latest.to_dict())


def get_stats(code: str, days: int = 20) -> Dict:
    """
    取得股票統計資訊
    
    Args:
        code: 股票代碼
        days: 統計天數
        
    Returns:
        統計資訊字典
    """
    csv_path = STOCK_DIR / f"{code}.csv"
    df = load_csv(csv_path)
    
    # 取得最近 N 天的資料
    df = df.sort_values('Date', ascending=False).head(days)
    
    # 計算統計值
    stats = {
        "code": code,
        "days_count": len(df),
        "latest_price": float(df['Close'].iloc[0]) if len(df) > 0 else None,
        "avg_price": float(df['Close'].mean()),
        "max_price": float(df['High'].max()),
        "min_price": float(df['Low'].min()),
        "latest_date": str(df['Date'].iloc[0]) if len(df) > 0 else None
    }
    
    return sanitize_json(stats)
