// static/js/state.js
// 全域狀態管理 - 避免全域變數污染

export const State = {
    // 當前視圖
    currentView: 'stock',
    
    // 最後查詢的股票代碼
    lastStockCode: null,
    
    // 快取資料
    cache: {},
    
    // API 連線狀態
    apiConnected: false,
    
    /**
     * 設定當前視圖
     * @param {string} view - 視圖名稱
     */
    setView(view) {
        this.currentView = view;
    },
    
    /**
     * 取得當前視圖
     * @returns {string} 視圖名稱
     */
    getView() {
        return this.currentView;
    },
    
    /**
     * 設定最後查詢的股票代碼
     * @param {string} code - 股票代碼
     */
    setLastStock(code) {
        this.lastStockCode = code;
    },
    
    /**
     * 取得最後查詢的股票代碼
     * @returns {string|null} 股票代碼
     */
    getLastStock() {
        return this.lastStockCode;
    },
    
    /**
     * 設定快取資料
     * @param {string} key - 快取鍵
     * @param {any} data - 資料
     * @param {number} ttl - 存活時間（毫秒）
     */
    setCache(key, data, ttl = 300000) {
        this.cache[key] = {
            data,
            timestamp: Date.now(),
            ttl
        };
    },
    
    /**
     * 取得快取資料
     * @param {string} key - 快取鍵
     * @returns {any|null} 快取資料或 null
     */
    getCache(key) {
        const cached = this.cache[key];
        
        if (!cached) {
            return null;
        }
        
        // 檢查是否過期
        if (Date.now() - cached.timestamp > cached.ttl) {
            delete this.cache[key];
            return null;
        }
        
        return cached.data;
    },
    
    /**
     * 清除快取
     * @param {string} key - 快取鍵（可選，不提供則清除全部）
     */
    clearCache(key = null) {
        if (key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
    },
    
    /**
     * 設定 API 連線狀態
     * @param {boolean} connected - 是否連線
     */
    setApiStatus(connected) {
        this.apiConnected = connected;
    },
    
    /**
     * 取得 API 連線狀態
     * @returns {boolean} 是否連線
     */
    isApiConnected() {
        return this.apiConnected;
    }
};
