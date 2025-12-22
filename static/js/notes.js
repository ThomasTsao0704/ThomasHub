// static/js/notes.js

import { CONFIG } from './config.js';
import { UI } from './ui.js';

const NOTES_HEADERS = [
    '日期',
    '股票代號',
    '股票名稱',
    '分析內容',
    '預判',
    '目標價',
    '停損價',
    '信心度',
    '策略標籤',
    '市場情緒',
    '備註',
    '參考指標',
    'result',
    'review_note'
];

const HEADER_MAP = {
    '日期': 'date',
    'Date': 'date',
    '股票代號': 'code',
    'StockCode': 'code',
    '代號': 'code',
    '股票名稱': 'name',
    'StockName': 'name',
    '分析內容': 'analysis',
    'Analysis': 'analysis',
    '預判': 'prediction',
    'Prediction': 'prediction',
    '目標價': 'target',
    'TargetPrice': 'target',
    '停損價': 'stop',
    'StopLoss': 'stop',
    '信心度': 'confidence',
    'Confidence': 'confidence',
    '策略標籤': 'tags',
    'Tags': 'tags',
    '市場情緒': 'mood',
    'MarketMood': 'mood',
    '備註': 'notes',
    'Notes': 'notes',
    '參考指標': 'reference',
    'Reference': 'reference',
    'result': 'result',
    'Result': 'result',
    '結果': 'result',
    'review_note': 'review_note',
    'ReviewNote': 'review_note',
    '回測備註': 'review_note'
};

const STORAGE_KEY = 'notes.local.records.v1';

let baseRecords = [];
let localRecords = [];
let loaded = false;

function buildNotesUrl() {
    const base = (CONFIG.DATA_BASE || '/data').replace(/\/+$/, '');
    return new URL(`${base}/notes.csv`, import.meta.url).toString();
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalized.length; i += 1) {
        const char = normalized[i];

        if (inQuotes) {
            if (char === '"') {
                if (normalized[i + 1] === '"') {
                    value += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                value += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            continue;
        }

        if (char === ',') {
            row.push(value);
            value = '';
            continue;
        }

        if (char === '\n') {
            row.push(value);
            rows.push(row);
            row = [];
            value = '';
            continue;
        }

        value += char;
    }

    if (value.length > 0 || row.length > 0) {
        row.push(value);
        rows.push(row);
    }

    return rows;
}

function toNumber(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/,/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function splitTags(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value)
        .split(/[,;|\u3001]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function toDateValue(value) {
    if (!value) return 0;
    const str = String(value).trim();

    if (/^\d{8}$/.test(str)) {
        return Date.UTC(Number(str.slice(0, 4)), Number(str.slice(4, 6)) - 1, Number(str.slice(6, 8)));
    }

    if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(str)) {
        const normalized = str.replace(/\//g, '-');
        const parsed = Date.parse(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Date.parse(str);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRecord(raw, source = 'csv') {
    return {
        date: raw.date ? String(raw.date).trim() : '',
        code: raw.code ? String(raw.code).trim().toUpperCase() : '',
        name: raw.name ? String(raw.name).trim() : '',
        analysis: raw.analysis ? String(raw.analysis).trim() : '',
        prediction: raw.prediction ? String(raw.prediction).trim() : '',
        target: toNumber(raw.target),
        stop: toNumber(raw.stop),
        confidence: toNumber(raw.confidence),
        tags: splitTags(raw.tags),
        mood: raw.mood ? String(raw.mood).trim() : '',
        notes: raw.notes ? String(raw.notes).trim() : '',
        reference: raw.reference ? String(raw.reference).trim() : '',
        result: raw.result ? String(raw.result).trim() : '',
        review_note: raw.review_note ? String(raw.review_note).trim() : '',
        source,
        createdAt: raw.createdAt || ''
    };
}

function parseNotesCsv(text) {
    const rows = parseCsv(text);
    if (!rows.length) return [];

    const headers = rows[0].map((header) =>
        String(header || '').replace(/^\uFEFF/, '').trim()
    );
    const keys = headers.map((header) => HEADER_MAP[header] || null);

    return rows
        .slice(1)
        .filter((row) => row.some((cell) => String(cell || '').trim().length > 0))
        .map((row) => {
            const raw = {};
            keys.forEach((key, idx) => {
                if (!key) return;
                raw[key] = row[idx] ?? '';
            });
            return normalizeRecord(raw, 'csv');
        });
}

function loadLocalRecords() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((record) => normalizeRecord(record, 'local'));
    } catch {
        return [];
    }
}

function saveLocalRecords() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localRecords));
    } catch {
        // ignore storage errors
    }
}

function getAllRecords() {
    return [...baseRecords, ...localRecords];
}

function getToday() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getPreMarketRecords(minConfidence = 6) {
    const today = getToday();
    return getAllRecords().filter(r =>
        r.date === today &&
        Number(r.confidence) >= minConfidence &&
        !r.result
    );
}

function calculateConfidenceBias(records) {
    const map = {};
    records.forEach(r => {
        if (!r.result || !Number.isFinite(r.confidence)) return;
        const key = r.confidence;
        map[key] ||= { total: 0, success: 0 };
        map[key].total++;
        if (r.result === 'success') map[key].success++;
    });

    return Object.entries(map).map(([c, v]) => ({
        confidence: c,
        winRate: (v.success / v.total * 100).toFixed(1)
    }));
}

function calculateConfidenceCalibration(records) {
    const map = {};

    records.forEach(r => {
        if (!r.result || !Number.isFinite(r.confidence)) return;
        const c = r.confidence;
        map[c] ||= { total: 0, win: 0 };
        map[c].total++;
        if (r.result === 'success') map[c].win++;
    });

    return Object.entries(map)
        .map(([c, v]) => ({
            confidence: Number(c),
            total: v.total,
            winRate: (v.win / v.total * 100).toFixed(1)
        }))
        .sort((a, b) => b.confidence - a.confidence);
}

function remindUnreviewed() {
    const today = getToday();
    const pending = getAllRecords().filter(r =>
        r.date < today && !r.result
    );

    if (pending.length > 0) {
        UI.warning(`⚠️ 有 ${pending.length} 筆過去預判尚未回填結果`);
    }
}

function renderConfidenceCalibration() {
    const el = document.getElementById('confidenceCalibration');
    if (!el) return;

    const stats = calculateConfidenceCalibration(getAllRecords());
    if (!stats.length) {
        el.innerHTML = '<p class="no-data">尚無足夠回測資料</p>';
        return;
    }

    el.innerHTML = `
        <div class="latest-card">
            <h2>📐 信心度校正表</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>信心度</th>
                        <th>樣本數</th>
                        <th>勝率</th>
                        <th>解讀</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.map(s => `
                        <tr>
                            <td>${s.confidence}</td>
                            <td>${s.total}</td>
                            <td><strong>${s.winRate}%</strong></td>
                            <td>
                                ${s.winRate < 50 ? '⚠️ 高估' :
                                  s.winRate > 65 ? '✅ 穩定' : '⚖️ 中性'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(value, max = 40) {
    const text = value ? String(value) : '';
    if (text.length <= max) return text;
    return `${text.slice(0, max)}...`;
}

function renderSummary(containerId, records) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!records.length) {
        container.innerHTML = '<p class="no-data">尚無紀錄</p>';
        return;
    }

    const uniqueStocks = new Set(records.map((record) => record.code).filter(Boolean)).size;
    const confidences = records
        .map((record) => record.confidence)
        .filter((value) => Number.isFinite(value));
    const avgConfidence = confidences.length
        ? (confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(1)
        : '--';

    const tagCounts = new Map();
    const moodCounts = new Map();

    records.forEach((record) => {
        record.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
        if (record.mood) {
            moodCounts.set(record.mood, (moodCounts.get(record.mood) || 0) + 1);
        }
    });

    const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '--';
    const topMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '--';

    // Calculate confidence calibration
    const biasData = calculateConfidenceBias(records);
    const confidenceCalibration = biasData.length > 0
        ? `
            <div class="latest-card" style="margin-top: 20px;">
                <h2>📊 信心度校正（Confidence Calibration）</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>信心度</th>
                            <th>實際勝率</th>
                            <th>校正建議</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${biasData.sort((a, b) => Number(b.confidence) - Number(a.confidence)).map(item => {
                            const conf = Number(item.confidence);
                            const winRate = Number(item.winRate);
                            let suggestion = '';
                            if (winRate < conf * 10 - 20) {
                                suggestion = '⚠️ 過度自信';
                            } else if (winRate > conf * 10 + 20) {
                                suggestion = '✅ 低估能力';
                            } else {
                                suggestion = '✓ 校正良好';
                            }
                            return `
                                <tr>
                                    <td>${item.confidence}</td>
                                    <td><strong>${item.winRate}%</strong></td>
                                    <td>${suggestion}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `
        : '<div class="latest-card" style="margin-top: 20px;"><h2>📊 信心度校正</h2><p style="color:#666;">尚無足夠回測資料</p></div>';

    container.innerHTML = `
        <div class="latest-card">
            <h2>紀錄統計</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <label>記錄總數</label>
                    <value>${records.length}</value>
                </div>
                <div class="stat-item">
                    <label>股票數</label>
                    <value>${uniqueStocks}</value>
                </div>
                <div class="stat-item">
                    <label>平均信心度</label>
                    <value>${avgConfidence}</value>
                </div>
                <div class="stat-item">
                    <label>熱門標籤</label>
                    <value>${escapeHtml(topTag)}</value>
                </div>
                <div class="stat-item">
                    <label>常見情緒</label>
                    <value>${escapeHtml(topMood)}</value>
                </div>
            </div>
        </div>
        ${confidenceCalibration}
    `;
}

function renderTable(containerId, records) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!records.length) {
        container.innerHTML = '<p class="no-data">尚無紀錄</p>';
        return;
    }

    const rows = records.map((record, index) => {
        const tagText = record.tags.join(', ');
        const analysisText = record.analysis || '';
        const notesText = record.notes || '';
        const referenceText = record.reference || '';
        const reviewNoteText = record.review_note || '';

        return `
            <tr>
                <td>${escapeHtml(record.date || '-')}</td>
                <td>${escapeHtml(record.code || '-')}</td>
                <td>${escapeHtml(record.name || '-')}</td>
                <td title="${escapeHtml(analysisText)}">${escapeHtml(truncate(analysisText)) || '-'}</td>
                <td title="${escapeHtml(record.prediction || '')}">${escapeHtml(truncate(record.prediction)) || '-'}</td>
                <td>${Number.isFinite(record.target) ? record.target : '-'}</td>
                <td>${Number.isFinite(record.stop) ? record.stop : '-'}</td>
                <td>${Number.isFinite(record.confidence) ? record.confidence : '-'}</td>
                <td title="${escapeHtml(tagText)}">${escapeHtml(truncate(tagText)) || '-'}</td>
                <td>${escapeHtml(record.mood || '-')}</td>
                <td title="${escapeHtml(notesText)}">${escapeHtml(truncate(notesText)) || '-'}</td>
                <td title="${escapeHtml(referenceText)}">${escapeHtml(truncate(referenceText)) || '-'}</td>
                <td>
                    <select data-index="${index}" data-field="result" class="result-select" ${record.source === 'csv' ? 'disabled' : ''}>
                        <option value="" ${!record.result ? 'selected' : ''}>未評估</option>
                        <option value="success" ${record.result === 'success' ? 'selected' : ''}>成功</option>
                        <option value="fail" ${record.result === 'fail' ? 'selected' : ''}>失敗</option>
                    </select>
                </td>
                <td title="${escapeHtml(reviewNoteText)}">${escapeHtml(truncate(reviewNoteText)) || '-'}</td>
                <td>${record.source === 'local' ? '本機' : 'CSV'}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="table-header">
            <h2>紀錄清單</h2>
            <span class="record-count">${records.length} 筆</span>
        </div>
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>代號</th>
                        <th>名稱</th>
                        <th>分析內容</th>
                        <th>預判</th>
                        <th>目標價</th>
                        <th>停損價</th>
                        <th>信心度</th>
                        <th>策略標籤</th>
                        <th>市場情緒</th>
                        <th>備註</th>
                        <th>參考指標</th>
                        <th>結果標記</th>
                        <th>回測備註</th>
                        <th>來源</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

    // Add event listeners for result selects (only for local records)
    container.querySelectorAll('.result-select').forEach(select => {
        select.addEventListener('change', handleResultChange);
    });
}

function updateFilterOptions(records) {
    const stockSelect = document.getElementById('notesFilterCode');
    const tagSelect = document.getElementById('notesFilterTag');
    const moodSelect = document.getElementById('notesFilterMood');

    if (!stockSelect || !tagSelect || !moodSelect) return;

    const currentStock = stockSelect.value;
    const currentTag = tagSelect.value;
    const currentMood = moodSelect.value;

    const stocks = [...new Set(records.map((record) => record.code).filter(Boolean))].sort();
    const tags = [...new Set(records.flatMap((record) => record.tags))].sort();
    const moods = [...new Set(records.map((record) => record.mood).filter(Boolean))].sort();

    stockSelect.innerHTML = '<option value="">全部</option>' +
        stocks.map((code) => `<option value="${escapeHtml(code)}">${escapeHtml(code)}</option>`).join('');
    tagSelect.innerHTML = '<option value="">全部</option>' +
        tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('');
    moodSelect.innerHTML = '<option value="">全部</option>' +
        moods.map((mood) => `<option value="${escapeHtml(mood)}">${escapeHtml(mood)}</option>`).join('');

    if (stocks.includes(currentStock)) stockSelect.value = currentStock;
    if (tags.includes(currentTag)) tagSelect.value = currentTag;
    if (moods.includes(currentMood)) moodSelect.value = currentMood;
}

function applyFilters(records) {
    const stock = document.getElementById('notesFilterCode')?.value || '';
    const tag = document.getElementById('notesFilterTag')?.value || '';
    const mood = document.getElementById('notesFilterMood')?.value || '';
    const minConfidence = Number(document.getElementById('notesFilterConfidence')?.value || 1);

    return records.filter((record) => {
        if (stock && record.code !== stock) return false;
        if (tag && !record.tags.includes(tag)) return false;
        if (mood && record.mood !== mood) return false;
        if (Number.isFinite(minConfidence)) {
            const confidence = Number.isFinite(record.confidence) ? record.confidence : 0;
            if (confidence < minConfidence) return false;
        }
        return true;
    });
}

function renderAll() {
    const records = getAllRecords().sort((a, b) => toDateValue(b.date) - toDateValue(a.date));
    renderSummary('notesAddSummary', records);
    renderSummary('notesBrowseSummary', records);
    renderTable('notesAddTable', records.slice(0, 50));

    updateFilterOptions(records);
    const filtered = applyFilters(records);
    renderTable('notesBrowseTable', filtered);
    renderConfidenceCalibration();
}

async function loadNotes(force = false) {
    if (loaded && !force) {
        renderAll();
        remindUnreviewed();
        return;
    }

    UI.loading('notesAddSummary');
    UI.loading('notesBrowseSummary');
    UI.loading('notesAddTable');
    UI.loading('notesBrowseTable');

    try {
        const response = await fetch(buildNotesUrl(), { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`notes.csv 讀取失敗 (${response.status})`);
        }
        const text = await response.text();
        baseRecords = parseNotesCsv(text);
        loaded = true;
        renderAll();
        remindUnreviewed();
    } catch (error) {
        UI.error('notesAddSummary', error.message);
        UI.error('notesBrowseSummary', error.message);
        UI.clear('notesAddTable');
        UI.clear('notesBrowseTable');
    }
}

function exportNotesCsv() {
    const records = getAllRecords().sort((a, b) => toDateValue(b.date) - toDateValue(a.date));
    const lines = [NOTES_HEADERS.join(',')];

    records.forEach((record) => {
        const values = [
            record.date,
            record.code,
            record.name,
            record.analysis,
            record.prediction,
            record.target ?? '',
            record.stop ?? '',
            record.confidence ?? '',
            record.tags.join(';'),
            record.mood,
            record.notes,
            record.reference,
            record.result ?? '',
            record.review_note ?? ''
        ];
        lines.push(values.map(csvEscape).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function handleAddRecord(event) {
    event.preventDefault();

    const date = UI.getValue('notesDate');
    const code = UI.getValue('notesCode');
    const analysis = UI.getValue('notesAnalysis');

    if (!date) {
        UI.warning('請輸入日期');
        return;
    }
    if (!code) {
        UI.warning('請輸入股票代號');
        return;
    }
    if (!analysis) {
        UI.warning('請輸入分析內容');
        return;
    }

    const record = normalizeRecord({
        date,
        code,
        name: UI.getValue('notesName'),
        analysis,
        prediction: UI.getValue('notesPrediction'),
        target: UI.getValue('notesTarget'),
        stop: UI.getValue('notesStop'),
        confidence: UI.getValue('notesConfidence'),
        tags: UI.getValue('notesTags'),
        mood: UI.getValue('notesMood'),
        notes: UI.getValue('notesNotes'),
        reference: UI.getValue('notesReference'),
        createdAt: new Date().toISOString()
    }, 'local');

    localRecords = [record, ...localRecords];
    saveLocalRecords();
    renderAll();

    const form = document.getElementById('notesAddForm');
    form?.reset();
    const confidenceInput = document.getElementById('notesConfidence');
    if (confidenceInput) confidenceInput.value = '5';
    applyTodayDefault();

    UI.success('已新增到本機清單，請下載 notes.csv 更新檔案');
}

function handleResultChange(event) {
    const select = event.target;
    const index = Number(select.dataset.index);
    const newResult = select.value;

    const allRecords = getAllRecords().sort((a, b) => toDateValue(b.date) - toDateValue(a.date));
    const record = allRecords[index];

    if (!record || record.source !== 'local') return;

    // Update the record in localRecords
    const localIndex = localRecords.findIndex(r =>
        r.date === record.date &&
        r.code === record.code &&
        r.createdAt === record.createdAt
    );

    if (localIndex !== -1) {
        localRecords[localIndex].result = newResult;
        saveLocalRecords();
        UI.success(`已更新 ${record.code} 的結果標記為: ${newResult || '未評估'}`);
    }
}

function applyTodayDefault() {
    const dateInput = document.getElementById('notesDate');
    if (dateInput && !dateInput.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

function renderPreMarketBrief() {
    const el = document.getElementById('preMarketBrief');
    if (!el) return;

    const records = getPreMarketRecords();

    if (!records.length) {
        el.innerHTML = `
            <div class="latest-card">
                <h2>🧠 盤前決策摘要</h2>
                <p style="color:#666;">今天沒有尚未驗證的高信心預判</p>
            </div>
        `;
        return;
    }

    el.innerHTML = `
        <div class="latest-card">
            <h2>🧠 盤前決策摘要（${records.length} 檔）</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>股票</th>
                        <th>預判</th>
                        <th>信心</th>
                        <th>目標</th>
                        <th>停損</th>
                        <th>狀態</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td><strong>${r.code}</strong></td>
                            <td>${r.prediction || '-'}</td>
                            <td>${r.confidence}</td>
                            <td>${r.target ?? '-'}</td>
                            <td>${r.stop ?? '-'}</td>
                            <td>⚠️ 尚未驗證</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

export function initNotes() {
    const addForm = document.getElementById('notesAddForm');
    if (!addForm) return;

    localRecords = loadLocalRecords();
    applyTodayDefault();

    addForm.addEventListener('submit', handleAddRecord);
    document.getElementById('btnNotesExport')?.addEventListener('click', exportNotesCsv);
    document.getElementById('btnNotesReload')?.addEventListener('click', () => loadNotes(true));
    document.getElementById('btnNotesExportBrowse')?.addEventListener('click', exportNotesCsv);
    document.getElementById('btnNotesReloadBrowse')?.addEventListener('click', () => loadNotes(true));

    ['notesFilterCode', 'notesFilterTag', 'notesFilterMood', 'notesFilterConfidence'].forEach((id) => {
        document.getElementById(id)?.addEventListener('change', renderAll);
    });

    loadNotes(false);
    renderPreMarketBrief();
    renderConfidenceCalibration();
}
