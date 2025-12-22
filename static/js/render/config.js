// static/js/config.js
// =====================================================
// 全域設定檔（正式部署等級）
// =====================================================

export const CONFIG = {
    // API 前綴（同網域部署 → 一律用相對路徑）
    API_PREFIX: '/api/v1',

    // 預設參數
    DEFAULT_LIMIT: 100,
    DEFAULT_STATS_DAYS: 20,

    // 快取設定
    CACHE_MINUTES: 5,

    // UI 設定
    NOTIFICATION_DURATION: 3000,
    LOADING_DELAY: 300,

    // 資料格式
    DATE_FORMAT: 'YYYY/MM/DD',
    PRICE_DECIMAL: 2,

    // 環境偵測（僅用於 debug log）
    isDevelopment: (
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1'
    ),

    // 組合 API URL（核心）
    getApiUrl(path) {
        return `${this.API_PREFIX}${path}`;
    },

    // 健康檢查
    getHealthUrl() {
        return '/health';
    }
};

// 僅在開發環境輸出 log
if (CONFIG.isDevelopment) {
    console.log('🔧 開發模式啟用');
    console.log('API Prefix:', CONFIG.API_PREFIX);
}
