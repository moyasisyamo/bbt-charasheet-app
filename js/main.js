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
        window.charData    = { mods: {}, image: null, image2: null };
        window.isBeastMode = false;
        window.isEditMode  = true;

        // ---- テーマ切り替え ----
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            themeBtn.textContent = isDark ? '🌙 ダークモード' : '☀️ ライトモード';
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
            // 常に表示するボタン
            ['close-arts-dictionary','close-equip-dictionary','beast-mode-btn'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = '';
            });
            if (edit) {
                toggleEditBtn.textContent = '🔒 閲覧モード（編集ロック）';
                toggleEditBtn.classList.replace('primary', 'warning');
            } else {
                toggleEditBtn.textContent = '🔓 編集モード';
                toggleEditBtn.classList.replace('warning', 'primary');
                const nameEl = document.getElementById('char-name');
                if (nameEl) { document.getElementById('view-char-name').textContent = nameEl.value || '-'; }
                const playerEl = document.getElementById('player-name');
                if (playerEl) { document.getElementById('view-player-name').textContent = playerEl.value || '-'; }
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

        // ---- 初期計算 ----
        calculateStats();
    }
});
