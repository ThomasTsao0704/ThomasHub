// static/js/render/analysis.js
// 區間分析渲染 - 負責區間查詢結果的 HTML 生成

/**
 * 格式化日期
 * @param {number|string} date - 日期
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
 * 計算區間統計
 * @param {Array} rows - 資料陣列
 * @returns {Object} 統計資訊
 */
function calculateRangeStats(rows) {
    if (!rows || rows.length === 0) return null;

    const prices = rows.map(r => r.Close).filter(p => p !== null);
    const volumes = rows.map(r => r.Volume).filter(v => v !== null);

    return {
        count: rows.length,
        avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
        maxPrice: Math.max(...prices).toFixed(2),
        minPrice: Math.min(...prices).toFixed(2),
        totalVolume: volumes.reduce((a, b) => a + b, 0),
        priceChange: ((prices[prices.length - 1] - prices[0]) / prices[0] * 100).toFixed(2)
    };
}

/**
 * 渲染區間分析表格
 * @param {Array} rows - 資料陣列
 * @param {string} code - 股票代碼
 * @param {string} start - 起始日期
 * @param {string} end - 結束日期
 */
export function renderRangeTable(rows, code, start, end) {
    const container = document.getElementById('analysisResults');
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="no-data">查無符合條件的資料</p>';
        return;
    }

    const stats = calculateRangeStats(rows);

    container.innerHTML = `
        <div class="result-card">
            <h2>${code} | 區間分析</h2>
            <p style="color: #666; margin-bottom: 1rem;">
                ${formatDate(start)} ~ ${formatDate(end)}
            </p>

            <!-- 區間統計摘要 -->
            <div class="stats-grid" style="margin-bottom: 1.5rem;">
                <div class="stat-item">
                    <label>資料筆數</label>
                    <value>${stats.count}</value>
                </div>
                <div class="stat-item">
                    <label>平均價格</label>
                    <value>${stats.avgPrice}</value>
                </div>
                <div class="stat-item high">
                    <label>最高價格</label>
                    <value>${stats.maxPrice}</value>
                </div>
                <div class="stat-item low">
                    <label>最低價格</label>
                    <value>${stats.minPrice}</value>
                </div>
                <div class="stat-item">
                    <label>區間漲跌</label>
                    <value class="${stats.priceChange >= 0 ? 'up' : 'down'}">
                        ${stats.priceChange}%
                    </value>
                </div>
                <div class="stat-item">
                    <label>總成交量</label>
                    <value>${formatVolume(stats.totalVolume)}</value>
                </div>
            </div>

            <!-- 詳細資料表格 -->
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
        </div>
    `;
}
