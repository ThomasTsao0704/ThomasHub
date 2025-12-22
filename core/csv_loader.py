# backend/core/csv_loader.py
"""
CSV 資料載入器 - 統一處理 CSV 檔案讀取
"""

import pandas as pd
from pathlib import Path
from typing import Union


def load_csv(path: Union[str, Path]) -> pd.DataFrame:
    """
    載入 CSV 檔案
    
    Args:
        path: CSV 檔案路徑
        
    Returns:
        pandas DataFrame
        
    Raises:
        FileNotFoundError: 檔案不存在
        Exception: 讀取失敗
    """
    path = Path(path)
    
    if not path.exists():
        raise FileNotFoundError(f"找不到檔案: {path.name}")
    
    try:
        # 讀取 CSV，假設使用 UTF-8 編碼
        df = pd.read_csv(path, encoding='utf-8')
        return df
    except UnicodeDecodeError:
        # 如果 UTF-8 失敗，嘗試 Big5（台灣常用編碼）
        try:
            df = pd.read_csv(path, encoding='big5')
            return df
        except Exception as e:
            raise Exception(f"讀取 CSV 失敗: {str(e)}")
    except Exception as e:
        raise Exception(f"讀取 CSV 失敗: {str(e)}")


def load_csv_safe(path: Union[str, Path], default=None) -> pd.DataFrame:
    """
    安全載入 CSV（失敗時返回預設值）
    
    Args:
        path: CSV 檔案路徑
        default: 失敗時返回的預設值
        
    Returns:
        pandas DataFrame 或 default
    """
    try:
        return load_csv(path)
    except Exception as e:
        print(f"⚠️  載入失敗: {e}")
        return default if default is not None else pd.DataFrame()
