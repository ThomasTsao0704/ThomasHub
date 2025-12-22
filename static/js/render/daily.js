// static/js/render/daily.js
// 每日行情渲染 - 負責每日市場行情的 HTML 生成

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
 * 格式化漲跌幅
 * @param {number} value - 漲跌幅百分比
 * @returns {string} 格式化後的漲跌幅
 */
function formatChangePercent(value) {
    if (value === null || value === undefined) return '-';
    const num = Number(value).toFixed(2);
    return num >= 0 ? `+${num}%` : `${num}%`;
}

/**
 * 計算市場統計
 * @param {Array} rows - 資料陣列
 * @returns {Object} 統計資訊
 */
function calculateMarketStats(rows) {
    if (!rows || rows.length === 0) return null;

    const changes = rows
        .map(r => r.ChangePercent)
        .filter(c => c !== null && c !== undefined);

    const up = changes.filter(c => c > 0).length;
    const down = changes.filter(c => c < 0).length;
    const flat = changes.filter(c => c === 0).length;

    return {
        total: rows.length,
        up,
        down,
        flat,
        upRatio: ((up / rows.length) * 100).toFixed(1),
        downRatio: ((down / rows.length) * 100).toFixed(1)
    };
}

/**
 * 取得漲跌幅排名
 * @param {Array} rows - 資料陣列
 * @param {boolean} topGainers - true 為漲幅榜，false 為跌幅榜
 * @param {number} limit - 限制筆數
 * @returns {Array} 排序後的資料
 */
function getRankedStocks(rows, topGainers = true, limit = 10) {
    const filtered = rows.filter(r => 
        r.ChangePercent !== null && r.ChangePercent !== undefined
    );

    return filtered
        .sort((a, b) => topGainers 
            ? b.ChangePercent - a.ChangePercent 
            : a.ChangePercent - b.ChangePercent
        )
        .slice(0, limit);
}

/**
 * 渲染每日行情表格
 * @param {Array} rows - 資料陣列
 * @param {string} date - 日期
 */
export function renderDailyTable(rows, date) {
    const container = document.getElementById('dailyResults');
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="no-data">查無當日行情資料</p>';
        return;
    }

    const stats = calculateMarketStats(rows);
    const gainers = getRankedStocks(rows, true, 10);
    const losers = getRankedStocks(rows, false, 10);

    container.innerHTML = `
        <div class="result-card">
            <h2>${formatDate(date)} | 市場行情</h2>

            <!-- 市場統計 -->
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-item">
                    <label>總股票數</label>
                    <value>${stats.total}</value>
                </div>
                <div class="stat-item high">
                    <label>上漲家數</label>
                    <value>${stats.up} (${stats.upRatio}%)</value>
                </div>
                <div class="stat-item low">
                    <label>下跌家數</label>
                    <value>${stats.down} (${stats.downRatio}%)</value>
                </div>
                <div class="stat-item">
                    <label>持平家數</label>
                    <value>${stats.flat}</value>
                </div>
            </div>

            <!-- 漲幅榜 -->
            <h3 style="margin-bottom: 1rem; color: #e53935;">📈 漲幅排行 TOP 10</h3>
            <div class="table-responsive" style="margin-bottom: 2rem;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>代碼</th>
                            <th>名稱</th>
                            <th>收盤價</th>
                            <th>漲跌幅</th>
                            <th>成交量</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gainers.map((row, index) => `
                            <tr>
                                <td><strong>${index + 1}</strong></td>
                                <td>${row.Code || '-'}</td>
                                <td>${row.Name || '-'}</td>
                                <td class="close">${formatPrice(row.Close)}</td>
                                <td class="up"><strong>${formatChangePercent(row.ChangePercent)}</strong></td>
                                <td>${formatVolume(row.Volume)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 跌幅榜 -->
            <h3 style="margin-bottom: 1rem; color: #43a047;">📉 跌幅排行 TOP 10</h3>
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>代碼</th>
                            <th>名稱</th>
                            <th>收盤價</th>
                            <th>漲跌幅</th>
                            <th>成交量</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${losers.map((row, index) => `
                            <tr>
                                <td><strong>${index + 1}</strong></td>
                                <td>${row.Code || '-'}</td>
                                <td>${row.Name || '-'}</td>
                                <td class="close">${formatPrice(row.Close)}</td>
                                <td class="down"><strong>${formatChangePercent(row.ChangePercent)}</strong></td>
                                <td>${formatVolume(row.Volume)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
