// static/js/render/stock.js
// 股票資料渲染 - 負責股票查詢相關的 HTML 生成

/**
 * 格式化日期 (YYYYMMDD -> YYYY/MM/DD)
 * @param {number|string} date - 日期數字
 * @returns {string} 格式化後的日期
 */
function formatDate(date) {
    const str = String(date);
    if (str.length !== 8) return str;
    return `${str.slice(0,4)}/${str.slice(4,6)}/${str.slice(6,8)}`;
}

/**
 * 格式化價格
 * @param {number} value - 價格
 * @returns {string} 格式化後的價格
 */
function formatPrice(value) {
    return value === null || value === undefined ? '-' : Number(value).toFixed(2);
}

/**
 * 格式化成交量
 * @param {number} value - 成交量
 * @returns {string} 格式化後的成交量
 */
function formatVolume(value) {
    if (!value) return '-';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(0) + 'K';
    return String(value);
}

/**
 * 渲染最新交易卡片
 * @param {Object} data - 最新交易資料
 * @param {string} code - 股票代碼
 */
export function renderLatestStock(data, code) {
    const container = document.getElementById('stockInfo');
    if (!container) return;

    container.innerHTML = `
        <div class="latest-card">
            <h2>${code} | 最新交易</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <label>日期</label>
                    <value>${formatDate(data.Date)}</value>
                </div>
                <div class="stat-item">
                    <label>開盤</label>
                    <value>${formatPrice(data.Open)}</value>
                </div>
                <div class="stat-item high">
                    <label>最高</label>
                    <value>${formatPrice(data.High)}</value>
                </div>
                <div class="stat-item low">
                    <label>最低</label>
                    <value>${formatPrice(data.Low)}</value>
                </div>
                <div class="stat-item highlight">
                    <label>收盤</label>
                    <value>${formatPrice(data.Close)}</value>
                </div>
                <div class="stat-item">
                    <label>成交量</label>
                    <value>${formatVolume(data.Volume)}</value>
                </div>
            </div>
        </div>
    `;
}

/**
 * 渲染歷史資料表格
 * @param {Array} rows - 資料陣列
 * @param {string} code - 股票代碼
 */
export function renderStockTable(rows, code) {
    const container = document.getElementById('dataTable');
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="no-data">查無歷史資料</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-header">
            <h2>${code} | 歷史資料</h2>
            <span class="record-count">${rows.length} 筆記錄</span>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>開盤</th>
                        <th>最高</th>
                        <th>最低</th>
                        <th>收盤</th>
                        <th>成交量</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td>${formatDate(row.Date)}</td>
                            <td>${formatPrice(row.Open)}</td>
                            <td class="high">${formatPrice(row.High)}</td>
                            <td class="low">${formatPrice(row.Low)}</td>
                            <td class="close">${formatPrice(row.Close)}</td>
                            <td>${formatVolume(row.Volume)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
