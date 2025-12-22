// static/js/render/stats.js
// 統計資訊渲染 - 負責統計卡片的 HTML 生成

/**
 * 判斷趨勢類別
 * @param {number} latest - 最新價格
 * @param {number} avg - 平均價格
 * @returns {Object} 趨勢資訊 {trend: string, class: string}
 */
function analyzeTrend(latest, avg) {
    const diff = latest - avg;
    const percent = (diff / avg) * 100;

    if (percent > 2) {
        return { trend: '強勢上升', class: 'up' };
    } else if (percent > 0) {
        return { trend: '微幅上升', class: 'up' };
    } else if (percent < -2) {
        return { trend: '明顯下跌', class: 'down' };
    } else if (percent < 0) {
        return { trend: '微幅下跌', class: 'down' };
    } else {
        return { trend: '持平', class: 'flat' };
    }
}

/**
 * 渲染統計資訊卡片
 * @param {Object} stats - 統計資料
 */
export function renderStats(stats) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    // 計算趨勢
    const trendInfo = analyzeTrend(stats.latest_price, stats.avg_price);
    
    // 計算波動率
    const volatility = ((stats.max_price - stats.min_price) / stats.avg_price * 100).toFixed(2);

    container.innerHTML = `
        <div class="latest-card">
            <h2>${stats.code} | 統計資訊（${stats.days_count} 天）</h2>
            <div class="stats-grid">
                <div class="stat-item highlight">
                    <label>最新價格</label>
                    <value>${stats.latest_price.toFixed(2)}</value>
                </div>
                <div class="stat-item">
                    <label>平均價格</label>
                    <value>${stats.avg_price.toFixed(2)}</value>
                </div>
                <div class="stat-item high">
                    <label>最高價格</label>
                    <value>${stats.max_price.toFixed(2)}</value>
                </div>
                <div class="stat-item low">
                    <label>最低價格</label>
                    <value>${stats.min_price.toFixed(2)}</value>
                </div>
                <div class="stat-item">
                    <label>價格趨勢</label>
                    <value class="${trendInfo.class}">${trendInfo.trend}</value>
                </div>
                <div class="stat-item">
                    <label>波動率</label>
                    <value>${volatility}%</value>
                </div>
            </div>
        </div>
    `;
}
