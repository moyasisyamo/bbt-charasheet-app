/**
 * arts.js
 * アーツテーブル・辞典・自動取得アーツを管理する。
 * 依存: BBTArtsData (loader.js), BBTData (data.js), calculateStats (stats.js)
 */

// ---- 取得済みアーツ配列（グローバル公開） ----
window.acquiredArts = [];

// ---- テーブルに行を追加 ----
function addArtToTable(art, unshift = false, skipCalc = false) {
    if (acquiredArts.some(a => a['アーツ名'] === art['アーツ名'])) return;
    art._currentLevel = art._currentLevel !== undefined ? art._currentLevel : 1;
    if (unshift) { window.acquiredArts.unshift({ ...art }); }
    else         { window.acquiredArts.push({ ...art }); }
    renderArtsTable();
    if (!skipCalc) calculateStats();
}

// ---- テーブル全体を再描画 ----
function renderArtsTable() {
    const tbody = document.querySelector('#arts-table tbody');
    tbody.innerHTML = '';
    let isNextCopied = false;

    acquiredArts.forEach((art, index) => {
        const isCopied = isNextCopied;
        const isBeast  = art['アーツ名'] === '魔獣化';
        const type     = art['種別'] || '';
        const row      = document.createElement('tr');

        let nameHTML = `<strong>${art['アーツ名']}</strong><br><small>${art._rt || art['ルーツ'] || ''}</small>`;
        if (isCopied) nameHTML += `<br><small style="color:var(--primary-color);">（コピーされたアーツ）</small>`;

        const lvVal = art._currentLevel !== undefined ? art._currentLevel : 1;

        // コスト編集可能なセル（コピーアーツまたは魔獣化）
        let costCellHTML = `<td>${art['コスト'] || '-'}</td>`;
        if (isCopied || isBeast) {
            let defaultCost = art['コスト'] || '0';
            if (isBeast && art._overrideCost === undefined) {
                // 魔獣化の初期値は1（updateAutoArtsでも設定するがここでも念のため）
                defaultCost = '1';
            }
            const cv = art._overrideCost !== undefined ? art._overrideCost : defaultCost;
            costCellHTML = `<td>
                <input type="text" class="copied-art-cost edit-only-input" value="${cv}" style="width:40px;padding:2px 5px;">
                <span class="view-only-text copied-art-cost-view">${cv}</span>
            </td>`;
        }

        // 補足エリアの表示状態
        const noteVisible = art._noteVisible ? 'block' : 'none';
        const noteContent = art._note || '';

        row.innerHTML = `
            <td>
                ${nameHTML}
                <div class="art-note-container" style="display:${noteVisible};">
                    <textarea class="art-note-area edit-only" placeholder="補足情報を入力...">${noteContent}</textarea>
                    <div class="view-only-text" style="font-size:0.8rem; color:var(--text-muted); padding:4px; border-left:2px solid var(--primary-color); background:rgba(0,0,0,0.05); margin-top:5px;">
                        ${noteContent.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </td>
            <td style="white-space:nowrap;">
                <input type="number" class="art-level-input edit-only-input" value="${lvVal}" min="0">
                / ${art['最大Lv'] || '?'}
                <span class="view-only-text">${lvVal} / ${art['最大Lv'] || '?'}</span>
            </td>
            <td><small>${type || '-'}</small></td>
            <td><small>${art['タイミング'] || '-'}</small></td>
            <td>${art['判定値'] || '-'}</td>
            <td><small>${art['対象'] || '-'}/${art['射程'] || '-'}</small></td>
            ${costCellHTML}
            <td><small style="font-size:0.9rem;">${art['効果'] || '-'}</small></td>
            <td>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div style="display:flex; gap:2px;">
                        <button class="btn move-up-btn edit-only"   style="padding:2px 5px; flex:1;">↑</button>
                        <button class="btn move-down-btn edit-only" style="padding:2px 5px; flex:1;">↓</button>
                    </div>
                    <button class="btn toggle-note-btn edit-only" style="padding:2px 5px; font-size:0.75rem; background:var(--primary-color); color:white;">補足</button>
                    <button class="btn delete-btn edit-only"    style="padding:2px 5px; background:#e02424; color:white;">✕ 削除</button>
                </div>
            </td>
        `;

        const lvlInput = row.querySelector('.art-level-input');
        const viewTxt  = row.querySelector('.view-only-text');
        lvlInput.addEventListener('input', e => {
            art._currentLevel = Math.max(0, parseInt(e.target.value) || 0);
            viewTxt.textContent = `${art._currentLevel} / ${art['最大Lv'] || '?'}`;
            calculateStats();
        });

        // コスト編集
        if (isCopied || isBeast) {
            const costIn  = row.querySelector('.copied-art-cost');
            const costVw  = row.querySelector('.copied-art-cost-view');
            costIn.addEventListener('input', e => {
                art._overrideCost = e.target.value;
                costVw.textContent = e.target.value || '-';
                calculateStats(); // コスト変更でXP計算などが走るため
            });
            if (isCopied) row.style.backgroundColor = 'rgba(255,235,59,0.05)';
        }

        // 補足トグル
        row.querySelector('.toggle-note-btn').addEventListener('click', () => {
            art._noteVisible = !art._noteVisible;
            renderArtsTable();
        });

        // 補足入力
        const noteArea = row.querySelector('.art-note-area');
        if (noteArea) {
            noteArea.addEventListener('input', e => {
                art._note = e.target.value;
                // view-onlyテキストの更新は再描画で行う
            });
        }

        row.querySelector('.move-up-btn').addEventListener('click', () => {
            if (index > 0) { [acquiredArts[index], acquiredArts[index-1]] = [acquiredArts[index-1], acquiredArts[index]]; renderArtsTable(); calculateStats(); }
        });
        row.querySelector('.move-down-btn').addEventListener('click', () => {
            if (index < acquiredArts.length-1) { [acquiredArts[index], acquiredArts[index+1]] = [acquiredArts[index+1], acquiredArts[index]]; renderArtsTable(); calculateStats(); }
        });
        row.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`「${art['アーツ名']}」を削除しますか？`)) {
                acquiredArts.splice(index, 1); renderArtsTable(); calculateStats();
            }
        });

        document.querySelector('#arts-table tbody').appendChild(row);
        isNextCopied = type.includes('コピー');
    });

    setEditMode(window.isEditMode);
}

// ---- 自動取得アーツの追加・削除 ----
function updateAutoArts(pRoot, sRoot, tRoot, style) {
    const validRoots  = [pRoot, sRoot, tRoot].filter(Boolean);
    const validBloods = [];
    validRoots.forEach(r => {
        const rd = BBTData.getRoot(r);
        if (rd && rd['ブラッド名']) validBloods.push(rd['ブラッド名']);
    });
    const toCheck  = [...validRoots, ...validBloods, style, '基本', '共通アーツ'].filter(Boolean);
    const rootsMap = { ...BBTArtsData };

    // 不要な自動取得アーツを削除
    const toRemove = [];
    acquiredArts.forEach(art => {
        if (art['種別'] && art['種別'].includes('自動') && art['アーツ名'] !== '魔獣化' && art['アーツ名'] !== 'アレナ展開') {
            const rt   = art._rt || art['ルーツ'];
            const oCat = art._originCat;
            if (!toCheck.includes(rt) && !toCheck.includes(oCat)) toRemove.push(art);
        }
    });
    toRemove.forEach(art => { window.acquiredArts = acquiredArts.filter(a => a['アーツ名'] !== art['アーツ名']); });
    if (toRemove.length > 0) renderArtsTable();

    // 新たな自動取得アーツを追加
    toCheck.forEach(cat => {
        (rootsMap[cat] || []).forEach(art => {
            if (art['種別'] && art['種別'].includes('自動') && !acquiredArts.some(a => a['アーツ名'] === art['アーツ名'])) {
                let matchRoot = true;
                const normalize = s => s ? s.replace(/\.$/, '') : '';
                const nArtRoot = normalize(art['ルーツ']);
                const nValidRoots = validRoots.map(normalize);

                if (art['ルーツ'] && art['ルーツ'] !== cat && !['基本','イレギュラー','共通アーツ'].includes(art['ルーツ'])) {
                    if (!nValidRoots.includes(nArtRoot)) matchRoot = false;
                }
                if (matchRoot) {
                    const newArt = { ...art, _originCat: cat, _rt: art['ルーツ'] || cat, _currentLevel: 1 };
                    addArtToTable(newArt, false, true); // 無限再帰防止のため skipCalc=true
                }
            }
        });
    });

    // 魔獣化・アレナ展開は常に先頭に保証
    const commonList = rootsMap['共通アーツ'] || [];
    [...['魔獣化','アレナ展開']].reverse().forEach(name => {
        const req = commonList.find(a => a['アーツ名'] === name);
        if (req && !acquiredArts.some(a => a['アーツ名'] === name)) {
            const newArt = { ...req, _originCat: '共通アーツ', _rt: req['ルーツ'] || '共通アーツ', _currentLevel: 1 };
            if (name === '魔獣化') newArt._overrideCost = '1';
            addArtToTable(newArt, true, true); // 無限再帰防止のため skipCalc=true
        }
    });
}

// ---- 辞典モーダルの初期化 ----
function initArtsDictionary() {
    const artsModal        = document.getElementById('arts-dictionary-modal');
    const dictTableBody    = document.querySelector('#dictionary-table tbody');
    const dictSearchInput  = document.getElementById('arts-search-input');
    const dictFilterCat    = document.getElementById('arts-filter-category');

    artsModal.addEventListener('click', e => { if (e.target === artsModal) artsModal.style.display = 'none'; });

    document.getElementById('open-arts-dictionary-btn').addEventListener('click', () => {
        // フィルターを動的生成
        let optsHTML = `<option value="all">すべて</option><option value="current" selected>取得可能なアーツのみ</option>`;
        ['アタッカー','ディフェンダー','サポーター'].forEach(s => optsHTML += `<option value="${s}">${s}</option>`);
        BBTData.primaryBlood.forEach(b => {
            if (b && b['ブラッド名'] && b['ブラッド名'] !== 'なし')
                optsHTML += `<option value="${b['ブラッド名']}">${b['ブラッド名']}</option>`;
        });
        optsHTML += `<option value="共通アーツ">共通アーツ</option>`;
        dictFilterCat.innerHTML = optsHTML;
        artsModal.style.display = 'flex';
        renderDictionary();
    });

    document.getElementById('close-arts-dictionary').addEventListener('click', () => { artsModal.style.display = 'none'; });
    dictSearchInput.addEventListener('input', renderDictionary);
    dictFilterCat.addEventListener('change', renderDictionary);

    function renderDictionary() {
        const query  = dictSearchInput.value.toLowerCase();
        const filter = dictFilterCat.value;

        const pRoot  = document.getElementById('primary-root').value;
        const sRoot  = document.getElementById('secondary-root').value;
        const cStyle = document.getElementById('char-style').value;
        const tRoot  = document.getElementById('tertiary-root').value;

        const validRoots  = [pRoot, sRoot, tRoot].filter(Boolean);
        const validBloods = [];
        validRoots.forEach(r => { const rd = BBTData.getRoot(r); if (rd) validBloods.push(rd['ブラッド名']); });

        dictTableBody.innerHTML = '';
        const styleCats  = ['アタッカー','ディフェンダー','サポーター'];
        const allKeys    = Object.keys(BBTArtsData);
        const sortedCats = [...new Set([...styleCats, ...validBloods, ...validRoots, '共通アーツ', '基本アーツ', '基本', 'イレギュラー', ...allKeys])];

        const resultSet = [];
        sortedCats.forEach(cat => {
            (BBTArtsData[cat] || []).forEach(art => {
                const rt = art['ルーツ'] || cat;
                let matchFilter = true;

                const normalize = s => s ? s.replace(/\.$/, '') : '';
                const nRt = normalize(rt);
                const nCat = normalize(cat);
                const nValidRoots = validRoots.map(normalize);
                const nValidBloods = validBloods.map(normalize);

                if (filter === 'current') {
                    if (styleCats.includes(cat) && cat !== cStyle && cStyle) {
                        matchFilter = false;
                    } else {
                        const isStyle  = cat === cStyle || rt === cStyle;
                        const isRoot   = nValidRoots.includes(nRt)  || nValidRoots.includes(nCat);
                        const isBlood  = nValidBloods.includes(nRt) || nValidBloods.includes(nCat);
                        const isCommon = rt === '基本アーツ' || cat === '共通アーツ' || rt === '基本';
                        let validBloodRoot = true;
                        if (nValidBloods.includes(nCat) && nRt !== nCat && !nValidRoots.includes(nRt)) validBloodRoot = false;
                        matchFilter = (isStyle || isRoot || isBlood || isCommon) && validBloodRoot;
                    }
                } else if (filter !== 'all') {
                    if (cat !== filter) matchFilter = false;
                }

                if (!matchFilter) return;
                
                const queries = query.split(/[\s　]+/).filter(q => q);
                const txt = `${art['アーツ名']} ${art['効果']} ${rt} ${art['種別'] || ''} ${art['対象'] || ''}/${art['射程'] || ''} ${art['判定値'] || ''} ${art['タイミング'] || ''}`.toLowerCase();
                
                let isMatch = true;
                for (const q of queries) {
                    if (!txt.includes(q)) {
                        isMatch = false;
                        break;
                    }
                }

                if (queries.length > 0 && !isMatch) return;
                
                resultSet.push({ ...art, _cat: cat, _rt: rt });
            });
        });

        resultSet.forEach(art => {
            const row = document.createElement('tr');
            let catClass = 'cat-root';
            if (['アタッカー','ディフェンダー','サポーター'].includes(art._cat)) {
                catClass = art._cat === 'アタッカー' ? 'cat-atk' : (art._cat === 'ディフェンダー' ? 'cat-def' : 'cat-sup');
            } else if (art._rt === '共通アーツ' || art._rt === '基本' || art._rt === '基本アーツ') {
                catClass = 'cat-common';
            } else {
                // ブラッド名かどうかを簡易判定（ここではデフォルトでblood色、あるいはルーツ色。
                // 実際にはBBTDataを参照する方が正確だが、辞書のcatは既に整理されている。）
                catClass = BBTData.getRoot(art._rt) ? 'cat-root' : 'cat-blood';
            }

            let displayCat = art._rt;
            if (['アタッカー','ディフェンダー','サポーター'].includes(art._cat)) displayCat = art._cat;

            row.className = catClass; // 色管理用にクラスはTRに残す
            row.innerHTML = `
                <td class="dict-row-marker"><strong>${art['アーツ名']}</strong><br><span class="root-badge">${displayCat}</span></td>
                <td style="white-space:nowrap;"><small>${art['種別'] || '-'}</small></td>
                <td style="text-align:center;"><small>${art['最大Lv'] || '-'}</small></td>
                <td style="white-space:nowrap;"><small>${art['タイミング']}</small></td>
                <td style="white-space:nowrap;"><small>${art['判定値'] || '-'}</small></td>
                <td style="white-space:nowrap;"><small>${art['対象'] || '-'}/${art['射程'] || '-'}</small></td>
                <td style="text-align:center;"><small>${art['コスト']}</small></td>
                <td><small style="font-size:0.9rem; line-height:1.2; display:block;">${art['効果']}</small></td>
                <td><button class="btn primary add-art-btn" style="padding:4px 8px;font-size:0.75rem;white-space:nowrap;">追加</button></td>
            `;
            row.querySelector('.add-art-btn').addEventListener('click', () => {
                art._currentLevel = 1;
                addArtToTable(art);
                artsModal.style.display = 'none';
            });
            dictTableBody.appendChild(row);
        });
    }

    // グローバル公開（arts辞典からアクセスできるように）
    window.renderDictionary = renderDictionary;
}

// グローバル公開
window.addArtToTable   = addArtToTable;
window.renderArtsTable = renderArtsTable;
window.updateAutoArts  = updateAutoArts;
window.initArtsDictionary = initArtsDictionary;
