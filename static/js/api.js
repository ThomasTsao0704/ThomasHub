// static/js/api.js
// Local CSV data adapter. No backend required.

import { CONFIG } from './config.js';

const DEFAULT_CACHE_MINUTES = 5;
const CACHE_TTL_MS = Math.max(
    0,
    Number.isFinite(Number(CONFIG.CACHE_MINUTES))
        ? Number(CONFIG.CACHE_MINUTES)
        : DEFAULT_CACHE_MINUTES
) * 60 * 1000;

const cache = new Map();

function readCache(key) {
    if (!CACHE_TTL_MS) return null;
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}

function writeCache(key, value) {
    if (!CACHE_TTL_MS) return;
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function ensureTrailingSlash(base) {
    return base.endsWith('/') ? base : `${base}/`;
}

const DATA_BASE = new URL(
    ensureTrailingSlash(CONFIG.DATA_BASE || '../../data/'),
    import.meta.url
).toString();

function buildDataUrl(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return new URL(cleanPath, DATA_BASE).toString();
}

async function fetchText(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Data request failed: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

function parseCsv(text) {
    const normalized = text.trim();
    if (!normalized) return [];
    const lines = normalized.split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).filter(Boolean).map((line) => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] ?? '';
        });
        return row;
    });
}

function toNumber(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/,/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function toInt(value) {
    const num = toNumber(value);
    return Number.isFinite(num) ? Math.trunc(num) : null;
}

function toPercent(value) {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace('%', '').replace('+', '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function normalizeStockRow(row) {
    return {
        Date: toInt(row.Date),
        Name: row.Name ? row.Name.trim() : '',
        Open: toNumber(row.Open),
        High: toNumber(row.High),
        Low: toNumber(row.Low),
        Close: toNumber(row.Close),
        Volume: toInt(row.Volume)
    };
}

function normalizeDailyRow(row) {
    return {
        Date: toInt(row.Date),
        Code: row.Symbol ? row.Symbol.trim() : '',
        Name: row.Name ? row.Name.trim() : '',
        Open: toNumber(row.Open),
        High: toNumber(row.High),
        Low: toNumber(row.Low),
        Close: toNumber(row.Close),
        ChangePercent: toPercent(row.ChangePct ?? row.ChangePercent),
        Volume: toInt(row.Volume)
    };
}

function sortByDateDesc(rows) {
    return [...rows].sort((a, b) => Number(b.Date) - Number(a.Date));
}

function filterByDateRange(rows, start, end) {
    const startNum = Number(start);
    const endNum = Number(end);
    return rows.filter((row) => {
        const date = Number(row.Date);
        return Number.isFinite(date) && date >= startNum && date <= endNum;
    });
}

async function loadStockRows(code) {
    const cacheKey = `stock:${code}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const url = buildDataUrl(`stock/${code}.csv`);
    const text = await fetchText(url);
    const rows = parseCsv(text).map(normalizeStockRow);
    writeCache(cacheKey, rows);
    return rows;
}

async function loadDailyRows(date) {
    const cacheKey = `daily:${date}`;
    const cached = readCache(cacheKey);
    if (cached) return cached;

    const url = buildDataUrl(`daily/${date}.csv`);
    const text = await fetchText(url);
    const rows = parseCsv(text).map(normalizeDailyRow);
    writeCache(cacheKey, rows);
    return rows;
}

function calculateStats(code, rows) {
    if (!rows.length) {
        return {
            code,
            days_count: 0,
            latest_price: null,
            avg_price: null,
            max_price: null,
            min_price: null,
            latest_date: null
        };
    }

    const closes = rows.map((row) => row.Close).filter(Number.isFinite);
    const highs = rows.map((row) => row.High).filter(Number.isFinite);
    const lows = rows.map((row) => row.Low).filter(Number.isFinite);
    const latest = rows[0];

    const avgPrice = closes.length
        ? closes.reduce((sum, value) => sum + value, 0) / closes.length
        : null;
    const maxPrice = highs.length ? Math.max(...highs) : null;
    const minPrice = lows.length ? Math.min(...lows) : null;

    return {
        code,
        days_count: rows.length,
        latest_price: latest.Close,
        avg_price: avgPrice,
        max_price: maxPrice,
        min_price: minPrice,
        latest_date: latest.Date ? String(latest.Date) : null
    };
}

class StockAPI {
    async getStock(code, limit = CONFIG.DEFAULT_LIMIT) {
        const rows = await loadStockRows(code);
        const sorted = sortByDateDesc(rows);
        return sorted.slice(0, Number(limit) || CONFIG.DEFAULT_LIMIT);
    }

    async getLatest(code) {
        const rows = await loadStockRows(code);
        const sorted = sortByDateDesc(rows);
        if (!sorted.length) {
            throw new Error(`No stock data for ${code}`);
        }
        return sorted[0];
    }

    async getStats(code, days = CONFIG.DEFAULT_STATS_DAYS) {
        const rows = await loadStockRows(code);
        const sorted = sortByDateDesc(rows);
        const subset = sorted.slice(0, Number(days) || CONFIG.DEFAULT_STATS_DAYS);
        if (!subset.length) {
            throw new Error(`No stock data for ${code}`);
        }
        return calculateStats(code, subset);
    }

    async getRange(code, start, end) {
        const rows = await loadStockRows(code);
        const filtered = filterByDateRange(rows, start, end);
        return sortByDateDesc(filtered);
    }

    async compare(codes, days = CONFIG.DEFAULT_STATS_DAYS) {
        const codeList = Array.isArray(codes) ? codes : String(codes).split(',');
        const stocks = [];

        for (const code of codeList.map((value) => value.trim()).filter(Boolean)) {
            try {
                const rows = await loadStockRows(code);
                const subset = sortByDateDesc(rows).slice(0, Number(days) || CONFIG.DEFAULT_STATS_DAYS);
                if (!subset.length) continue;
                stocks.push(calculateStats(code, subset));
            } catch (error) {
                console.warn(`Skipping ${code}: ${error.message}`);
            }
        }

        return { days, stocks };
    }

    async getSummary(codes) {
        const codeList = Array.isArray(codes) ? codes : String(codes).split(',');
        const stocks = [];

        for (const code of codeList.map((value) => value.trim()).filter(Boolean)) {
            try {
                const rows = await loadStockRows(code);
                const sorted = sortByDateDesc(rows);
                if (!sorted.length) continue;
                stocks.push({
                    code,
                    latest_date: sorted[0].Date ? String(sorted[0].Date) : null,
                    latest_price: sorted[0].Close,
                    total_records: sorted.length
                });
            } catch (error) {
                console.warn(`Skipping ${code}: ${error.message}`);
            }
        }

        return { total_stocks: stocks.length, stocks };
    }

    async getDaily(date) {
        return loadDailyRows(date);
    }

    async getGainers(date, limit = 10) {
        const rows = await loadDailyRows(date);
        return rows
            .filter((row) => Number.isFinite(row.ChangePercent))
            .sort((a, b) => b.ChangePercent - a.ChangePercent)
            .slice(0, Number(limit) || 10);
    }

    async getLosers(date, limit = 10) {
        const rows = await loadDailyRows(date);
        return rows
            .filter((row) => Number.isFinite(row.ChangePercent))
            .sort((a, b) => a.ChangePercent - b.ChangePercent)
            .slice(0, Number(limit) || 10);
    }

    async health() {
        return { status: 'ok', source: 'local' };
    }
}

export const api = new StockAPI();
