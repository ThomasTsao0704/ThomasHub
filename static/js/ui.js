// static/js/ui.js
// UI 輔助層 - 負責通用 UI 操作（載入、錯誤、通知）

import { CONFIG } from './config.js';

export const UI = {
    /**
     * 顯示載入狀態
     * @param {string} elementId - 元素 ID
     */
    loading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading">載入中</div>';
        }
    },

    /**
     * 顯示錯誤訊息
     * @param {string} elementId - 元素 ID
     * @param {string} message - 錯誤訊息
     */
    error(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<div class="error">❌ ${message}</div>`;
        }
    },

    /**
     * 清空元素內容
     * @param {string} elementId - 元素 ID
     */
    clear(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    },

    /**
     * 顯示通知訊息
     * @param {string} message - 通知內容
     * @param {string} type - 通知類型 (success, error, warning, info)
     */
    notify(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        // 觸發顯示動畫
        setTimeout(() => notification.classList.add('show'), 10);

        // 自動移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.NOTIFICATION_DURATION);
    },

    /**
     * 顯示成功通知
     * @param {string} message - 通知內容
     */
    success(message) {
        this.notify(message, 'success');
    },

    /**
     * 顯示錯誤通知
     * @param {string} message - 通知內容
     */
    showError(message) {
        this.notify(message, 'error');
    },

    /**
     * 顯示警告通知
     * @param {string} message - 通知內容
     */
    warning(message) {
        this.notify(message, 'warning');
    },

    /**
     * 顯示資訊通知
     * @param {string} message - 通知內容
     */
    info(message) {
        this.notify(message, 'info');
    },

    /**
     * 更新 API 狀態指示器
     * @param {boolean} connected - 是否連線
     */
    updateApiStatus(connected) {
        const statusEl = document.getElementById('apiStatus');
        if (statusEl) {
            statusEl.textContent = connected ? '✓ API 已連線' : '✗ API 未連線';
            statusEl.style.background = connected 
                ? 'rgba(76, 175, 80, 0.3)' 
                : 'rgba(244, 67, 54, 0.3)';
        }
    },

    /**
     * 取得輸入值（自動去空白）
     * @param {string} elementId - 輸入框 ID
     * @returns {string} 輸入值
     */
    getValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value.trim() : '';
    },

    /**
     * 設定輸入值
     * @param {string} elementId - 輸入框 ID
     * @param {string} value - 要設定的值
     */
    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    },

    /**
     * 驗證輸入（非空白）
     * @param {string} elementId - 輸入框 ID
     * @param {string} fieldName - 欄位名稱（用於錯誤訊息）
     * @returns {boolean} 是否有效
     */
    validateInput(elementId, fieldName = '此欄位') {
        const value = this.getValue(elementId);
        if (!value) {
            this.warning(`${fieldName}不可為空`);
            return false;
        }
        return true;
    }
};
