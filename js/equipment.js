/**
 * equipment.js
 * 武器・防具・道具テーブルと辞典モーダルを管理する。
 * 依存: BBTEquipData (loader.js), calculateStats (stats.js)
 */

// ---- 取得済み装備配列（グローバル公開） ----
window.acquiredWeapons = [];
window.acquiredArmor   = [];
window.acquiredItems   = [];

// ---- 辞典モーダルの初期化 ----
function initEquipDictionary() {
    const modal          = document.getElementById('equip-dictionary-modal');
    const titleEl        = document.getElementById('equip-dict-title');
    const theadEl        = document.getElementById('equip-dict-thead');
    const tbodyEl        = document.getElementById('equip-dict-tbody');
    const searchInput    = document.getElementById('equip-search-input');
    let currentDictType  = '';

    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    document.getElementById('open-weapon-dict-btn').addEventListener('click', () => openEquipDict('weapons', '武器・乗り物辞典'));
    document.getElementById('open-armor-dict-btn').addEventListener('click',  () => openEquipDict('armor',   '防具辞典'));
    document.getElementById('open-item-dict-btn').addEventListener('click',   () => openEquipDict('items',   '道具辞典'));
    document.getElementById('close-equip-dictionary').addEventListener('click', () => { modal.style.display = 'none'; });
    searchInput.addEventListener('input', renderEquipDictionary);

    function openEquipDict(type, title) {
        currentDictType = type;
        titleEl.textContent = title;
        searchInput.value = '';

        if (type === 'weapons') {
            theadEl.innerHTML = `<tr><th>ルーツ</th><th>装備名</th><th>種別</th><th>命中</th><th>攻撃力</th><th>射程</th><th>効果</th><th>操作</th></tr>`;
        } else if (type === 'armor') {
            theadEl.innerHTML = `<tr><th>ルーツ</th><th>防具名</th><th>ドッジ</th><th>行動値</th><th>G/A値</th><th>効果</th><th>操作</th></tr>`;
        } else if (type === 'items') {
            theadEl.innerHTML = `<tr><th>ルーツ</th><th>道具名</th><th>種別</th><th>タイミング</th><th>対象/射程</th><th>効果</th><th>操作</th></tr>`;
        }

        modal.style.display = 'flex';
        renderEquipDictionary();
    }

    function renderEquipDictionary() {
        const query    = searchInput.value.toLowerCase();
        tbodyEl.innerHTML = '';
        const dataList = BBTEquipData[currentDictType] || [];

        dataList.filter(item => {
            if (!query) return true;
            const name   = (item['装備名'] || '').toLowerCase();
            const type   = (item['種別']   || '').toLowerCase();
            const effect = (item['効果']   || '').toLowerCase();
            return name.includes(query) || type.includes(query) || effect.includes(query);
        }).forEach(item => {
            const row = document.createElement('tr');
            if (currentDictType === 'weapons') {
                row.innerHTML = `
                    <td><small>${item['ルーツ'] || '-'}</small></td>
                    <td><strong>${item['装備名']}</strong><br><small>購入:${item['購入']}</small></td>
                    <td><small>${item['種別']}</small></td>
                    <td>${item['命中']}</td>
                    <td><small>${item['攻撃力']}</small></td>
                    <td><small>${item['射程']}</small></td>
                    <td><small style="font-size:0.75rem;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;">追加</button></td>
                `;
            } else if (currentDictType === 'armor') {
                row.innerHTML = `
                    <td><small>${item['ルーツ'] || '-'}</small></td>
                    <td><strong>${item['装備名']}</strong><br><small>購入:${item['購入']}</small></td>
                    <td>${item['ドッジ']}</td>
                    <td>${item['行動値']}</td>
                    <td><small>G:${item['G値']||0}/A:${item['A値']||0}</small></td>
                    <td><small style="font-size:0.75rem;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;">追加</button></td>
                `;
            } else if (currentDictType === 'items') {
                row.innerHTML = `
                    <td><small>${item['ルーツ'] || '-'}</small></td>
                    <td><strong>${item['装備名']}</strong><br><small>購入:${item['購入']}</small></td>
                    <td><small>${item['種別']}</small></td>
                    <td><small>${item['タイミング']}</small></td>
                    <td><small>${item['対象']}/${item['射程']}</small></td>
                    <td><small style="font-size:0.75rem;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;">追加</button></td>
                `;
            }
            row.querySelector('.add-equip-btn').addEventListener('click', () => {
                addEquipToTable(item, currentDictType);
                modal.style.display = 'none';
            });
            tbodyEl.appendChild(row);
        });
    }
}

// ---- 装備をテーブルに追加 ----
function addEquipToTable(item, type) {
    let tbody, arr;
    const row    = document.createElement('tr');
    const eqInput = `<input type="text" class="edit-only-input" placeholder="名前を自由に入力" style="width:100%;"><div class="view-only-text">-</div>`;
    const cItem  = { ...item, _equivalentName: '' };

    if (type === 'weapons') {
        tbody = document.querySelector('#weapons-table tbody');
        arr   = acquiredWeapons;
        row.innerHTML = `
            <td>${eqInput}</td>
            <td><small>${item['ルーツ'] || '-'}</small></td>
            <td><strong>${item['装備名']}</strong><br><small>購入:${item['購入']}</small></td>
            <td>${item['購入']}</td>
            <td><small>${item['種別']}</small></td>
            <td>${item['命中']}</td>
            <td><small>${item['攻撃力']}</small></td>
            <td><small>G:${item['G値']||0} A:${item['A値']||0}</small></td>
            <td><small>${item['射程']}</small></td>
            <td><small>${item['効果']}</small></td>
            <td><button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕</button></td>
        `;
    } else if (type === 'armor') {
        tbody = document.querySelector('#armor-table tbody');
        arr   = acquiredArmor;
        cItem._normalEquip = false;
        cItem._beastEquip  = false;
        row.innerHTML = `
            <td>${eqInput}</td>
            <td><small>${cItem['ルーツ'] || '-'}</small></td>
            <td><strong>${cItem['装備名']}</strong></td>
            <td><input type="checkbox" class="normal-equip-check"></td>
            <td><input type="checkbox" class="beast-equip-check"></td>
            <td>${cItem['購入']}</td>
            <td>${cItem['ドッジ']}</td>
            <td>${cItem['行動値']}</td>
            <td><small>G:${cItem['G値']||0} A:${cItem['A値']||0}</small></td>
            <td><small>${cItem['効果']}</small></td>
            <td><button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕</button></td>
        `;
        row.querySelector('.normal-equip-check').addEventListener('change', e => {
            if (e.target.checked) {
                document.querySelectorAll('.normal-equip-check').forEach(c => { if (c !== e.target) c.checked = false; });
                acquiredArmor.forEach(a => a._normalEquip = false);
            }
            cItem._normalEquip = e.target.checked;
            calculateStats();
        });
        row.querySelector('.beast-equip-check').addEventListener('change', e => {
            if (e.target.checked) {
                document.querySelectorAll('.beast-equip-check').forEach(c => { if (c !== e.target) c.checked = false; });
                acquiredArmor.forEach(a => a._beastEquip = false);
            }
            cItem._beastEquip = e.target.checked;
            calculateStats();
        });
    } else if (type === 'items') {
        tbody = document.querySelector('#items-table tbody');
        arr   = acquiredItems;
        cItem._quantity = 1;
        row.innerHTML = `
            <td>${eqInput}</td>
            <td><small>${cItem['ルーツ'] || '-'}</small></td>
            <td><strong>${cItem['装備名']}</strong></td>
            <td><input type="number" class="item-quantity-input" value="1" min="0" style="width:50px;"></td>
            <td>${cItem['購入']}</td>
            <td><small>${cItem['種別']}</small></td>
            <td><small>${cItem['タイミング']}</small></td>
            <td><small>${cItem['対象']}/${cItem['射程']}</small></td>
            <td><small>${cItem['効果']}</small></td>
            <td><button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕</button></td>
        `;
        row.querySelector('.item-quantity-input').addEventListener('input', e => {
            cItem._quantity = Math.max(0, parseInt(e.target.value) || 0);
            calculateStats();
        });
    }

    const inputEl = row.querySelector('.edit-only-input');
    const viewEl  = row.querySelector('.view-only-text');
    inputEl.addEventListener('input', () => { viewEl.textContent = inputEl.value || '-'; cItem._equivalentName = inputEl.value; });

    row.querySelector('.delete-btn').addEventListener('click', () => {
        row.remove();
        const idx = arr.indexOf(cItem);
        if (idx > -1) arr.splice(idx, 1);
        calculateStats();
    });

    tbody.appendChild(row);
    arr.push(cItem);
    calculateStats();
}

// グローバル公開
window.addEquipToTable      = addEquipToTable;
window.initEquipDictionary  = initEquipDictionary;
