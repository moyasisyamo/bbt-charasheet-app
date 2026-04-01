/**
 * lobby.js
 * キャラクター一覧ページのロジック。
 * ソート・フィルター・ポップアップ・Firebase読み込みを管理する。
 */

let allChars = [];
let filteredChars = [];
let sortField = 'updatedAt';
let sortDir   = 'desc';
let activeFilters = {}; // { type: 'style'|'player'|'blood'|'root', value: '...' }[]
let isDeleteMode = false;
let activeTab = 'registered';

const STYLE_ABBR  = { 'アタッカー':'ATK', 'ディフェンダー':'DEF', 'サポーター':'SUP' };
const STYLE_CLASS = { 'ATK':'style-atk', 'DEF':'style-def', 'SUP':'style-sup' };

document.addEventListener('DOMContentLoaded', async () => {
    // テーマ
    const themeBtn = document.getElementById('theme-toggle-fixed');
    const html     = document.documentElement;
    const saved    = localStorage.getItem('bbt-theme') || 'dark';
    html.setAttribute('data-theme', saved);
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('bbt-theme', next);
        });
    }

    // 統計ページ
    document.getElementById('stats-page-btn').addEventListener('click', () => {
        window.location.href = 'stats.html';
    });

    // 新規キャラクター
    document.getElementById('new-char-btn').addEventListener('click', () => {
        window.location.href = 'sheet.html';
    });

    // 削除モード
    const delBtn = document.getElementById('delete-mode-btn');
    if (delBtn) {
        delBtn.addEventListener('click', () => {
            isDeleteMode = !isDeleteMode;
            document.body.classList.toggle('delete-mode-active', isDeleteMode);
            delBtn.classList.toggle('warning', !isDeleteMode);
            delBtn.classList.toggle('primary', isDeleteMode);
            delBtn.textContent = isDeleteMode ? '⚠ 削除モード中 (クリックで解除)' : '🗑 削除モード切替';
        });
    }

    // タブ切り替えイベント
    const tabReg = document.getElementById('tab-registered');
    const tabTemp = document.getElementById('tab-temporary');
    if (tabReg && tabTemp) {
        tabReg.addEventListener('click', () => {
            activeTab = 'registered';
            tabReg.classList.add('active');
            tabTemp.classList.remove('active');
            applyFiltersAndSort();
        });
        tabTemp.addEventListener('click', () => {
            activeTab = 'temporary';
            tabTemp.classList.add('active');
            tabReg.classList.remove('active');
            applyFiltersAndSort();
        });
    }

    // Firebase 初期化
    const fbReady = window.bbFirebase.init();
    if (!fbReady) {
        document.getElementById('firebase-setup-panel').style.display = 'block';
        showEmptyState('Firebase が設定されていません。上の手順に従って設定してください。', true);
        return;
    }

    // キャラクター読み込み
    await loadCharacters();
    setupSort();
    setupSearch();
    setupRootsPopup();
    setupPlayerPopup();

    document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);
});

// ---- データ読み込み ----
async function loadCharacters() {
    try {
        allChars = await window.bbFirebase.loadAll();
        updateTabCounts();
        applyFiltersAndSort();
    } catch (e) {
        showEmptyState('読み込みエラー: ' + e.message, true);
    }
}

function updateTabCounts() {
    const regCount = allChars.filter(c => !c.isTemp).length;
    const tempCount = allChars.filter(c => c.isTemp).length;
    const regEl = document.getElementById('count-registered');
    const tempEl = document.getElementById('count-temporary');
    if (regEl) regEl.textContent = regCount;
    if (tempEl) tempEl.textContent = tempCount;
}

// ---- テーブル描画 ----
function applyFiltersAndSort() {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase();

    filteredChars = allChars.filter(c => {
        // タブフィルタ
        const charIsTemp = !!c.isTemp;
        if (activeTab === 'registered' && charIsTemp) return false;
        if (activeTab === 'temporary'  && !charIsTemp) return false;

        // テキスト検索
        if (query) {
            const hay = `${c.name||''} ${c.playerName||''}`.toLowerCase();
            if (!hay.includes(query)) return false;
        }
        // アクティブフィルター
        for (const f of Object.values(activeFilters)) {
            if (f.type === 'style'  && c.style       !== f.value) return false;
            if (f.type === 'player' && c.playerName  !== f.value) return false;
            if (f.type === 'blood') {
                const bloods = [c.primaryBlood, c.secondaryBlood, c.tertiaryBlood].filter(Boolean);
                if (!bloods.includes(f.value)) return false;
            }
            if (f.type === 'root') {
                const roots = [c.primaryRoot, c.secondaryRoot, c.tertiaryRoot].filter(Boolean);
                if (!roots.includes(f.value)) return false;
            }
        }
        return true;
    });

    // ソート
    filteredChars.sort((a, b) => {
        let va = a[sortField], vb = b[sortField];
        if (sortField === 'updatedAt') {
            va = va?.toMillis ? va.toMillis() : (va?.seconds || 0) * 1000;
            vb = vb?.toMillis ? vb.toMillis() : (vb?.seconds || 0) * 1000;
        }
        va = va ?? '';
        vb = vb ?? '';
        if (va < vb) return sortDir === 'asc' ? -1 :  1;
        if (va > vb) return sortDir === 'asc' ?  1 : -1;
        return 0;
    });

    renderTable();
    renderActiveFilters();
}

function renderTable() {
    const tbody = document.getElementById('char-list-body');
    tbody.innerHTML = '';
    if (filteredChars.length === 0) {
        if (activeTab === 'temporary') {
            showEmptyState('仮登録中のキャラクターはありません。');
        } else {
            showEmptyState(allChars.filter(c => !c.isTemp).length === 0 ? 'キャラクターがまだいません。「新規作成」から登録しましょう！' : 'フィルター条件に一致するキャラクターがいません。');
        }
        return;
    }
    filteredChars.forEach(c => tbody.appendChild(buildRow(c)));
}

function buildRow(c) {
    const abbr  = STYLE_ABBR[c.style]  || c.style || '-';
    const cls   = STYLE_CLASS[abbr]    || '';
    const date  = formatDate(c.updatedAt);

    // 顔アイコン
    const iconHTML = c.faceIcon
        ? `<img src="${c.faceIcon}" class="face-icon-circle" alt="顔アイコン">`
        : `<div class="face-icon-placeholder">👤</div>`;

    // ブラッド/ルーツ HTML
    const pairs = [
        { b: c.primaryBlood,   r: c.primaryRoot },
        { b: c.secondaryBlood, r: c.secondaryRoot },
        { b: c.tertiaryBlood,  r: c.tertiaryRoot },
    ].filter(p => p.b || p.r);

    const rootsHTML = pairs.map(p => `
        <div class="root-pair">
            <span class="blood-link" data-blood="${escHtml(p.b||'')}">${escHtml(p.b||'-')}</span>
            <span class="root-sep">/</span>
            <span class="root-link"  data-root="${escHtml(p.r||'')}">${escHtml(p.r||'-')}</span>
        </div>`).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
            <div class="name-cell" data-id="${c.id}">
                ${iconHTML}
                <span class="char-name-text">${escHtml(c.name || '名無し')}</span>
            </div>
        </td>
        <td><span class="style-badge ${cls}" data-style="${escHtml(c.style||'')}">${abbr}</span></td>
        <td class="roots-cell">${rootsHTML}</td>
        <td class="xp-cell">${c.xpUsed ?? '-'}</td>
        <td><span class="filter-link" data-player="${escHtml(c.playerName||'')}">${escHtml(c.playerName||'-')}</span></td>
        <td style="font-size:0.82rem;color:var(--text-muted);">${date}</td>
    `;

    // イベントバインド
    tr.querySelector('.name-cell').addEventListener('click', async () => {
        if (isDeleteMode) {
            const pass = prompt(`「${c.name || '名無し'}」を削除しますか？\n実行するにはこのキャラクターの編集パスワード、または管理者パスワードを入力してください:`);
            if (pass !== null) {
                const charPass = (c.sheetData && c.sheetData.password) || c.password || ''; 
                const adminPass = typeof ADMIN_PASSWORD !== 'undefined' ? ADMIN_PASSWORD : null;
                
                if (pass === charPass || (adminPass && pass === adminPass)) {
                    if (confirm(`本当に「${c.name || '名無し'}」を削除しますか？\nこの操作は取り消せません。`)) {
                        try {
                            await window.bbFirebase.delete(c.id);
                            alert('削除しました。');
                            loadCharacters();
                        } catch (e) {
                            alert('削除に失敗しました: ' + e.message);
                        }
                    }
                } else {
                    alert('パスワードが違います。');
                }
            }
        } else {
            if (activeTab === 'temporary') {
                window.location.href = `sheet.html?id=${c.id}&edit=true`;
            } else {
                window.location.href = `sheet.html?id=${c.id}`;
            }
        }
    });
    tr.querySelectorAll('.style-badge[data-style]').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); addFilter('style', el.dataset.style); });
    });
    tr.querySelectorAll('.filter-link[data-player]').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); addFilter('player', el.dataset.player); });
    });
    tr.querySelectorAll('.blood-link[data-blood]').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); addFilter('blood', el.dataset.blood); });
    });
    tr.querySelectorAll('.root-link[data-root]').forEach(el => {
        el.addEventListener('click', e => { e.stopPropagation(); addFilter('root', el.dataset.root); });
    });

    return tr;
}

function showEmptyState(msg, isError = false) {
    document.getElementById('char-list-body').innerHTML = `
        <tr><td colspan="6">
            <div class="${isError ? 'error-state' : 'empty-state'}">
                <div class="empty-icon">${isError ? '⚠' : '📋'}</div>
                <div>${escHtml(msg)}</div>
            </div>
        </td></tr>`;
}

// ---- ソート ----
function setupSort() {
    document.querySelectorAll('#char-list-table th.sortable[data-field]').forEach(th => {
        th.addEventListener('click', () => {
            const f = th.dataset.field;
            if (sortField === f) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
            else { sortField = f; sortDir = 'asc'; }
            // ヘッダーのクラス更新
            document.querySelectorAll('#char-list-table th').forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
            applyFiltersAndSort();
        });
    });
}

// ---- 検索 ----
function setupSearch() {
    document.getElementById('search-input').addEventListener('input', applyFiltersAndSort);
}

// ---- フィルター ----
function addFilter(type, value) {
    if (!value || value === '-') return;
    activeFilters[`${type}:${value}`] = { type, value };
    document.getElementById('clear-filters-btn').style.display = '';
    applyFiltersAndSort();
}

function clearAllFilters() {
    activeFilters = {};
    document.getElementById('search-input').value = '';
    document.getElementById('clear-filters-btn').style.display = 'none';
    applyFiltersAndSort();
}

function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    container.innerHTML = '';
    const labels = { style:'スタイル', player:'PL', blood:'ブラッド', root:'ルーツ' };
    Object.entries(activeFilters).forEach(([key, f]) => {
        const tag = document.createElement('span');
        tag.className = 'active-filter-tag';
        tag.textContent = `${labels[f.type] || f.type}: ${f.value} ✕`;
        tag.addEventListener('click', () => { delete activeFilters[key]; renderActiveFilters(); applyFiltersAndSort(); });
        container.appendChild(tag);
    });
    document.getElementById('clear-filters-btn').style.display = Object.keys(activeFilters).length ? '' : 'none';
}

// ---- ルーツポップアップ ----
function setupRootsPopup() {
    const popup   = document.getElementById('roots-popup');
    const listEl  = document.getElementById('roots-list');
    const searchEl= document.getElementById('roots-search');

    document.getElementById('th-roots').addEventListener('click', () => {
        // 全キャラのブラッド/ルーツを収集
        const bloodSet = new Set(), rootSet = new Set();
        allChars.forEach(c => {
            [c.primaryBlood,c.secondaryBlood,c.tertiaryBlood].forEach(b => { if(b) bloodSet.add(b); });
            [c.primaryRoot, c.secondaryRoot, c.tertiaryRoot ].forEach(r => { if(r) rootSet.add(r);  });
        });
        renderPopupList([
            ...[...bloodSet].map(v => ({ type:'blood', value:v, label:`[ブラッド] ${v}` })),
            ...[...rootSet ].map(v => ({ type:'root',  value:v, label:`[ルーツ] ${v}` })),
        ]);
        searchEl.value = '';
        popup.style.display = 'flex';
        searchEl.focus();
    });

    let currentItems = [];
    function renderPopupList(items) {
        currentItems = items;
        listEl.innerHTML = '';
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'popup-item';
            el.innerHTML = `<div>${escHtml(item.label)}</div>`;
            el.addEventListener('click', () => {
                addFilter(item.type, item.value);
                popup.style.display = 'none';
            });
            listEl.appendChild(el);
        });
    }

    searchEl.addEventListener('input', () => {
        const q = searchEl.value.toLowerCase();
        renderPopupList(currentItems.filter(i => i.label.toLowerCase().includes(q)));
    });

    document.getElementById('roots-popup-close').addEventListener('click', () => { popup.style.display = 'none'; });
    popup.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
}

// ---- プレイヤー名ポップアップ ----
function setupPlayerPopup() {
    const popup    = document.getElementById('player-popup');
    const listEl   = document.getElementById('player-list');
    const searchEl = document.getElementById('player-search');

    document.getElementById('th-player-name').addEventListener('click', () => {
        // 全キャラのプレイヤー名を収集
        const playerSet = new Set();
        allChars.forEach(c => { if(c.playerName) playerSet.add(c.playerName); });
        
        const sortedPlayers = [...playerSet].sort();
        renderPopupList(sortedPlayers.map(p => ({ label: p, value: p })));
        
        searchEl.value = '';
        popup.style.display = 'flex';
        searchEl.focus();
    });

    let currentItems = [];
    function renderPopupList(items) {
        currentItems = items;
        listEl.innerHTML = '';
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'popup-item';
            el.innerHTML = `<div>${escHtml(item.label)}</div>`;
            el.addEventListener('click', () => {
                addFilter('player', item.value);
                popup.style.display = 'none';
            });
            listEl.appendChild(el);
        });
    }

    searchEl.addEventListener('input', () => {
        const q = searchEl.value.toLowerCase();
        renderPopupList(currentItems.filter(i => i.label.toLowerCase().includes(q)));
    });

    document.getElementById('player-popup-close').addEventListener('click', () => { popup.style.display = 'none'; });
    popup.addEventListener('click', e => { if (e.target === popup) popup.style.display = 'none'; });
}

// ---- ユーティリティ ----
function formatDate(ts) {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    const y = d.getFullYear(), mo = d.getMonth()+1, day = d.getDate();
    const h = String(d.getHours()).padStart(2,'0'), m = String(d.getMinutes()).padStart(2,'0');
    return `${y}/${mo}/${day} ${h}:${m}`;
}

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
