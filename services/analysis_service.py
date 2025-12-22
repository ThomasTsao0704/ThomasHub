# backend/services/analysis_service.py
"""
分析服務層 - 處理股票分析相關的業務邏輯
"""

from typing import List, Dict
from core.config import STOCK_DIR
from core.csv_loader import load_csv
from core.json_utils import sanitize_json


def range_data(code: str, start: str, end: str) -> List[Dict]:
    """
    取得指定日期區間的股票資料
    
    Args:
        code: 股票代碼
        start: 起始日期 (YYYYMMDD)
        end: 結束日期 (YYYYMMDD)
        
    Returns:
        區間內的股票資料列表
    """
    csv_path = STOCK_DIR / f"{code}.csv"
    df = load_csv(csv_path)
    
    # 轉換日期格式為整數進行比較
    start_int = int(start)
    end_int = int(end)
    
    # 篩選日期區間
    mask = (df['Date'] >= start_int) & (df['Date'] <= end_int)
    filtered_df = df.loc[mask]
    
    # 按日期降序排序
    filtered_df = filtered_df.sort_values('Date', ascending=False)
    
    return sanitize_json(filtered_df.to_dict(orient='records'))


def compare(codes: List[str], days: int = 20) -> Dict:
    """
    比較多檔股票的表現
    
    Args:
        codes: 股票代碼列表
        days: 比較天數
        
    Returns:
        比較結果字典，包含每檔股票的統計資訊
    """
    result = []
    
    for code in codes:
        try:
            csv_path = STOCK_DIR / f"{code}.csv"
            df = load_csv(csv_path)
            
            # 取得最近 N 天
            df = df.sort_values('Date', ascending=False).head(days)
            
            if len(df) == 0:
                continue
            
            # 計算統計值
            stock_stats = {
                "code": code,
                "latest_price": float(df['Close'].iloc[0]),
                "avg_price": float(df['Close'].mean()),
                "max_price": float(df['High'].max()),
                "min_price": float(df['Low'].min()),
                "days_count": len(df)
            }
            
            result.append(stock_stats)
            
        except Exception as e:
            print(f"⚠️  無法載入 {code}: {e}")
            continue
    
    return sanitize_json({
        "days": days,
        "stocks": result
    })


def get_summary(codes: List[str]) -> Dict:
    """
    取得多檔股票的摘要資訊
    
    Args:
        codes: 股票代碼列表
        
    Returns:
        摘要資訊字典
    """
    summaries = []
    
    for code in codes:
        try:
            csv_path = STOCK_DIR / f"{code}.csv"
            df = load_csv(csv_path)
            
            if len(df) == 0:
                continue
            
            latest = df.sort_values('Date', ascending=False).iloc[0]
            
            summaries.append({
                "code": code,
                "latest_date": str(latest['Date']),
                "latest_price": float(latest['Close']),
                "total_records": len(df)
            })
            
        except Exception as e:
            print(f"⚠️  無法載入 {code}: {e}")
            continue
    
    return sanitize_json({
        "total_stocks": len(summaries),
        "stocks": summaries
    })
