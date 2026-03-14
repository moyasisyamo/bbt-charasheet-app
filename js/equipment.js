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
        // ダークモード/非ダークモードの両方で読みやすいように、彩度と輝度を調整
        // 背景は透明度を低く、ボーダーで境界を際立たせる
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
                    <td><small style="font-size:0.8rem; line-height:1.2; display:block;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
                `;
            } else if (currentDictType === 'armor') {
                row.innerHTML = `
                    <td class="dict-row-marker"><strong>${item['装備名']}</strong><br>${badgeHTML}</td>
                    ${buyHTML}
                    <td style="text-align:center;"><small>${item['ドッジ']}</small></td>
                    <td style="text-align:center;"><small>${item['行動値']}</small></td>
                    <td style="white-space:nowrap;"><small>G:${item['G値']||0}/A:${item['A値']||0}</small></td>
                    <td><small style="font-size:0.8rem; line-height:1.2; display:block;">${item['効果']}</small></td>
                    <td><button class="btn primary add-equip-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
                `;
            } else if (currentDictType === 'items') {
                row.innerHTML = `
                    <td class="dict-row-marker"><strong>${item['装備名']}</strong><br>${badgeHTML}</td>
                    ${buyHTML}
                    <td><small>${item['種別']}</small></td>
                    <td style="white-space:nowrap;"><small>${item['タイミング']}</small></td>
                    <td style="white-space:nowrap;"><small>${item['対象']}/${item['射程']}</small></td>
                    <td><small style="font-size:0.8rem; line-height:1.2; display:block;">${item['効果']}</small></td>
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
            <td><strong>${item['装備名']}</strong><br><small>${item['ルーツ'] || '-'}</small></td>
            <td>${item['購入']}</td>
            <td><small>${item['種別']}</small></td>
            <td>${item['命中']}</td>
            <td><small>${item['行動値']}</small></td>
            <td><small>${item['攻撃力']}</small></td>
            <td><small>G:${item['G値']||0} A:${item['A値']||0}</small></td>
            <td><small>${item['射程']}</small></td>
            <td><small>${item['効果']}</small></td>
            <td><button class="btn delete-btn edit-only" style="padding:2px 5px;background:#e02424;color:white;">✕</button></td>
        `;
    } else if (type === 'armor') {
        tbody = document.querySelector('#armor-table tbody');
        arr   = acquiredArmor;
        cItem._normalEquip = item._normalEquip || false;
        cItem._beastEquip  = item._beastEquip || false;
        row.innerHTML = `
            <td>${eqInput}</td>
            <td><strong>${cItem['装備名']}</strong><br><small>${cItem['ルーツ'] || '-'}</small></td>
            <td><input type="checkbox" class="normal-equip-check" ${cItem._normalEquip ? 'checked' : ''}></td>
            <td><input type="checkbox" class="beast-equip-check" ${cItem._beastEquip ? 'checked' : ''}></td>
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
        cItem._quantity = item._quantity !== undefined ? item._quantity : 1;
        row.innerHTML = `
            <td>${eqInput}</td>
            <td><strong>${cItem['装備名']}</strong><br><small>${cItem['ルーツ'] || '-'}</small></td>
            <td><input type="number" class="item-quantity-input" value="${cItem._quantity}" min="0" style="width:50px;"></td>
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
