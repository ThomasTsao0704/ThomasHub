// static/js/render/compare.js
// 股票比較渲染 - 負責多檔股票比較的 HTML 生成

/**
 * 格式化價格
 * @param {number} value - 價格
 * @returns {string} 格式化後的價格
 */
function formatPrice(value) {
    return value === null || value === undefined ? '-' : Number(value).toFixed(2);
}

/**
 * 判斷表現等級
 * @param {Object} stock - 股票資料
 * @returns {string} CSS 類別名稱
 */
function getPerformanceClass(stock) {
    const ratio = stock.latest_price / stock.avg_price;
    if (ratio > 1.05) return 'high';
    if (ratio < 0.95) return 'low';
    return '';
}

/**
 * 計算表現描述
 * @param {Object} stock - 股票資料
 * @returns {string} 表現描述
 */
function getPerformanceLabel(stock) {
    const ratio = ((stock.latest_price - stock.avg_price) / stock.avg_price * 100).toFixed(2);
    if (ratio > 0) return `高於均價 ${ratio}%`;
    if (ratio < 0) return `低於均價 ${Math.abs(ratio)}%`;
    return '等於均價';
}

/**
 * 渲染股票比較卡片
 * @param {Object} data - 比較資料（包含 days 和 stocks 陣列）
 */
export function renderCompare(data) {
    const container = document.getElementById('compareResults');
    if (!container) return;

    if (!data || !data.stocks || data.stocks.length === 0) {
        container.innerHTML = '<p class="no-data">查無比較資料</p>';
        return;
    }

    // 計算最佳/最差表現
    const sortedByPerformance = [...data.stocks].sort((a, b) => {
        const ratioA = a.latest_price / a.avg_price;
        const ratioB = b.latest_price / b.avg_price;
        return ratioB - ratioA;
    });

    const bestPerformer = sortedByPerformance[0];
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];

    container.innerHTML = `
        <div class="result-card">
            <h2>股票比較分析（${data.days} 天）</h2>
            <p style="color: #666; margin-bottom: 1.5rem;">
                比較 ${data.stocks.length} 檔股票 | 
                最佳表現: <strong style="color: #e53935;">${bestPerformer.code}</strong> | 
                最弱表現: <strong style="color: #43a047;">${worstPerformer.code}</strong>
            </p>

            <div class="compare-grid">
                ${data.stocks.map(stock => {
                    const perfClass = getPerformanceClass(stock);
                    const perfLabel = getPerformanceLabel(stock);
                    const volatility = ((stock.max_price - stock.min_price) / stock.avg_price * 100).toFixed(2);

                    return `
                        <div class="compare-card">
                            <h3>${stock.code}</h3>
                            
                            <div class="compare-stats">
                                <div>
                                    <label>最新價格</label>
                                    <value class="${perfClass}">${formatPrice(stock.latest_price)}</value>
                                </div>
                                <div>
                                    <label>平均價格</label>
                                    <value>${formatPrice(stock.avg_price)}</value>
                                </div>
                                <div>
                                    <label>最高價格</label>
                                    <value class="high">${formatPrice(stock.max_price)}</value>
                                </div>
                                <div>
                                    <label>最低價格</label>
                                    <value class="low">${formatPrice(stock.min_price)}</value>
                                </div>
                                <div>
                                    <label>波動率</label>
                                    <value>${volatility}%</value>
                                </div>
                                <div>
                                    <label>資料筆數</label>
                                    <value>${stock.days_count}</value>
                                </div>
                            </div>

                            <div style="margin-top: 1rem; padding: 0.8rem; background: #f0f0f0; border-radius: 6px; text-align: center;">
                                <strong style="color: ${perfClass === 'high' ? '#e53935' : perfClass === 'low' ? '#43a047' : '#666'};">
                                    ${perfLabel}
                                </strong>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
