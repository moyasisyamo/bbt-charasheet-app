/**
 * main.js (エントリーポイント)
 * アプリ初期化・UIセットアップ・イベントバインドを担当する。
 * 実際の計算処理は stats.js、アーツは arts.js、装備は equipment.js に委譲。
 * データ読み込みは loader.js に委譲。
 */
document.addEventListener('DOMContentLoaded', () => {

    // ---- ローディング画面表示 ----
    const appContainer = document.querySelector('.app-container');
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-color);">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚔</div>
            <div style="font-size: 1.2rem; margin-bottom: 10px;">データを読み込んでいます...</div>
            <div id="loader-detail" style="font-size: 0.85rem; color: var(--text-muted);">CSVファイルを取得中</div>
        </div>`;
    loader.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-color);z-index:9999;';
    document.body.appendChild(loader);

    // ---- データロード → アプリ初期化 ----
    loadAllData(
        () => { // 成功
            loader.remove();
            initApp();
        },
        (err) => { // 失敗
            const msg = `【エラー】データCSVの読み込みに失敗しました。\n\nローカルサーバー経由でアクセスしているか確認してください。\n  例: npx serve .\n\n詳細: ${err.message}`;
            loader.innerHTML = `<div style="padding:20px;color:#ff5277;max-width:600px;text-align:left;">
                <h2>⚠ データ読み込みエラー</h2>
                <pre style="white-space:pre-wrap;line-height:1.6;">${msg}</pre>
            </div>`;
        }
    );

    // ====================================================================
    // アプリ本体初期化
    // ====================================================================
    function initApp() {

        // ---- グローバル状態 ----
        window.charData    = { mods: {}, image: null, image2: null, faceIcon: null };
        window.isBeastMode = false;
        window.isEditMode  = true;
        window.currentCharId = new URLSearchParams(location.search).get('id') || null;

        // ---- テーマ切り替え ----
        const themeBtn = document.getElementById('theme-toggle');
        // 初期テーマを localStorage から復元
        const savedTheme = localStorage.getItem('bbt-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeBtn.textContent = savedTheme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('bbt-theme', next);
            themeBtn.textContent = next === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
        });

        // ---- 編集モード切り替え ----
        const toggleEditBtn   = document.getElementById('toggle-edit-mode-btn');
        const passwordInput   = document.getElementById('char-password');

        window.setEditMode = function(edit) {
            window.isEditMode = edit;
            document.querySelectorAll('.edit-only, .edit-only-input').forEach(el => el.style.display = edit ? '' : 'none');
            document.querySelectorAll('.view-only-text').forEach(el => el.style.display = edit ? 'none' : '');
            document.querySelectorAll(
                'input:not(.edit-only-input):not(#char-password):not(#arts-search-input):not(#equip-search-input):not([type="checkbox"]),' +
                'select:not(#arts-filter-category)'
            ).forEach(el => { el.disabled = !edit; el.classList.toggle('locked-input', !edit); });
            document.querySelectorAll('.btn:not(#toggle-edit-mode-btn):not(#theme-toggle):not(#export-cocofolia-btn)').forEach(btn => btn.style.display = edit ? '' : 'none');
            ['close-arts-dictionary','close-equip-dictionary','beast-mode-btn'].forEach(id => {
                const el = document.getElementById(id); if (el) el.style.display = '';
            });

            // 防具チェックボックスを閲覧時は操作不可
            document.querySelectorAll('.normal-equip-check, .beast-equip-check').forEach(cb => {
                cb.disabled = !edit;
                cb.style.cursor = edit ? '' : 'not-allowed';
            });

            // 閲覧時はアーツ「削除」・装備「操作」列ヘッダーを非表示
            const artsLastTh = document.querySelector('#arts-table thead tr th:last-child');
            if (artsLastTh) artsLastTh.style.visibility = edit ? '' : 'hidden';
            ['#weapons-table','#armor-table','#items-table'].forEach(sel => {
                const th = document.querySelector(sel + ' thead tr th:last-child');
                if (th) th.style.visibility = edit ? '' : 'hidden';
            });

            if (edit) {
                toggleEditBtn.innerHTML = '🔒 閲覧モード<br><span style="font-size:0.75rem;">(編集ロック)</span>';
                toggleEditBtn.classList.replace('primary', 'warning');
                const ov = document.getElementById('view-mode-overlay');
                if (ov) ov.style.display = 'none';
            } else {
                toggleEditBtn.innerHTML = '🔓 編集モード';
                toggleEditBtn.classList.replace('warning', 'primary');
                document.querySelectorAll('.profile-input').forEach(input => {
                    const viewEl = input.parentElement?.querySelector('.view-only-text');
                    if (viewEl) viewEl.textContent = input.value || '-';
                });
                const nameEl = document.getElementById('char-name');
                const vName  = document.getElementById('view-char-name');
                if (nameEl && vName) vName.textContent = nameEl.value || '-';
                const playerEl = document.getElementById('player-name');
                const vPlayer  = document.getElementById('view-player-name');
                if (playerEl && vPlayer) vPlayer.textContent = playerEl.value || '-';
                const faceView = document.getElementById('face-icon-view');
                if (faceView && charData.faceIcon) { faceView.src = charData.faceIcon; faceView.style.display = 'block'; }
                buildAndShowViewOverlay();
            }
        };

        toggleEditBtn.addEventListener('click', () => {
            if (window.isEditMode) {
                if (!passwordInput.value) { alert('編集をロックするにはパスワードを設定してください。'); return; }
                setEditMode(false);
            } else {
                const pass = prompt('編集モードにするためのパスワードを入力してください:');
                if (pass === passwordInput.value) { setEditMode(true); }
                else if (pass !== null) { alert('パスワードが違います。'); }
            }
        });

        // ---- セレクター初期化 ----
        const styleSelect         = document.getElementById('char-style');
        const primaryRootSelect   = document.getElementById('primary-root');
        const secondaryRootSelect = document.getElementById('secondary-root');

        BBTData.styles.forEach(s => {
            if (s['スタイル名'] === 'なし') return;
            const opt = document.createElement('option');
            opt.value = opt.textContent = s['スタイル名'];
            styleSelect.appendChild(opt);
        });
        BBTData.roots.forEach(root => {
            const rn = root['ルーツ名'], bn = root['ブラッド名'];
            if (rn === 'なし') return;
            ['primary-root','secondary-root','tertiary-root'].forEach(id => {
                const opt = document.createElement('option');
                opt.value = rn; opt.textContent = `[${bn}] ${rn}`;
                document.getElementById(id).appendChild(opt);
            });
        });

        // ---- 魔獣化切り替え ----
        const beastBtn      = document.getElementById('beast-mode-btn');
        const adjLabel      = document.getElementById('adj-state-label');
        const normalAdjGrid = document.getElementById('normal-adj-grid');
        const beastAdjGrid  = document.getElementById('beast-adj-grid');

        beastBtn.addEventListener('click', () => {
            window.isBeastMode = !window.isBeastMode;
            if (window.isBeastMode) {
                beastBtn.textContent = '🔴 通常切り替え';
                beastBtn.classList.replace('exception-btn', 'primary');
                document.documentElement.classList.add('beast-mode-active');
                adjLabel.textContent = '(魔獣化中)'; adjLabel.style.color = 'var(--primary-color)';
                normalAdjGrid.style.display = 'none'; beastAdjGrid.style.display = 'block';
            } else {
                beastBtn.textContent = '🐺 魔獣化切り替え';
                beastBtn.classList.replace('primary', 'exception-btn');
                document.documentElement.classList.remove('beast-mode-active');
                adjLabel.textContent = '(通常)'; adjLabel.style.color = 'var(--text-muted)';
                normalAdjGrid.style.display = 'block'; beastAdjGrid.style.display = 'none';
            }
            calculateStats();
        });

        // ---- ターシャリルーツ追加ボタン ----
        document.getElementById('add-tertiary-btn').addEventListener('click', () => {
            document.getElementById('tertiary-root-container').style.display = 'block';
            document.getElementById('add-tertiary-container').style.display = 'none';
        });

        // ---- 計算トリガー ----
        [styleSelect, primaryRootSelect, secondaryRootSelect,
         document.getElementById('tertiary-root'), document.getElementById('free-stat')
        ].forEach(el => el.addEventListener('change', calculateStats));

        document.querySelectorAll('[name="proficiency-choice"]').forEach(r => r.addEventListener('change', calculateStats));

        document.querySelectorAll('.stat-trigger, .stat-growth, .manual-adj-input').forEach(el => {
            el.addEventListener('change', calculateStats);
            if (el.classList.contains('stat-growth') || el.classList.contains('manual-adj-input')) {
                el.addEventListener('input', calculateStats);
            }
        });

        // ---- プロフィール入力 → ビュー同期 ----
        document.querySelectorAll('.profile-input-grid .edit-only-input').forEach(input => {
            input.addEventListener('input', e => {
                const view = e.target.nextElementSibling;
                if (view && view.classList.contains('view-only-text')) view.textContent = e.target.value || '-';
            });
        });
        ['char-name','player-name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', e => {
                const view = document.getElementById(`view-${id}`);
                if (view) view.textContent = e.target.value || '-';
            });
        });

        // ---- アーツ・装備モジュール初期化 ----
        initArtsDictionary();
        initEquipDictionary();

        // ---- 画像アップロード ----
        initImageUpload('char-image-placeholder', 'char-image-upload', 'clear-image-btn', 'char-image-preview',  'image');
        initImageUpload('char-image-placeholder2','char-image-upload2','clear-image-btn2','char-image-preview2', 'image2');

        function initImageUpload(placeholderId, uploadId, clearId, previewId, key) {
            const p = document.getElementById(placeholderId);
            const u = document.getElementById(uploadId);
            const b = document.getElementById(clearId);
            const v = document.getElementById(previewId);
            if (!p || !u || !b || !v) return;
            p.parentElement.addEventListener('click', e => { if (e.target !== b && e.target !== u && !window.isEditMode === false) u.click(); });
            u.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    charData[key] = ev.target.result;
                    v.src = charData[key]; v.style.display = 'block';
                    p.style.display = 'none'; b.style.display = 'block';
                };
                reader.readAsDataURL(file);
            });
            b.addEventListener('click', e => {
                e.stopPropagation();
                charData[key] = null;
                v.src = ''; v.style.display = 'none';
                p.style.display = 'flex'; b.style.display = 'none';
                u.value = '';
            });
        }

        // ---- ココフォリア出力 ----
        document.getElementById('export-cocofolia-btn').addEventListener('click', () => {
            const getV  = id => parseInt(document.getElementById(id).textContent) || 0;
            const sName = document.getElementById('char-style').value;
            const pName = document.getElementById('primary-root').value;
            const secon = document.getElementById('secondary-root').value;
            const tName = document.getElementById('tertiary-root').value;
            const charName   = document.getElementById('char-name').value || '名無し';
            const playerName = document.getElementById('player-name').value || '';

            let memo = `PL: ${playerName}\n[スタイル] ${sName}\n[プライマリ] ${pName} [セカンダリ] ${secon}`;
            if (tName) memo += ` [ターシャリ] ${tName}`;
            memo += `\n消費経験点: ${document.getElementById('total-xp-used').textContent}\n\n-- アーツ --\n`;
            acquiredArts.forEach(a => { memo += `・${a['アーツ名']} (LV${a._currentLevel||1} / ${a._rt||a['ルーツ']}) - ${a['効果']}\n`; });
            memo += `\n-- 備品 --\n`;
            acquiredWeapons.forEach(w => memo += `・${w._equivalentName || w['装備名']} [{${w['種別']}} 命:${w['命中']} 攻:${w['攻撃力']}] ${w['効果']}\n`);
            acquiredArmor.forEach(a  => memo += `・${a._equivalentName || a['装備名']} [ドッジ:${a['ドッジ']} 行動:${a['行動値']}] ${a['効果']}\n`);

            const cc = {
                kind: 'character',
                data: {
                    name: charName, memo,
                    initiative: getV('stat-action'),
                    externalUrl: '',
                    status: [
                        { label: 'FP',   value: getV('stat-fp'),       max: getV('stat-fp') },
                        { label: '人間性', value: getV('stat-humanity'), max: 100 },
                        { label: '愛',   value: 0, max: 0 },
                        { label: '罪',   value: 0, max: 0 },
                        { label: '白兵', value: String(getV('stat-melee')) },
                        { label: '射撃', value: String(getV('stat-ranged')) },
                        { label: '回避', value: String(getV('stat-dodge')) },
                        { label: '行動', value: String(getV('stat-action')) },
                    ],
                    commands: '1D6\n2D6\n\n//---------- アーツ ----------\n' +
                        acquiredArts.map(a => `${a['アーツ名']} 【${a['タイミング']}】対象:${a['対象']} / 代償:${a['コスト']} / 判定:${a['判定値']} / ${a['効果']}`).join('\n'),
                },
            };

            navigator.clipboard.writeText(JSON.stringify(cc))
                .then(() => alert('ココフォリア用のコマデータをクリップボードにコピーしました！'))
                .catch(() => alert('コピーに失敗しました。'));
        });

        // ---- 顔アイコン処理 ----
        const faceContainer = document.getElementById('face-icon-container');
        const faceUpload    = document.getElementById('face-icon-upload');
        const facePlaceholder = document.getElementById('face-icon-placeholder');
        const facePreview   = document.getElementById('face-icon-preview');
        const faceView      = document.getElementById('face-icon-view');
        const faceClearBtn  = document.getElementById('clear-face-icon');

        if (faceContainer) {
            faceContainer.addEventListener('click', () => faceUpload.click());
            faceUpload.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                const img = new Image();
                const url = URL.createObjectURL(file);
                img.onload = () => {
                    const SIZE = 54;
                    const canvas = document.createElement('canvas');
                    canvas.width = SIZE; canvas.height = SIZE;
                    const ctx = canvas.getContext('2d');
                    const sq = Math.min(img.width, img.height);
                    const sx = (img.width - sq) / 2, sy = (img.height - sq) / 2;
                    ctx.drawImage(img, sx, sy, sq, sq, 0, 0, SIZE, SIZE);
                    charData.faceIcon = canvas.toDataURL('image/jpeg', 0.9);
                    facePreview.src = charData.faceIcon;
                    facePreview.style.display = 'block';
                    facePlaceholder.style.display = 'none';
                    faceClearBtn.style.display = '';
                    if (faceView) { faceView.src = charData.faceIcon; }
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            });
            faceClearBtn.addEventListener('click', e => {
                e.stopPropagation();
                charData.faceIcon = null;
                facePreview.src = ''; facePreview.style.display = 'none';
                facePlaceholder.style.display = '';
                faceClearBtn.style.display = 'none';
                if (faceView) faceView.style.display = 'none';
                faceUpload.value = '';
            });
        }

        // ---- Firebase 保存ボタン ----
        const saveBtn = document.getElementById('save-firebase-btn');
        if (saveBtn) {
            const fbReady = typeof window.bbFirebase !== 'undefined' && window.bbFirebase.init();
            if (!fbReady) {
                saveBtn.title = 'Firebase未設定のため無効';
                saveBtn.style.opacity = '0.4';
                saveBtn.style.cursor = 'not-allowed';
            }
            saveBtn.addEventListener('click', async () => {
                if (!fbReady) { alert('Firebase が設定されていません。js/firebase-config.js を確認してください。'); return; }
                saveBtn.textContent = '保存中...';
                saveBtn.disabled = true;
                try {
                    const pRoot = document.getElementById('primary-root').value;
                    const sRoot = document.getElementById('secondary-root').value;
                    const tRoot = document.getElementById('tertiary-root').value;
                    const summary = {
                        name:          document.getElementById('char-name').value || '名無し',
                        playerName:    document.getElementById('player-name').value || '',
                        style:         document.getElementById('char-style').value || '',
                        primaryRoot:   pRoot,
                        primaryBlood:  BBTData.getRoot(pRoot)?.['\u30d6\u30e9\u30c3\u30c9\u540d'] || '',
                        secondaryRoot: sRoot,
                        secondaryBlood:BBTData.getRoot(sRoot)?.['\u30d6\u30e9\u30c3\u30c9\u540d'] || '',
                        tertiaryRoot:  tRoot,
                        tertiaryBlood: BBTData.getRoot(tRoot)?.['\u30d6\u30e9\u30c3\u30c9\u540d'] || '',
                        xpUsed:        parseInt(document.getElementById('total-xp-used').textContent) || 0,
                        faceIcon:      charData.faceIcon || null,
                    };
                    const sheetData = getSheetState();
                    const newId = await window.bbFirebase.save(window.currentCharId, summary, sheetData);
                    if (!window.currentCharId) {
                        window.currentCharId = newId;
                        history.replaceState({}, '', `?id=${newId}`);
                    }
                    saveBtn.innerHTML = '\u2714 \u4fdd\u5b58\u6e08<br><span style="font-size:0.75rem;">(\u30af\u30e9\u30a6\u30c9)</span>';
                    saveBtn.style.background = '#388e3c';
                    setTimeout(() => {
                        saveBtn.innerHTML = '\u2601 \u4fdd\u5b58<br><span style="font-size:0.75rem;">(\u30af\u30e9\u30a6\u30c9)</span>';
                        saveBtn.style.background = '#4caf50';
                        saveBtn.disabled = false;
                    }, 2000);
                } catch (err) {
                    alert('保存に失敗しました: ' + err.message);
                    saveBtn.innerHTML = '\u2601 \u4fdd\u5b58<br><span style="font-size:0.75rem;">(\u30af\u30e9\u30a6\u30c9)</span>';
                    saveBtn.disabled = false;
                }
            });
        }

        // ---- URLパラメータでキャラ読み込み（ロビー経由なら閲覧モードで開く） ----
        if (window.currentCharId && typeof window.bbFirebase !== 'undefined' && window.bbFirebase.isReady()) {
            window.bbFirebase.load(window.currentCharId).then(data => {
                if (data.sheetData) restoreSheetState(data.sheetData);
                // ロビーから来た場合は閲覧モードで開く（パスワードチェック不要）
                // ※「編集したい場合は編集モードボタンを押してパスワードを入力」というUX
                setEditMode(false);
            }).catch(err => console.warn('キャラ読み込みエラー:', err));
        }

        // ---- 初期計算 ----
        calculateStats();
    }
});

// ---- シート状態の直列化 ----
function getSheetState() {
    const profileEls = document.querySelectorAll('.profile-input');
    const profileData = [];
    profileEls.forEach(el => profileData.push({ id: el.id || null, name: el.name || null, val: el.value }));

    const growth = {};
    ['body','tech','emo','div','soc','melee','ranged','dodge','action'].forEach(id => {
        const el = document.getElementById(`growth-${id}`);
        if (el) growth[id] = el.value;
    });

    const mods = {};
    ['body','tech','emo','div','soc','melee','ranged','dodge','action','armor','fp','humanity'].forEach(stat => {
        ['normal','beast'].forEach(mode => {
            const el = document.getElementById(`mod-${stat}-${mode}`);
            if (el) mods[`${stat}-${mode}`] = el.value;
        });
    });

    return {
        profileData,
        builds: {
            style:       document.getElementById('char-style').value,
            primaryRoot: document.getElementById('primary-root').value,
            secondaryRoot: document.getElementById('secondary-root').value,
            tertiaryRoot:  document.getElementById('tertiary-root').value,
            freeStat:    document.getElementById('free-stat').value,
            proficiency: document.querySelector('input[name="proficiency-choice"]:checked')?.value || 'primary',
        },
        tertiaryVisible: document.getElementById('tertiary-root-container')?.style.display !== 'none',
        growth,
        mods,
        arts:    acquiredArts.map(a => ({...a})),
        weapons: acquiredWeapons.map(w => ({...w})),
        armor:   acquiredArmor.map(a  => ({...a})),
        items:   acquiredItems.map(i  => ({...i})),
        images:  { image: charData.image, image2: charData.image2, faceIcon: charData.faceIcon },
        password: document.getElementById('char-password')?.value || '',
    };
}

// ---- シート状態の復元 ----
function restoreSheetState(state) {
    if (!state) return;

    // プロフィールフィールド復元
    if (state.profileData) {
        const els = document.querySelectorAll('.profile-input');
        state.profileData.forEach((saved, i) => {
            if (els[i]) els[i].value = saved.val;
        });
    }

    // ビルド設定
    if (state.builds) {
        const { style, primaryRoot, secondaryRoot, tertiaryRoot, freeStat, proficiency } = state.builds;
        if (style) document.getElementById('char-style').value = style;
        if (primaryRoot) document.getElementById('primary-root').value = primaryRoot;
        if (secondaryRoot) document.getElementById('secondary-root').value = secondaryRoot;
        if (tertiaryRoot) {
            document.getElementById('tertiary-root').value = tertiaryRoot;
            if (state.tertiaryVisible) {
                document.getElementById('tertiary-root-container').style.display = 'block';
                document.getElementById('add-tertiary-container').style.display = 'none';
            }
        }
        if (freeStat) document.getElementById('free-stat').value = freeStat;
        const radio = document.querySelector(`input[name="proficiency-choice"][value="${proficiency || 'primary'}"]`);
        if (radio) radio.checked = true;
    }

    // 成長値
    if (state.growth) {
        Object.entries(state.growth).forEach(([id, v]) => {
            const el = document.getElementById(`growth-${id}`);
            if (el) el.value = v;
        });
    }

    // 手動補正
    if (state.mods) {
        Object.entries(state.mods).forEach(([key, v]) => {
            const el = document.getElementById(`mod-${key}`);
            if (el) el.value = v;
        });
    }

    // 画像
    if (state.images) {
        if (state.images.faceIcon) {
            charData.faceIcon = state.images.faceIcon;
            const fp = document.getElementById('face-icon-preview');
            const ph = document.getElementById('face-icon-placeholder');
            const cb = document.getElementById('clear-face-icon');
            const fv = document.getElementById('face-icon-view');
            if (fp) { fp.src = charData.faceIcon; fp.style.display = 'block'; }
            if (ph) ph.style.display = 'none';
            if (cb) cb.style.display = '';
            if (fv) { fv.src = charData.faceIcon; fv.style.display = 'block'; }
        }
        ['image','image2'].forEach(key => {
            if (!state.images[key]) return;
            charData[key] = state.images[key];
            const sfx = key === 'image' ? '' : '2';
            const pv = document.getElementById(`char-image-preview${sfx}`);
            const pl = document.getElementById(`char-image-placeholder${sfx}`);
            const cl = document.getElementById(`clear-image-btn${sfx}`);
            if (pv) { pv.src = charData[key]; pv.style.display = 'block'; }
            if (pl) pl.style.display = 'none';
            if (cl) cl.style.display = 'block';
        });
    }

    // アーツ復元
    window.acquiredArts = (state.arts || []).map(a => ({...a}));
    renderArtsTable();

    // 装備復元
    ['weapons','armor','items'].forEach(type => {
        (state[type] || []).forEach(item => addEquipToTable(item, type === 'weapons' ? 'weapons' : type === 'armor' ? 'armor' : 'items'));
    });

    // パスワード
    if (state.password) {
        const pw = document.getElementById('char-password');
        if (pw) pw.value = state.password;
    }

    calculateStats();
}

window.getSheetState     = getSheetState;
window.restoreSheetState = restoreSheetState;

// ====================================================================
// 閲覧モードオーバーレイ構築
// ====================================================================
function buildAndShowViewOverlay() {
    const ov = document.getElementById('view-mode-overlay');
    if (!ov) return;

    const g = id => document.getElementById(id);
    const gVal = id => { const e = g(id); return e ? e.value || '' : ''; };
    const gTxt = id => { const e = g(id); return e ? (e.textContent || '').trim() : ''; };

    // -- スタイル情報 --
    const style = gVal('char-style') || '';
    const STYLE_MAP = { 'アタッカー': 'ATK', 'ディフェンダー': 'DEF', 'サポーター': 'SUP' };
    const styleBadge = STYLE_MAP[style] || style.slice(0,3).toUpperCase() || '---';
    ov.setAttribute('data-vmo-style', style);

    // -- バッジ・名前 --
    const badge = g('vmo-style-badge');
    if (badge) badge.textContent = styleBadge;

    const pRoot = gVal('primary-root');
    const pBlood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(pRoot)?.['ブラッド名'] || '') : '';
    const bloodLabel = g('vmo-blood-label');
    if (bloodLabel) bloodLabel.textContent = pBlood;

    const nameEl = g('vmo-char-name');
    if (nameEl) nameEl.textContent = gVal('char-name') || '名無し';
    const demonEl = g('vmo-demon-name');
    if (demonEl) { const dn = gVal('char-demon-name'); demonEl.textContent = dn ? `【${dn}】` : ''; }
    const playerEl = g('vmo-player-name');
    if (playerEl) { const pn = gVal('player-name'); playerEl.textContent = pn ? `PL: ${pn}` : ''; }

    // -- キャラ画像 --
    const artEl = g('vmo-char-art');
    if (artEl) {
        const src = (window.isBeastMode && charData.image2) ? charData.image2 : charData.image;
        artEl.src = src || '';
        artEl.style.display = src ? 'block' : 'none';
    }

    // -- ルーツパネル --
    const rootsPanel = g('vmo-roots-panel');
    if (rootsPanel) {
        rootsPanel.innerHTML = '';
        const sRoot = gVal('secondary-root');
        const tRoot = gVal('tertiary-root');
        [[pRoot,'プライマリ'],[sRoot,'セカンダリ'],[tRoot,'ターシャリ']].forEach(([r, role]) => {
            if (!r) return;
            const blood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(r)?.['ブラッド名'] || '') : '';
            const tag = document.createElement('div');
            tag.className = 'vmo-root-tag';
            tag.innerHTML = `<small>${role}</small> <strong>${blood ? blood + '/' : ''}${r}</strong>`;
            rootsPanel.appendChild(tag);
        });
    }

    // -- 基本情報 --
    const profileGrid = g('vmo-profile-grid');
    if (profileGrid) {
        profileGrid.innerHTML = '';
        const PROFILE_FIELDS = [
            { label: '設定的種族', inputId: null, selector: '#char-race' },
            { label: '年齢',       inputId: null, selector: '#char-age' },
            { label: '性別',       inputId: null, selector: '#char-gender' },
            { label: 'カヴァー',   inputId: null, selector: '#char-cover' },
            { label: '出自',       inputId: null, selector: '#char-origin' },
            { label: '邂逅',       inputId: null, selector: '#char-encounter' },
        ];
        // .profile-input を順番に取得（id付きを除く汎用フィールド）
        const profileEls = Array.from(document.querySelectorAll('.profile-input'))
            .filter(el => !['char-name','char-demon-name','player-name','char-style',
                            'primary-root','secondary-root','tertiary-root','free-stat'].includes(el.id));
        const LABEL_MAP = ['設定的種族','年齢','性別','カヴァー','出自','邂逅','外見的特徴'];
        profileEls.slice(0, 7).forEach((el, i) => {
            if (!el.value) return;
            const row = document.createElement('div');
            row.className = 'vmo-pf-row';
            row.innerHTML = `<span class="vmo-pf-label">${LABEL_MAP[i] || ''}</span><span class="vmo-pf-val">${el.value}</span>`;
            profileGrid.appendChild(row);
        });
        // 経験点
        const xpRow = document.createElement('div');
        xpRow.className = 'vmo-pf-row';
        xpRow.innerHTML = `<span class="vmo-pf-label">消費経験点</span><span class="vmo-pf-val">${gTxt('total-xp-used')}</span>`;
        profileGrid.appendChild(xpRow);
    }

    // -- 能力値パネル --
    const statsWrap = g('vmo-stats-wrap');
    if (statsWrap) {
        statsWrap.innerHTML = '';
        const STATS = [
            { id: 'stat-fp',       name: 'FP',   hi: true },
            { id: 'stat-humanity', name: '人間性', hi: true },
            { id: 'stat-body',     name: '肉体',  hi: false },
            { id: 'stat-tech',     name: '技術',  hi: false },
            { id: 'stat-emo',      name: '感情',  hi: false },
            { id: 'stat-div',      name: '加護',  hi: false },
            { id: 'stat-soc',      name: '社会',  hi: false },
            { id: 'stat-melee',    name: '白兵',  hi: false },
            { id: 'stat-ranged',   name: '射撃',  hi: false },
            { id: 'stat-dodge',    name: '回避',  hi: false },
            { id: 'stat-action',   name: '行動値', hi: false },
            { id: 'stat-armor',    name: 'アーマー', hi: false },
        ];
        STATS.forEach(s => {
            const val = gTxt(s.id);
            const card = document.createElement('div');
            card.className = 'vmo-stat-card' + (s.hi ? ' highlight' : '');
            card.innerHTML = `<div class="vmo-stat-name">${s.name}</div><div class="vmo-stat-val">${val || '0'}</div>`;
            statsWrap.appendChild(card);
        });
    }

    // -- アーツリスト --
    const artsList = g('vmo-arts-list');
    if (artsList) {
        artsList.innerHTML = '';
        (window.acquiredArts || []).forEach(art => {
            const row = document.createElement('div');
            row.className = 'vmo-art-row';
            const cost = art._overrideCost !== undefined ? art._overrideCost : (art['コスト'] || '-');
            const lv   = art._currentLevel !== undefined ? art._currentLevel : 1;
            row.innerHTML = `
                <div>
                    <div class="vmo-art-name">${art['アーツ名']} <small class="vmo-art-sub">Lv${lv} / ${art['最大Lv'] || '?'}</small></div>
                    <div class="vmo-art-sub">${art._rt || art['ルーツ'] || ''} / ${art['種別'] || ''}</div>
                </div>
                <div class="vmo-art-timing">${art['タイミング'] || '-'}</div>
                <div class="vmo-art-cost">代償: ${cost}</div>
                <div class="vmo-art-effect">${art['効果'] || ''}</div>
            `;
            artsList.appendChild(row);
        });
        const artsSection = g('vmo-arts-section');
        if (artsSection) artsSection.style.display = (window.acquiredArts||[]).length ? '' : 'none';
    }

    // -- 装備リスト --
    const equipList = g('vmo-equip-list');
    if (equipList) {
        equipList.innerHTML = '';
        const allEquip = [
            ...(window.acquiredWeapons||[]).map(w => ({ name: w._equivalentName || w['装備名'], sub: w['種別'], eff: w['効果'] })),
            ...(window.acquiredArmor||[]).map(a  => ({ name: a._equivalentName || a['装備名'], sub: '防具',       eff: a['効果'] })),
            ...(window.acquiredItems||[]).map(i  => ({ name: i._equivalentName || i['装備名'], sub: i['種別'],    eff: i['効果'] })),
        ];
        allEquip.forEach(eq => {
            const row = document.createElement('div');
            row.className = 'vmo-equip-row';
            row.innerHTML = `<span class="vmo-equip-name">${eq.name || '-'}</span><span class="vmo-equip-sub">${eq.sub || ''}</span><span class="vmo-equip-effect">${eq.eff || ''}</span>`;
            equipList.appendChild(row);
        });
        const equipSection = g('vmo-equip-section');
        if (equipSection) equipSection.style.display = allEquip.length ? '' : 'none';
    }

    // -- キャラ設定 --
    const lore = document.querySelector('textarea.profile-input');
    const loreSection = g('vmo-lore-section');
    const loreText    = g('vmo-lore-text');
    if (lore && loreSection && loreText && lore.value) {
        loreText.textContent = lore.value;
        loreSection.style.display = '';
    }

    // テーマボタン同期
    const vmoThemeBtn = g('vmo-theme-btn');
    if (vmoThemeBtn) {
        const mainTheme = g('theme-toggle');
        vmoThemeBtn.textContent = mainTheme ? mainTheme.textContent : '🌙';
        vmoThemeBtn.onclick = () => { g('theme-toggle')?.click(); vmoThemeBtn.textContent = g('theme-toggle')?.textContent || ''; };
    }

    ov.style.display = 'flex';
}

window.buildAndShowViewOverlay = buildAndShowViewOverlay;

