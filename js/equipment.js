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
            theadEl.innerHTML = `<tr><th class="dict-header-marker" style="width:180px;">装備名</th><th style="width:60px;">購入</th><th style="width:70px;">種別</th><th style="width:40px;">命中</th><th style="width:40px;">行動</th><th style="width:40px;">攻撃</th><th style="width:50px;">射程</th><th>効果</th><th>操作</th></tr>`;
        } else if (type === 'armor') {
            theadEl.innerHTML = `<tr><th class="dict-header-marker" style="width:180px;">防具名</th><th style="width:60px;">購入</th><th style="width:40px;">回避</th><th style="width:40px;">行動</th><th style="width:80px;">G/A値</th><th>効果</th><th>操作</th></tr>`;
        } else if (type === 'items') {
            theadEl.innerHTML = `<tr><th class="dict-header-marker" style="width:180px;">道具名</th><th style="width:60px;">購入</th><th style="width:70px;">種別</th><th>タイミング</th><th>対象/射程</th><th>効果</th><th>操作</th></tr>`;
        }

        modal.style.display = 'flex';
        renderEquipDictionary();
    }

    // 文字列から色を生成し、CSS変数として返す
    function getRootColorVars(rt) {
        if (!rt || rt === '-' || rt === '共通') return '';
        let hash = 0;
        for (let i = 0; i < rt.length; i++) {
            hash = rt.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return `--marker-color: hsl(${h}, 70%, 50%); ` +
               `--badge-override-bg: hsla(${h}, 70%, 50%, 0.15); ` +
               `--badge-override-text: hsl(${h}, 80%, 70%); ` +
               `--badge-override-border: hsla(${h}, 70%, 50%, 0.4);`;
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
            const rt = item['ルーツ'] || '-';
            let catClass = 'cat-root';
            if (BBTData.getRoot(rt)) catClass = 'cat-root';
            else if (rt === '-' || rt === '共通') catClass = 'cat-common';
            else catClass = 'cat-blood';

            row.className = catClass;
            const colorVars = getRootColorVars(rt);
            if (colorVars) row.style = colorVars;

            const badgeHTML  = `<span class="root-badge">${rt}</span>`;
            const buyHTML    = `<td><small style="color:var(--text-muted);">${item['購入']}</small></td>`;

            if (currentDictType === 'weapons') {
                row.innerHTML = `
                    <td class="dict-row-marker"><strong>${item['装備名']}</strong><br>${badgeHTML}</td>
                    ${buyHTML}
                    <td><small>${item['種別']}</small></td>
                    <td style="text-align:center;"><small>${item['命中']}</small></td>
                    <td style="text-align:center;"><small>${item['行動値']}</small></td>
                    <td style="text-align:center;"><small>${item['攻撃力']}</small></td>
                    <td style="text-align:center;"><small>${item['射程']}</small></td>
                    <td><small style="font-size:0.9rem; line-height:1.3; display:block;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
                `;
            } else if (currentDictType === 'armor') {
                row.innerHTML = `
                    <td class="dict-row-marker"><strong>${item['装備名']}</strong><br>${badgeHTML}</td>
                    ${buyHTML}
                    <td style="text-align:center;"><small>${item['ドッジ']}</small></td>
                    <td style="text-align:center;"><small>${item['行動値']}</small></td>
                    <td style="white-space:nowrap;"><small>G:${item['G値']||0}/A:${item['A値']||0}</small></td>
                    <td><small style="font-size:0.9rem; line-height:1.3; display:block;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
                `;
            } else if (currentDictType === 'items') {
                row.innerHTML = `
                    <td class="dict-row-marker"><strong>${item['装備名']}</strong><br>${badgeHTML}</td>
                    ${buyHTML}
                    <td><small>${item['種別']}</small></td>
                    <td style="white-space:nowrap;"><small>${item['タイミング']}</small></td>
                    <td style="white-space:nowrap;"><small>${item['対象']}/${item['射程']}</small></td>
                    <td><small style="font-size:0.9rem; line-height:1.3; display:block;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
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

// ---- テーブル全体を再描画（武器） ----
function renderWeaponsTable() {
    const tbody = document.querySelector('#weapons-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    acquiredWeapons.forEach((item, index) => {
        const row = document.createElement('tr');
        const eqInput = `<input type="text" class="edit-only-input eq-name-input" placeholder="相当品名を入力" style="width:100%;margin-top:4px;" value="${item._equivalentName || ''}"><div class="view-only-text">${item._equivalentName || '-'}</div>`;
        
        row.innerHTML = `
            <td>
                <strong>${item['装備名']}</strong><br><small>${item['ルーツ'] || '-'}</small><br>
                ${eqInput}
            </td>
            <td>${item['購入']}</td>
            <td><small>${item['種別']}</small></td>
            <td>${item['命中']}</td>
            <td><small>${item['行動値']}</small></td>
            <td><small>${item['攻撃力']}</small></td>
            <td><small>G:${item['G値']||0} A:${item['A値']||0}</small></td>
            <td><small>${item['射程']}</small></td>
            <td><small>${item['効果']}</small></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="display:flex; gap:2px;">
                        <button class="btn move-up-btn edit-only"   style="padding:2px 5px; flex:1;">↑</button>
                        <button class="btn move-down-btn edit-only" style="padding:2px 5px; flex:1;">↓</button>
                    </div>
                    <button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕ 削除</button>
                </div>
            </td>
        `;

        const inputEl = row.querySelector('.eq-name-input');
        inputEl.addEventListener('input', () => { item._equivalentName = inputEl.value; row.querySelector('.view-only-text').textContent = inputEl.value || '-'; });
        
        row.querySelector('.move-up-btn').addEventListener('click', () => {
            if (index > 0) { [acquiredWeapons[index], acquiredWeapons[index-1]] = [acquiredWeapons[index-1], acquiredWeapons[index]]; renderWeaponsTable(); calculateStats(); }
        });
        row.querySelector('.move-down-btn').addEventListener('click', () => {
            if (index < acquiredWeapons.length-1) { [acquiredWeapons[index], acquiredWeapons[index+1]] = [acquiredWeapons[index+1], acquiredWeapons[index]]; renderWeaponsTable(); calculateStats(); }
        });
        row.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`「${item['装備名']}」を削除しますか？`)) { acquiredWeapons.splice(index, 1); renderWeaponsTable(); calculateStats(); }
        });
        tbody.appendChild(row);
    });
    if (typeof setEditMode === 'function') setEditMode(window.isEditMode);
}

// ---- テーブル全体を再描画（防具） ----
function renderArmorTable() {
    const tbody = document.querySelector('#armor-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    acquiredArmor.forEach((item, index) => {
        const row = document.createElement('tr');
        const eqInput = `<input type="text" class="edit-only-input eq-name-input" placeholder="相当品名を入力" style="width:100%;margin-top:4px;" value="${item._equivalentName || ''}"><div class="view-only-text">${item._equivalentName || '-'}</div>`;
        
        row.innerHTML = `
            <td>
                <strong>${item['装備名']}</strong><br><small>${item['ルーツ'] || '-'}</small><br>
                ${eqInput}
            </td>
            <td style="text-align:center;"><input type="checkbox" class="normal-equip-check" ${item._normalEquip ? 'checked' : ''}></td>
            <td style="text-align:center;"><input type="checkbox" class="beast-equip-check"  ${item._beastEquip ? 'checked' : ''}></td>
            <td>${item['購入']}</td>
            <td>${item['ドッジ']}</td>
            <td>${item['行動値']}</td>
            <td><small>G:${item['G値']||0} A:${item['A値']||0}</small></td>
            <td><small>${item['効果']}</small></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="display:flex; gap:2px;">
                        <button class="btn move-up-btn edit-only"   style="padding:2px 5px; flex:1;">↑</button>
                        <button class="btn move-down-btn edit-only" style="padding:2px 5px; flex:1;">↓</button>
                    </div>
                    <button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕ 削除</button>
                </div>
            </td>
        `;

        const inputEl = row.querySelector('.eq-name-input');
        inputEl.addEventListener('input', () => { item._equivalentName = inputEl.value; row.querySelector('.view-only-text').textContent = inputEl.value || '-'; });

        row.querySelector('.normal-equip-check').addEventListener('change', e => {
            const isChecked = e.target.checked;
            // 他の防具の通常時装備を解除
            acquiredArmor.forEach(a => a._normalEquip = false);
            item._normalEquip = isChecked;
            renderArmorTable();
            calculateStats();
        });
        row.querySelector('.beast-equip-check').addEventListener('change', e => {
            const isChecked = e.target.checked;
            // 他の防具の魔獣化時装備を解除
            acquiredArmor.forEach(a => a._beastEquip = false);
            item._beastEquip = isChecked;
            renderArmorTable();
            calculateStats();
        });

        row.querySelector('.move-up-btn').addEventListener('click', () => {
            if (index > 0) { [acquiredArmor[index], acquiredArmor[index-1]] = [acquiredArmor[index-1], acquiredArmor[index]]; renderArmorTable(); calculateStats(); }
        });
        row.querySelector('.move-down-btn').addEventListener('click', () => {
            if (index < acquiredArmor.length-1) { [acquiredArmor[index], acquiredArmor[index+1]] = [acquiredArmor[index+1], acquiredArmor[index]]; renderArmorTable(); calculateStats(); }
        });
        row.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`「${item['装備名']}」を削除しますか？`)) { acquiredArmor.splice(index, 1); renderArmorTable(); calculateStats(); }
        });
        tbody.appendChild(row);
    });
    if (typeof setEditMode === 'function') setEditMode(window.isEditMode);
}

// ---- テーブル全体を再描画（道具） ----
function renderItemsTable() {
    const tbody = document.querySelector('#items-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    acquiredItems.forEach((item, index) => {
        const row = document.createElement('tr');
        const eqInput = `<input type="text" class="edit-only-input eq-name-input" placeholder="相当品名を入力" style="width:100%;margin-top:4px;" value="${item._equivalentName || ''}"><div class="view-only-text">${item._equivalentName || '-'}</div>`;
        const qty = item._quantity !== undefined ? item._quantity : 1;

        row.innerHTML = `
            <td>
                <strong>${item['装備名']}</strong><br><small>${item['ルーツ'] || '-'}</small><br>
                ${eqInput}
            </td>
            <td><input type="number" class="item-quantity-input edit-only-input" value="${qty}" min="0" style="width:50px;"><span class="view-only-text">${qty}</span></td>
            <td>${item['購入']}</td>
            <td><small>${item['種別']}</small></td>
            <td><small>${item['タイミング']}</small></td>
            <td><small>${item['対象']}/${item['射程']}</small></td>
            <td><small>${item['効果']}</small></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="display:flex; gap:2px;">
                        <button class="btn move-up-btn edit-only"   style="padding:2px 5px; flex:1;">↑</button>
                        <button class="btn move-down-btn edit-only" style="padding:2px 5px; flex:1;">↓</button>
                    </div>
                    <button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕ 削除</button>
                </div>
            </td>
        `;

        const inputEl = row.querySelector('.eq-name-input');
        inputEl.addEventListener('input', () => { item._equivalentName = inputEl.value; row.querySelector('.view-only-text').textContent = inputEl.value || '-'; });

        const qtyEl = row.querySelector('.item-quantity-input');
        qtyEl.addEventListener('input', e => {
            item._quantity = Math.max(0, parseInt(e.target.value) || 0);
            const views = row.querySelectorAll('.view-only-text');
            if (views[1]) views[1].textContent = item._quantity;
            calculateStats();
        });

        row.querySelector('.move-up-btn').addEventListener('click', () => {
            if (index > 0) { [acquiredItems[index], acquiredItems[index-1]] = [acquiredItems[index-1], acquiredItems[index]]; renderItemsTable(); calculateStats(); }
        });
        row.querySelector('.move-down-btn').addEventListener('click', () => {
            if (index < acquiredItems.length-1) { [acquiredItems[index], acquiredItems[index+1]] = [acquiredItems[index+1], acquiredItems[index]]; renderItemsTable(); calculateStats(); }
        });
        row.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`「${item['装備名']}」を削除しますか？`)) { acquiredItems.splice(index, 1); renderItemsTable(); calculateStats(); }
        });
        tbody.appendChild(row);
    });
    if (typeof setEditMode === 'function') setEditMode(window.isEditMode);
}

// ---- 装備をテーブルに追加 ----
function addEquipToTable(item, type) {
    const cItem = { ...item, _equivalentName: item._equivalentName || '' };
    if (type === 'weapons') {
        acquiredWeapons.push(cItem);
        renderWeaponsTable();
    } else if (type === 'armor') {
        cItem._normalEquip = item._normalEquip || false;
        cItem._beastEquip  = item._beastEquip || false;
        acquiredArmor.push(cItem);
        renderArmorTable();
    } else if (type === 'items') {
        cItem._quantity = item._quantity !== undefined ? item._quantity : 1;
        acquiredItems.push(cItem);
        renderItemsTable();
    }
    calculateStats();
}

// グローバル公開
window.addEquipToTable      = addEquipToTable;
window.renderWeaponsTable   = renderWeaponsTable;
window.renderArmorTable     = renderArmorTable;
window.renderItemsTable     = renderItemsTable;
window.initEquipDictionary  = initEquipDictionary;
