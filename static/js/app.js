// static/js/app.js
// =====================================================
// 主應用程式 - 處理 UI 互動和資料顯示
// =====================================================

import { CONFIG } from './config.js';
import { api } from './api.js';
import { UI } from './ui.js';

// ✅ 引入所有 render 模組
import { renderStockTable, renderLatestStock } from './render/stock.js';
import { renderStats } from './render/stats.js';
import { renderRangeTable } from './render/analysis.js';
import { renderCompare } from './render/compare.js';
import { renderDailyTable } from './render/daily.js';
import { initNotes } from './notes.js';

console.log('🔥 app.js loaded');
console.log('📍 API Base:', CONFIG.API_PREFIX);

/* =========================
   DOM 工具
========================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* =========================
   API 狀態
========================= */
async function checkApiStatus() {
    try {
        await api.health();
        UI.updateApiStatus(true);
        UI.info('API 連線成功');
    } catch {
        UI.updateApiStatus(false);
        UI.showError('API 無法連線');
    }
}

/* =========================
   View 切換
========================= */
function switchView(view) {
    ['stock', 'analysis', 'daily', 'compare', 'extra1', 'extra2'].forEach(v => {
        const section = $(`${v}View`);
        if (section) section.style.display = v === view ? 'block' : 'none';
    });

    $$('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
}

/* =========================
   功能：股票查詢
========================= */
async function loadStock() {
    const code = UI.getValue('stockCode');
    
    if (!UI.validateInput('stockCode', '股票代碼')) {
        return;
    }

    UI.clear('stockInfo');
    UI.clear('statsContainer');
    UI.clear('dataTable');

    try {
        UI.loading('stockInfo');
        UI.loading('statsContainer');
        UI.loading('dataTable');

        const latest = await api.getLatest(code);
        renderLatestStock(latest, code);

        const stats = await api.getStats(code, CONFIG.DEFAULT_STATS_DAYS);
        renderStats(stats);

        const history = await api.getStock(code, CONFIG.DEFAULT_LIMIT);
        renderStockTable(history, code);

        UI.success(`成功載入股票 ${code} 的資料`);
    } catch (e) {
        UI.error('stockInfo', e.message);
        UI.clear('statsContainer');
        UI.clear('dataTable');
        UI.showError(`查詢失敗: ${e.message}`);
    }
}

/* =========================
   功能：區間分析
========================= */
function normalizeDateInput(value) {
    if (!value) return value;
    return value.replaceAll('-', '');
}

async function runAnalysis() {
    const code = UI.getValue('analysisCode');
    const start = normalizeDateInput(UI.getValue('startDate'));
    const end = normalizeDateInput(UI.getValue('endDate'));

    if (!UI.validateInput('analysisCode', '股票代碼')) return;
    if (!UI.validateInput('startDate', '起始日期')) return;
    if (!UI.validateInput('endDate', '結束日期')) return;

    UI.loading('analysisResults');

    try {
        const data = await api.getRange(code, start, end);
        renderRangeTable(data, code, start, end);
        UI.success(`成功分析股票 ${code} 的區間資料`);
    } catch (e) {
        UI.error('analysisResults', e.message);
        UI.showError(`分析失敗: ${e.message}`);
    }
}

/* =========================
   功能：每日行情
========================= */
async function loadDaily() {
    const date = normalizeDateInput(UI.getValue('dailyDate'));

    if (!UI.validateInput('dailyDate', '日期')) return;

    UI.loading('dailyResults');

    try {
        const data = await api.getDaily(date);
        renderDailyTable(data, date);
        UI.success(`成功載入 ${date} 的市場行情`);
    } catch (e) {
        UI.error('dailyResults', e.message);
        UI.showError(`載入失敗: ${e.message}`);
    }
}

/* =========================
   功能：股票比較
========================= */
async function compareStocks() {
    const codes = UI.getValue('compareCodes');

    if (!UI.validateInput('compareCodes', '股票代碼')) return;

    UI.loading('compareResults');

    try {
        const data = await api.compare(codes, CONFIG.DEFAULT_STATS_DAYS);
        renderCompare(data);
        UI.success('成功比較股票資料');
    } catch (e) {
        UI.error('compareResults', e.message);
        UI.showError(`比較失敗: ${e.message}`);
    }
}

/* =========================
   啟動
========================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ App initialized');
    console.log('📍 API Base:', CONFIG.API_PREFIX);
    
    checkApiStatus();

    $$('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
            UI.info(`切換到 ${btn.textContent}`);
        });
    });

    $('btnLoadStock')?.addEventListener('click', loadStock);
    $('btnRange')?.addEventListener('click', runAnalysis);
    $('btnDaily')?.addEventListener('click', loadDaily);
    $('btnCompare')?.addEventListener('click', compareStocks);

    $('stockCode')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadStock();
    });
    
    $('analysisCode')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && $('startDate').value && $('endDate').value) {
            runAnalysis();
        }
    });
    
    $('dailyDate')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadDaily();
    });
    
    $('compareCodes')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') compareStocks();
    });

    initNotes();
    switchView('stock');
});
