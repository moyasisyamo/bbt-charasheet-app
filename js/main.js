/**
 * main.js (繧ｨ繝ｳ繝医Μ繝ｼ繝昴う繝ｳ繝・
 * 繧｢繝励Μ蛻晄悄蛹悶・UI繧ｻ繝・ヨ繧｢繝・・繝ｻ繧､繝吶Φ繝医ヰ繧､繝ｳ繝峨ｒ諡・ｽ薙☆繧九・ * 螳滄圀縺ｮ險育ｮ怜・逅・・ stats.js縲√い繝ｼ繝・・ arts.js縲∬｣・ｙ縺ｯ equipment.js 縺ｫ蟋碑ｭｲ縲・ * 繝・・繧ｿ隱ｭ縺ｿ霎ｼ縺ｿ縺ｯ loader.js 縺ｫ蟋碑ｭｲ縲・ */
document.addEventListener('DOMContentLoaded', () => {

    // ---- 繝ｭ繝ｼ繝・ぅ繝ｳ繧ｰ逕ｻ髱｢陦ｨ遉ｺ ----
    const appContainer = document.querySelector('.app-container');
    const loader = document.createElement('div');
    loader.id = 'app-loader';
    loader.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-color);">
            <div style="font-size: 3rem; margin-bottom: 20px;">笞・/div>
            <div style="font-size: 1.2rem; margin-bottom: 10px;">繝・・繧ｿ繧定ｪｭ縺ｿ霎ｼ繧薙〒縺・∪縺・..</div>
            <div id="loader-detail" style="font-size: 0.85rem; color: var(--text-muted);">CSV繝輔ぃ繧､繝ｫ繧貞叙蠕嶺ｸｭ</div>
        </div>`;
    loader.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-color);z-index:9999;';
    document.body.appendChild(loader);

    // ---- 繝・・繧ｿ繝ｭ繝ｼ繝・竊・繧｢繝励Μ蛻晄悄蛹・----
    loadAllData(
        () => { // 謌仙粥
            loader.remove();
            initApp();
        },
        (err) => { // 螟ｱ謨・            const msg = `縲舌お繝ｩ繝ｼ縲代ョ繝ｼ繧ｿCSV縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・n\n繝ｭ繝ｼ繧ｫ繝ｫ繧ｵ繝ｼ繝舌・邨檎罰縺ｧ繧｢繧ｯ繧ｻ繧ｹ縺励※縺・ｋ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・n  萓・ npx serve .\n\n隧ｳ邏ｰ: ${err.message}`;
            loader.innerHTML = `<div style="padding:20px;color:#ff5277;max-width:600px;text-align:left;">
                <h2>笞 繝・・繧ｿ隱ｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ</h2>
                <pre style="white-space:pre-wrap;line-height:1.6;">${msg}</pre>
            </div>`;
        }
    );

    // ====================================================================
    // 繧｢繝励Μ譛ｬ菴灘・譛溷喧
    // ====================================================================
    function initApp() {

        // ---- 繧ｰ繝ｭ繝ｼ繝舌Ν迥ｶ諷・----
        window.charData    = { mods: {}, image: null, image2: null, faceIcon: null };
        window.isBeastMode = false;
        window.isEditMode  = true;
        window.currentCharId = new URLSearchParams(location.search).get('id') || null;

        // ---- 繝・・繝槫・繧頑崛縺・----
        const themeBtn = document.getElementById('theme-toggle');
        // 蛻晄悄繝・・繝槭ｒ localStorage 縺九ｉ蠕ｩ蜈・        const savedTheme = localStorage.getItem('bbt-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeBtn.textContent = savedTheme === 'dark' ? '笘・・繝ｩ繧､繝医Δ繝ｼ繝・ : '嫌 繝繝ｼ繧ｯ繝｢繝ｼ繝・;
        themeBtn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('bbt-theme', next);
            themeBtn.textContent = next === 'dark' ? '笘・・繝ｩ繧､繝医Δ繝ｼ繝・ : '嫌 繝繝ｼ繧ｯ繝｢繝ｼ繝・;
        });

        // ---- 邱ｨ髮・Δ繝ｼ繝牙・繧頑崛縺・----
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

            // 髦ｲ蜈ｷ繝√ぉ繝・け繝懊ャ繧ｯ繧ｹ繧帝夢隕ｧ譎ゅ・謫堺ｽ應ｸ榊庄
            document.querySelectorAll('.normal-equip-check, .beast-equip-check').forEach(cb => {
                cb.disabled = !edit;
                cb.style.cursor = edit ? '' : 'not-allowed';
            });

            // 髢ｲ隕ｧ譎ゅ・繧｢繝ｼ繝・悟炎髯､縲阪・陬・ｙ縲梧桃菴懊榊・繝倥ャ繝繝ｼ繧帝撼陦ｨ遉ｺ
            const artsLastTh = document.querySelector('#arts-table thead tr th:last-child');
            if (artsLastTh) artsLastTh.style.visibility = edit ? '' : 'hidden';
            ['#weapons-table','#armor-table','#items-table'].forEach(sel => {
                const th = document.querySelector(sel + ' thead tr th:last-child');
                if (th) th.style.visibility = edit ? '' : 'hidden';
            });

            if (edit) {
                toggleEditBtn.innerHTML = '白 髢ｲ隕ｧ繝｢繝ｼ繝・br><span style="font-size:0.75rem;">(邱ｨ髮・Ο繝・け)</span>';
                toggleEditBtn.classList.replace('primary', 'warning');
                const ov = document.getElementById('view-mode-overlay');
                if (ov) ov.style.display = 'none';
            } else {
                toggleEditBtn.innerHTML = '箔 邱ｨ髮・Δ繝ｼ繝・;
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
                if (!passwordInput.value) { alert('邱ｨ髮・ｒ繝ｭ繝・け縺吶ｋ縺ｫ縺ｯ繝代せ繝ｯ繝ｼ繝峨ｒ險ｭ螳壹＠縺ｦ縺上□縺輔＞縲・); return; }
                setEditMode(false);
            } else {
                const pass = prompt('邱ｨ髮・Δ繝ｼ繝峨↓縺吶ｋ縺溘ａ縺ｮ繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞:');
                if (pass === passwordInput.value) { setEditMode(true); }
                else if (pass !== null) { alert('繝代せ繝ｯ繝ｼ繝峨′驕輔＞縺ｾ縺吶・); }
            }
        });

        // ---- 繧ｻ繝ｬ繧ｯ繧ｿ繝ｼ蛻晄悄蛹・----
        const styleSelect         = document.getElementById('char-style');
        const primaryRootSelect   = document.getElementById('primary-root');
        const secondaryRootSelect = document.getElementById('secondary-root');

        BBTData.styles.forEach(s => {
            if (s['繧ｹ繧ｿ繧､繝ｫ蜷・] === '縺ｪ縺・) return;
            const opt = document.createElement('option');
            opt.value = opt.textContent = s['繧ｹ繧ｿ繧､繝ｫ蜷・];
            styleSelect.appendChild(opt);
        });
        BBTData.roots.forEach(root => {
            const rn = root['繝ｫ繝ｼ繝・錐'], bn = root['繝悶Λ繝・ラ蜷・];
            if (rn === '縺ｪ縺・) return;
            ['primary-root','secondary-root','tertiary-root'].forEach(id => {
                const opt = document.createElement('option');
                opt.value = rn; opt.textContent = `[${bn}] ${rn}`;
                document.getElementById(id).appendChild(opt);
            });
        });

        // ---- 鬲皮坤蛹門・繧頑崛縺・----
        const beastBtn      = document.getElementById('beast-mode-btn');
        const adjLabel      = document.getElementById('adj-state-label');
        const normalAdjGrid = document.getElementById('normal-adj-grid');
        const beastAdjGrid  = document.getElementById('beast-adj-grid');

        beastBtn.addEventListener('click', () => {
            window.isBeastMode = !window.isBeastMode;
            if (window.isBeastMode) {
                beastBtn.textContent = '閥 騾壼ｸｸ蛻・ｊ譖ｿ縺・;
                beastBtn.classList.replace('exception-btn', 'primary');
                document.documentElement.classList.add('beast-mode-active');
                adjLabel.textContent = '(鬲皮坤蛹紋ｸｭ)'; adjLabel.style.color = 'var(--primary-color)';
                normalAdjGrid.style.display = 'none'; beastAdjGrid.style.display = 'block';
            } else {
                beastBtn.textContent = '声 鬲皮坤蛹門・繧頑崛縺・;
                beastBtn.classList.replace('primary', 'exception-btn');
                document.documentElement.classList.remove('beast-mode-active');
                adjLabel.textContent = '(騾壼ｸｸ)'; adjLabel.style.color = 'var(--text-muted)';
                normalAdjGrid.style.display = 'block'; beastAdjGrid.style.display = 'none';
            }
            calculateStats();
        });

        // ---- 繧ｿ繝ｼ繧ｷ繝｣繝ｪ繝ｫ繝ｼ繝・ｿｽ蜉繝懊ち繝ｳ ----
        document.getElementById('add-tertiary-btn').addEventListener('click', () => {
            document.getElementById('tertiary-root-container').style.display = 'block';
            document.getElementById('add-tertiary-container').style.display = 'none';
        });

        // ---- 險育ｮ励ヨ繝ｪ繧ｬ繝ｼ ----
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

        // ---- 繝励Ο繝輔ぅ繝ｼ繝ｫ蜈･蜉・竊・繝薙Η繝ｼ蜷梧悄 ----
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

        // ---- 繧｢繝ｼ繝・・陬・ｙ繝｢繧ｸ繝･繝ｼ繝ｫ蛻晄悄蛹・----
        initArtsDictionary();
        initEquipDictionary();

        // ---- 逕ｻ蜒上い繝・・繝ｭ繝ｼ繝・----
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

        // ---- 繧ｳ繧ｳ繝輔か繝ｪ繧｢蜃ｺ蜉・----
        document.getElementById('export-cocofolia-btn').addEventListener('click', () => {
            const getV  = id => parseInt(document.getElementById(id).textContent) || 0;
            const sName = document.getElementById('char-style').value;
            const pName = document.getElementById('primary-root').value;
            const secon = document.getElementById('secondary-root').value;
            const tName = document.getElementById('tertiary-root').value;
            const charName   = document.getElementById('char-name').value || '蜷咲┌縺・;
            const playerName = document.getElementById('player-name').value || '';

            let memo = `PL: ${playerName}\n[繧ｹ繧ｿ繧､繝ｫ] ${sName}\n[繝励Λ繧､繝槭Μ] ${pName} [繧ｻ繧ｫ繝ｳ繝繝ｪ] ${secon}`;
            if (tName) memo += ` [繧ｿ繝ｼ繧ｷ繝｣繝ｪ] ${tName}`;
            memo += `\n豸郁ｲｻ邨碁ｨ鍋せ: ${document.getElementById('total-xp-used').textContent}\n\n-- 繧｢繝ｼ繝・--\n`;
            acquiredArts.forEach(a => { memo += `繝ｻ${a['繧｢繝ｼ繝・錐']} (LV${a._currentLevel||1} / ${a._rt||a['繝ｫ繝ｼ繝・]}) - ${a['蜉ｹ譫・]}\n`; });
            memo += `\n-- 蛯吝刀 --\n`;
            acquiredWeapons.forEach(w => memo += `繝ｻ${w._equivalentName || w['陬・ｙ蜷・]} [{${w['遞ｮ蛻･']}} 蜻ｽ:${w['蜻ｽ荳ｭ']} 謾ｻ:${w['謾ｻ謦・鴨']}] ${w['蜉ｹ譫・]}\n`);
            acquiredArmor.forEach(a  => memo += `繝ｻ${a._equivalentName || a['陬・ｙ蜷・]} [繝峨ャ繧ｸ:${a['繝峨ャ繧ｸ']} 陦悟虚:${a['陦悟虚蛟､']}] ${a['蜉ｹ譫・]}\n`);

            const cc = {
                kind: 'character',
                data: {
                    name: charName, memo,
                    initiative: getV('stat-action'),
                    externalUrl: '',
                    status: [
                        { label: 'FP',   value: getV('stat-fp'),       max: getV('stat-fp') },
                        { label: '莠ｺ髢捺ｧ', value: getV('stat-humanity'), max: 100 },
                        { label: '諢・,   value: 0, max: 0 },
                        { label: '鄂ｪ',   value: 0, max: 0 },
                        { label: '逋ｽ蜈ｵ', value: String(getV('stat-melee')) },
                        { label: '蟆・茶', value: String(getV('stat-ranged')) },
                        { label: '蝗樣∩', value: String(getV('stat-dodge')) },
                        { label: '陦悟虚', value: String(getV('stat-action')) },
                    ],
                    commands: '1D6\n2D6\n\n//---------- 繧｢繝ｼ繝・----------\n' +
                        acquiredArts.map(a => `${a['繧｢繝ｼ繝・錐']} 縲・{a['繧ｿ繧､繝溘Φ繧ｰ']}縲大ｯｾ雎｡:${a['蟇ｾ雎｡']} / 莉｣蜆・${a['繧ｳ繧ｹ繝・]} / 蛻､螳・${a['蛻､螳壼､']} / ${a['蜉ｹ譫・]}`).join('\n'),
                },
            };

            navigator.clipboard.writeText(JSON.stringify(cc))
                .then(() => alert('繧ｳ繧ｳ繝輔か繝ｪ繧｢逕ｨ縺ｮ繧ｳ繝槭ョ繝ｼ繧ｿ繧偵け繝ｪ繝・・繝懊・繝峨↓繧ｳ繝斐・縺励∪縺励◆・・))
                .catch(() => alert('繧ｳ繝斐・縺ｫ螟ｱ謨励＠縺ｾ縺励◆縲・));
        });

        // ---- 鬘斐い繧､繧ｳ繝ｳ蜃ｦ逅・----
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

        // ---- Firebase 菫晏ｭ倥・繧ｿ繝ｳ ----
        const saveBtn = document.getElementById('save-firebase-btn');
        if (saveBtn) {
            const fbReady = typeof window.bbFirebase !== 'undefined' && window.bbFirebase.init();
            if (!fbReady) {
                saveBtn.title = 'Firebase譛ｪ險ｭ螳壹・縺溘ａ辟｡蜉ｹ';
                saveBtn.style.opacity = '0.4';
                saveBtn.style.cursor = 'not-allowed';
            }
            saveBtn.addEventListener('click', async () => {
                if (!fbReady) { alert('Firebase 縺瑚ｨｭ螳壹＆繧後※縺・∪縺帙ｓ縲Ｋs/firebase-config.js 繧堤｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・); return; }
                saveBtn.textContent = '菫晏ｭ倅ｸｭ...';
                saveBtn.disabled = true;
                try {
                    const pRoot = document.getElementById('primary-root').value;
                    const sRoot = document.getElementById('secondary-root').value;
                    const tRoot = document.getElementById('tertiary-root').value;
                    const summary = {
                        name:          document.getElementById('char-name').value || '蜷咲┌縺・,
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
                    alert('菫晏ｭ倥↓螟ｱ謨励＠縺ｾ縺励◆: ' + err.message);
                    saveBtn.innerHTML = '\u2601 \u4fdd\u5b58<br><span style="font-size:0.75rem;">(\u30af\u30e9\u30a6\u30c9)</span>';
                    saveBtn.disabled = false;
                }
            });
        }

        // ---- URL繝代Λ繝｡繝ｼ繧ｿ縺ｧ繧ｭ繝｣繝ｩ隱ｭ縺ｿ霎ｼ縺ｿ・医Ο繝薙・邨檎罰縺ｪ繧蛾夢隕ｧ繝｢繝ｼ繝峨〒髢九￥・・----
        if (window.currentCharId && typeof window.bbFirebase !== 'undefined' && window.bbFirebase.isReady()) {
            window.bbFirebase.load(window.currentCharId).then(data => {
                if (data.sheetData) restoreSheetState(data.sheetData);
                // 繝ｭ繝薙・縺九ｉ譚･縺溷ｴ蜷医・髢ｲ隕ｧ繝｢繝ｼ繝峨〒髢九￥・医ヱ繧ｹ繝ｯ繝ｼ繝峨メ繧ｧ繝・け荳崎ｦ・ｼ・                // 窶ｻ縲檎ｷｨ髮・＠縺溘＞蝣ｴ蜷医・邱ｨ髮・Δ繝ｼ繝峨・繧ｿ繝ｳ繧呈款縺励※繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙阪→縺・≧UX
                setEditMode(false);
            }).catch(err => console.warn('繧ｭ繝｣繝ｩ隱ｭ縺ｿ霎ｼ縺ｿ繧ｨ繝ｩ繝ｼ:', err));
        }

        // ---- 蛻晄悄險育ｮ・----
        calculateStats();
    }
});

// ---- 繧ｷ繝ｼ繝育憾諷九・逶ｴ蛻怜喧 ----
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

// ---- 繧ｷ繝ｼ繝育憾諷九・蠕ｩ蜈・----
function restoreSheetState(state) {
    if (!state) return;

    // 繝励Ο繝輔ぅ繝ｼ繝ｫ繝輔ぅ繝ｼ繝ｫ繝牙ｾｩ蜈・    if (state.profileData) {
        const els = document.querySelectorAll('.profile-input');
        state.profileData.forEach((saved, i) => {
            if (els[i]) els[i].value = saved.val;
        });
    }

    // 繝薙Ν繝芽ｨｭ螳・    if (state.builds) {
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

    // 謌宣聞蛟､
    if (state.growth) {
        Object.entries(state.growth).forEach(([id, v]) => {
            const el = document.getElementById(`growth-${id}`);
            if (el) el.value = v;
        });
    }

    // 謇句虚陬懈ｭ｣
    if (state.mods) {
        Object.entries(state.mods).forEach(([key, v]) => {
            const el = document.getElementById(`mod-${key}`);
            if (el) el.value = v;
        });
    }

    // 逕ｻ蜒・    if (state.images) {
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

    // 繧｢繝ｼ繝・ｾｩ蜈・    window.acquiredArts = (state.arts || []).map(a => ({...a}));
    renderArtsTable();

    // 陬・ｙ蠕ｩ蜈・    ['weapons','armor','items'].forEach(type => {
        (state[type] || []).forEach(item => addEquipToTable(item, type === 'weapons' ? 'weapons' : type === 'armor' ? 'armor' : 'items'));
    });

    // 繝代せ繝ｯ繝ｼ繝・    if (state.password) {
        const pw = document.getElementById('char-password');
        if (pw) pw.value = state.password;
    }

    calculateStats();
}

window.getSheetState     = getSheetState;
window.restoreSheetState = restoreSheetState;

// ====================================================================
// 髢ｲ隕ｧ繝｢繝ｼ繝峨が繝ｼ繝舌・繝ｬ繧､讒狗ｯ・// ====================================================================
function buildAndShowViewOverlay() {
    const ov = document.getElementById('view-mode-overlay');
    if (!ov) return;

    const g    = id => document.getElementById(id);
    const gVal = id => { const e = g(id); return e ? e.value || '' : ''; };
    const gTxt = id => { const e = g(id); return e ? (e.textContent || '').trim() : ''; };

    // -- 繝・・繝槫酔譛・& body 繧ｹ繧ｯ繝ｭ繝ｼ繝ｫ謚第ｭ｢ --
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.style.overflow = 'hidden';

    // -- 繧ｹ繧ｿ繧､繝ｫ諠・ｱ --
    const style = gVal('char-style') || '';
    const STYLE_MAP = { '繧｢繧ｿ繝・き繝ｼ': 'ATK', '繝・ぅ繝輔ぉ繝ｳ繝繝ｼ': 'DEF', '繧ｵ繝昴・繧ｿ繝ｼ': 'SUP' };
    const styleBadge = STYLE_MAP[style] || style.slice(0,3).toUpperCase() || '---';
    ov.setAttribute('data-vmo-style', style);

    // -- 繝舌ャ繧ｸ繝ｻ蜷榊燕 --
    const badge = g('vmo-style-badge');
    if (badge) badge.textContent = styleBadge;

    const pRoot  = gVal('primary-root');
    const pBlood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(pRoot)?.['繝悶Λ繝・ラ蜷・] || '') : '';
    const bloodLabel = g('vmo-blood-label');
    if (bloodLabel) bloodLabel.textContent = pBlood;

    const nameDisp = g('vmo-char-name-disp');
    if (nameDisp) nameDisp.textContent = gVal('char-name') || '蜷咲┌縺・;
    const demonDisp = g('vmo-demon-name-disp');
    if (demonDisp) { const dn = gVal('char-demon-name'); demonDisp.textContent = dn ? `縲・{dn}縲疏 : ''; }
    const playerDisp = g('vmo-player-name-disp');
    if (playerDisp) { const pn = gVal('player-name'); playerDisp.textContent = pn ? `PL: ${pn}` : ''; }

    // -- 邨碁ｨ鍋せ・亥ｷｦ繝代ロ繝ｫ・・-
    const xpVal = g('vmo-xp-val');
    if (xpVal) xpVal.textContent = gTxt('total-xp-used') || '0';

    // -- 繧ｭ繝｣繝ｩ逕ｻ蜒・--
    const artEl = g('vmo-char-art');
    if (artEl) {
        const src = (window.isBeastMode && charData.image2) ? charData.image2 : charData.image;
        artEl.src = src || '';
        artEl.style.display = src ? 'block' : 'none';
    }

    // -- 繝ｫ繝ｼ繝・ヱ繝阪Ν --
    const rootsPanel = g('vmo-roots-panel');
    if (rootsPanel) {
        rootsPanel.innerHTML = '';
        const sRoot = gVal('secondary-root');
        const tRoot = gVal('tertiary-root');
        [[pRoot,'繝励Λ繧､繝槭Μ'],[sRoot,'繧ｻ繧ｫ繝ｳ繝繝ｪ'],[tRoot,'繧ｿ繝ｼ繧ｷ繝｣繝ｪ']].forEach(([r, role]) => {
            if (!r) return;
            const blood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(r)?.['繝悶Λ繝・ラ蜷・] || '') : '';
            const tag = document.createElement('div');
            tag.className = 'vmo-root-tag';
            tag.innerHTML = `<small>${role}</small> <strong>${blood ? blood + '/' : ''}${r}</strong>`;
            rootsPanel.appendChild(tag);
        });
    }

    // -- 蝓ｺ譛ｬ諠・ｱ・・D縺ｪ縺・profile-input 繧帝・分縺ｫ蜿門ｾ暦ｼ・-
    // sheet.html縺ｮ鬆・ 險ｭ螳夂噪遞ｮ譌・蟷ｴ鮨｢,諤ｧ蛻･,繧ｫ繝ｴ繧｡繝ｼ,蜃ｺ閾ｪ,驍る・螟冶ｦ狗噪迚ｹ蠕ｴ,蛻晄悄邨・髢｢菫・螟臥焚隨ｬ荳谿ｵ髫・蛻晄悄邨・髢｢菫・螟臥焚隨ｬ莠梧ｮｵ髫・蛻晄悄繧ｨ繧ｴ,螟臥焚隨ｬ荳画ｮｵ髫・[繧ｭ繝｣繝ｩ險ｭ螳嗾extarea]
    const profileGrid = g('vmo-profile-grid');
    if (profileGrid) {
        profileGrid.innerHTML = '';
        const profileEls = Array.from(document.querySelectorAll('.profile-input'))
            .filter(el => !['char-name','char-demon-name','player-name','char-style',
                            'primary-root','secondary-root','tertiary-root','free-stat'].includes(el.id));

        const LABELS = [
            '險ｭ螳夂噪遞ｮ譌・,'蟷ｴ鮨｢','諤ｧ蛻･','繧ｫ繝ｴ繧｡繝ｼ','蜃ｺ閾ｪ','驍る・,'螟冶ｦ狗噪迚ｹ蠕ｴ',
            '蛻晄悄邨・,'髢｢菫・,'螟臥焚隨ｬ荳谿ｵ髫・,'蛻晄悄邨・ｼ・,'髢｢菫ゑｼ・,'螟臥焚隨ｬ莠梧ｮｵ髫・,
            '蛻晄悄繧ｨ繧ｴ','螟臥焚隨ｬ荳画ｮｵ髫・
        ];
        // 3谿ｵ繧ｰ繝ｪ繝・ラ縺ｧ陦ｨ遉ｺ
        const LAYOUT = [
            // [繧､繝ｳ繝・ャ繧ｯ繧ｹ髢句ｧ・ 蛻怜ｹ・け繝ｩ繧ｹ, 繝輔Ν繝ｭ繧ｦ]
            [0, 3, false], // 險ｭ螳夂噪遞ｮ譌上・蟷ｴ鮨｢繝ｻ諤ｧ蛻･
            [3, 2, false], // 繧ｫ繝ｴ繧｡繝ｼ繝ｻ螟冶ｦ狗噪迚ｹ蠕ｴ・・,6逡ｪ逶ｮ・・            [7, 3, false], // 蛻晄悄邨・・髢｢菫ゅ・螟臥焚隨ｬ荳谿ｵ髫・            [10,3, false], // 蛻晄悄邨・繝ｻ髢｢菫・繝ｻ螟臥焚隨ｬ莠梧ｮｵ髫・            [13,2, false], // 蛻晄悄繧ｨ繧ｴ繝ｻ螟臥焚隨ｬ荳画ｮｵ髫・        ];

        const addRow = (label, val, full=false) => {
            if (!val) return;
            const row = document.createElement('div');
            row.className = 'vmo-pf-row' + (full ? ' full-row' : '');
            row.innerHTML = `<span class="vmo-pf-label">${label}</span><span class="vmo-pf-val">${val}</span>`;
            profileGrid.appendChild(row);
        };

        // 險ｭ螳夂噪遞ｮ譌上・蟷ｴ鮨｢繝ｻ諤ｧ蛻･
        addRow('險ｭ螳夂噪遞ｮ譌・, profileEls[0]?.value);
        addRow('蟷ｴ鮨｢', profileEls[1]?.value);
        addRow('諤ｧ蛻･', profileEls[2]?.value);
        // 繧ｫ繝ｴ繧｡繝ｼ繝ｻ螟冶ｦ狗噪迚ｹ蠕ｴ
        addRow('繧ｫ繝ｴ繧｡繝ｼ', profileEls[3]?.value);
        addRow('螟冶ｦ狗噪迚ｹ蠕ｴ', profileEls[6]?.value); // 驍る・ｒ繧ｹ繧ｭ繝・・縺励※螟冶ｦ九→縺励※陦ｨ遉ｺ
        // 螟臥焚谿ｵ髫・        addRow('螟臥焚隨ｬ荳谿ｵ髫・, profileEls[9]?.value);
        addRow('螟臥焚隨ｬ莠梧ｮｵ髫・, profileEls[12]?.value);
        addRow('螟臥焚隨ｬ荳画ｮｵ髫・, profileEls[14]?.value);
        // 邨・・繧ｨ繧ｴ
        addRow('蛻晄悄邨・ｼ磯未菫ゑｼ・, profileEls[7]?.value && profileEls[8]?.value ? profileEls[7].value + '・・ + profileEls[8].value + '・・ : profileEls[7]?.value);
        addRow('蛻晄悄邨・ｼ抵ｼ磯未菫ゑｼ・, profileEls[10]?.value && profileEls[11]?.value ? profileEls[10].value + '・・ + profileEls[11].value + '・・ : profileEls[10]?.value);
        addRow('蛻晄悄繧ｨ繧ｴ', profileEls[13]?.value);
    }

    // -- 閭ｽ蜉帛､繝代ロ繝ｫ --
    // 陦ｨ遉ｺ蠖｢蠑・ 閭ｽ蜉帛､/繝懊・繝翫せ蛟､・・loor(閭ｽ蜉帛､/3)・・    const statsWrap = g('vmo-stats-wrap');
    if (statsWrap) {
        statsWrap.innerHTML = '';

        const makeRow = (cols, items) => {
            const row = document.createElement('div');
            row.className = `vmo-stats-row vmo-stats-row-${cols}`;
            items.forEach(s => {
                const rawVal = parseInt(gTxt(s.id)) || 0;
                const bonus = s.bonus ? Math.floor(rawVal / 3) : null;
                const card = document.createElement('div');
                card.className = 'vmo-stat-card' + (s.hi ? ' highlight' : '');
                const bonusHtml = bonus !== null
                    ? `<div class="vmo-stat-bonus">繝懊・繝翫せ ${bonus}</div>`
                    : '';
                card.innerHTML = `<div class="vmo-stat-name">${s.name}</div><div class="vmo-stat-val">${rawVal}</div>${bonusHtml}`;
                row.appendChild(card);
            });
            statsWrap.appendChild(row);
        };

        // 陦・: 閧我ｽ薙・謚陦薙・諢滓ュ繝ｻ蜉隴ｷ繝ｻ遉ｾ莨夲ｼ医・繝ｼ繝翫せ蛟､莉倥″・・        makeRow(5, [
            { id: 'stat-body',  name: '閧我ｽ・,  bonus: true },
            { id: 'stat-tech',  name: '謚陦・,  bonus: true },
            { id: 'stat-emo',   name: '諢滓ュ',  bonus: true },
            { id: 'stat-div',   name: '蜉隴ｷ',  bonus: true },
            { id: 'stat-soc',   name: '遉ｾ莨・,  bonus: true },
        ]);
        // 陦・: 逋ｽ蜈ｵ蛟､繝ｻ蟆・茶蛟､繝ｻ蝗樣∩蛟､繝ｻ陦悟虚蛟､
        makeRow(4, [
            { id: 'stat-melee',  name: '逋ｽ蜈ｵ蛟､'  },
            { id: 'stat-ranged', name: '蟆・茶蛟､'  },
            { id: 'stat-dodge',  name: '蝗樣∩蛟､'  },
            { id: 'stat-action', name: '陦悟虚蛟､'  },
        ]);
        // 陦・: FP繝ｻ莠ｺ髢捺ｧ・・arge highlight・・        makeRow(2, [
            { id: 'stat-fp',       name: 'FP',   hi: true },
            { id: 'stat-humanity', name: '莠ｺ髢捺ｧ', hi: true },
        ]);
    }

    // -- 繧｢繝ｼ繝・Μ繧ｹ繝・--
    const artsList = g('vmo-arts-list');
    if (artsList) {
        artsList.innerHTML = '';
        (window.acquiredArts || []).forEach(art => {
            const row = document.createElement('div');
            row.className = 'vmo-art-row';
            const cost = art._overrideCost !== undefined ? art._overrideCost : (art['繧ｳ繧ｹ繝・] || '-');
            const lv   = art._currentLevel !== undefined ? art._currentLevel : 1;
            row.innerHTML = `
                <div class="vmo-art-header">
                    <span class="vmo-art-name">${art['繧｢繝ｼ繝・錐']}</span>
                    <span class="vmo-art-sub">Lv${lv} / ${art['譛螟ｧLv'] || '?'} &nbsp; ${art._rt || art['繝ｫ繝ｼ繝・] || ''} / ${art['遞ｮ蛻･'] || ''}</span>
                    <span class="vmo-art-cost">繧ｳ繧ｹ繝・ ${cost}</span>
                </div>
                <div class="vmo-art-detail">
                    <span>繧ｿ繧､繝溘Φ繧ｰ: <strong>${art['繧ｿ繧､繝溘Φ繧ｰ'] || '-'}</strong></span>
                    <span>蛻､螳壼､: <strong>${art['蛻､螳壼､'] || '-'}</strong></span>
                    <span>蟇ｾ雎｡: <strong>${art['蟇ｾ雎｡'] || '-'}</strong></span>
                    <span>蟆・ｨ・ <strong>${art['蟆・ｨ・] || '-'}</strong></span>
                </div>
                <div class="vmo-art-effect">${art['蜉ｹ譫・] || ''}</div>
            `;
            artsList.appendChild(row);
        });
        const artsSection = g('vmo-arts-section');
        if (artsSection) artsSection.style.display = (window.acquiredArts||[]).length ? '' : 'none';
    }

    // -- 陬・ｙ繝ｪ繧ｹ繝茨ｼ郁・蜉帛､蜷ｫ繧・・-
    const equipList = g('vmo-equip-list');
    if (equipList) {
        equipList.innerHTML = '';
        // 豁ｦ蝎ｨ
        (window.acquiredWeapons||[]).forEach(w => {
            const row = document.createElement('div');
            row.className = 'vmo-equip-row';
            const name = w._equivalentName || w['陬・ｙ蜷・] || '-';
            const stats = [
                w['遞ｮ蛻･']  ? `遞ｮ蛻･: ${w['遞ｮ蛻･']}`   : '',
                w['蜻ｽ荳ｭ']  ? `蜻ｽ荳ｭ: ${w['蜻ｽ荳ｭ']}`   : '',
                w['謾ｻ謦・鴨'] ? `謾ｻ謦・鴨: ${w['謾ｻ謦・鴨']}` : '',
                w['蟆・ｨ・]  ? `蟆・ｨ・ ${w['蟆・ｨ・]}`   : '',
            ].filter(Boolean).join(' ・・');
            row.innerHTML = `
                <div class="vmo-equip-header">
                    <span class="vmo-equip-name">${name}</span>
                    <span class="vmo-equip-type">豁ｦ蝎ｨ</span>
                </div>
                ${stats ? `<div class="vmo-equip-stats">${stats}</div>` : ''}
                ${w['蜉ｹ譫・] ? `<div class="vmo-equip-effect">${w['蜉ｹ譫・]}</div>` : ''}
            `;
            equipList.appendChild(row);
        });
        // 髦ｲ蜈ｷ
        (window.acquiredArmor||[]).forEach(a => {
            const row = document.createElement('div');
            row.className = 'vmo-equip-row';
            const name = a._equivalentName || a['陬・ｙ蜷・] || '-';
            const isNorm  = a._normalEquip;
            const isBeast = a._beastEquip;
            const equipped = isNorm ? '縲宣壼ｸｸ譎り｣・ｙ縲・ : (isBeast ? '縲宣ｭ皮坤蛹冶｣・ｙ縲・ : '');
            const stats = [
                a['繝峨ャ繧ｸ']  ? `蝗樣∩: ${a['繝峨ャ繧ｸ']}` : '',
                a['陦悟虚蛟､']  ? `陦悟虚: ${a['陦悟虚蛟､']}` : '',
                a['A蛟､'] && a['A蛟､'] !== '0' ? `A蛟､: ${a['A蛟､']}` : '',
                a['G蛟､'] && a['G蛟､'] !== '0' ? `G蛟､: ${a['G蛟､']}` : '',
            ].filter(Boolean).join(' ・・');
            row.innerHTML = `
                <div class="vmo-equip-header">
                    <span class="vmo-equip-name">${name}</span>
                    <span class="vmo-equip-type">髦ｲ蜈ｷ ${equipped}</span>
                </div>
                ${stats ? `<div class="vmo-equip-stats">${stats}</div>` : ''}
                ${a['蜉ｹ譫・] ? `<div class="vmo-equip-effect">${a['蜉ｹ譫・]}</div>` : ''}
            `;
            equipList.appendChild(row);
        });
        // 驕灘・
        (window.acquiredItems||[]).forEach(i => {
            const row = document.createElement('div');
            row.className = 'vmo-equip-row';
            const name = i._equivalentName || i['陬・ｙ蜷・] || '-';
            const qty  = i._quantity !== undefined ? ` ﾃ・{i._quantity}` : '';
            const stats = [
                i['遞ｮ蛻･']     ? `遞ｮ蛻･: ${i['遞ｮ蛻･']}`      : '',
                i['繧ｿ繧､繝溘Φ繧ｰ'] ? `繧ｿ繧､繝溘Φ繧ｰ: ${i['繧ｿ繧､繝溘Φ繧ｰ']}` : '',
                i['蟇ｾ雎｡']     ? `蟇ｾ雎｡: ${i['蟇ｾ雎｡']}`      : '',
                i['蟆・ｨ・]     ? `蟆・ｨ・ ${i['蟆・ｨ・]}`      : '',
            ].filter(Boolean).join(' ・・');
            row.innerHTML = `
                <div class="vmo-equip-header">
                    <span class="vmo-equip-name">${name}${qty}</span>
                    <span class="vmo-equip-type">驕灘・</span>
                </div>
                ${stats ? `<div class="vmo-equip-stats">${stats}</div>` : ''}
                ${i['蜉ｹ譫・] ? `<div class="vmo-equip-effect">${i['蜉ｹ譫・]}</div>` : ''}
            `;
            equipList.appendChild(row);
        });
        const equipSection = g('vmo-equip-section');
        const allEquipLen = (window.acquiredWeapons||[]).length + (window.acquiredArmor||[]).length + (window.acquiredItems||[]).length;
        if (equipSection) equipSection.style.display = allEquipLen ? '' : 'none';
    }

    // -- 繧ｭ繝｣繝ｩ險ｭ螳・--
    const lore = document.querySelector('textarea.profile-input');
    const loreSection = g('vmo-lore-section');
    const loreText    = g('vmo-lore-text');
    if (lore && loreSection && loreText && lore.value) {
        loreText.textContent = lore.value;
        loreSection.style.display = '';
    } else if (loreSection) {
        loreSection.style.display = 'none';
    }

    // -- 繝・・繝槭・繧ｿ繝ｳ險ｭ螳・--
    const vmoThemeBtn = g('vmo-theme-btn');
    if (vmoThemeBtn) {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        vmoThemeBtn.textContent = curTheme === 'dark' ? '笘・・繝ｩ繧､繝・ : '嫌 繝繝ｼ繧ｯ';
        vmoThemeBtn.onclick = () => {
            g('theme-toggle')?.click();
            const next = document.documentElement.getAttribute('data-theme') || 'dark';
            vmoThemeBtn.textContent = next === 'dark' ? '笘・・繝ｩ繧､繝・ : '嫌 繝繝ｼ繧ｯ';
        };
    }

    // -- 邱ｨ髮・・繧ｿ繝ｳ・医ヱ繧ｹ繝ｯ繝ｼ繝芽ｪ崎ｨｼ蠢・茨ｼ・-
    const vmoEditBtn = g('vmo-edit-btn');
    if (vmoEditBtn) {
        vmoEditBtn.onclick = () => {
            const passwordInput = document.getElementById('char-password');
            if (!passwordInput?.value) {
                // 繝代せ繝ｯ繝ｼ繝画悴險ｭ螳壹・蝣ｴ蜷医・縺昴・縺ｾ縺ｾ邱ｨ髮・Δ繝ｼ繝峨∈
                setEditMode(true);
                document.body.style.overflow = '';
                return;
            }
            const pass = prompt('邱ｨ髮・Δ繝ｼ繝峨↓縺吶ｋ縺溘ａ縺ｮ繝代せ繝ｯ繝ｼ繝峨ｒ蜈･蜉帙＠縺ｦ縺上□縺輔＞:');
            if (pass === passwordInput.value) {
                setEditMode(true);
                document.body.style.overflow = '';
            } else if (pass !== null) {
                alert('繝代せ繝ｯ繝ｼ繝峨′驕輔＞縺ｾ縺吶・);
            }
        };
    }

    // -- 鬲皮坤蛹悶・繧ｿ繝ｳ --
    const vmoBeastBtn = g('vmo-beast-btn');
    if (vmoBeastBtn) {
        // 蛻晄悄迥ｶ諷九ｒ迴ｾ蝨ｨ縺ｮ繝｢繝ｼ繝峨↓蜷医ｏ縺帙ｋ
        vmoBeastBtn.classList.toggle('vmo-beast-on',  !!window.isBeastMode);
        vmoBeastBtn.classList.toggle('vmo-beast-off', !window.isBeastMode);
        vmoBeastBtn.textContent = window.isBeastMode ? '誓 鬲皮坤蛹紋ｸｭ' : '誓 鬲皮坤蛹・;
        vmoBeastBtn.onclick = () => {
            // 邱ｨ髮・す繝ｼ繝医・鬲皮坤蛹悶・繧ｿ繝ｳ繧貞・驛ｨ逧・↓蜻ｼ縺ｳ蜃ｺ縺・            const mainBeastBtn = document.getElementById('beast-mode-btn');
            if (mainBeastBtn) mainBeastBtn.click();
            // 陦ｨ遉ｺ譖ｴ譁ｰ
            const now = !!window.isBeastMode;
            vmoBeastBtn.classList.toggle('vmo-beast-on', now);
            vmoBeastBtn.classList.toggle('vmo-beast-off', !now);
            vmoBeastBtn.textContent = now ? '誓 鬲皮坤蛹紋ｸｭ' : '誓 鬲皮坤蛹・;
            // 逕ｻ蜒上ｂ蛻・ｊ譖ｿ縺・            const artImgEl = g('vmo-char-art');
            if (artImgEl) {
                const src = (now && charData.image2) ? charData.image2 : charData.image;
                artImgEl.src = src || '';
                artImgEl.style.display = src ? 'block' : 'none';
            }
        };
    }

    ov.style.display = 'flex';
}

// 髢ｲ隕ｧ繝｢繝ｼ繝峨ｒ髢峨§繧矩圀縺ｯ body overflow 繧呈綾縺・const _origSetEditMode = window.setEditMode;
window.setEditMode = function(edit) {
    if (edit) document.body.style.overflow = '';
    _origSetEditMode(edit);
};

window.buildAndShowViewOverlay = buildAndShowViewOverlay;





    const STYLE_MAP = { '繧｢繧ｿ繝・き繝ｼ': 'ATK', '繝・ぅ繝輔ぉ繝ｳ繝繝ｼ': 'DEF', '繧ｵ繝昴・繧ｿ繝ｼ': 'SUP' };
    const styleBadge = STYLE_MAP[style] || style.slice(0,3).toUpperCase() || '---';
    ov.setAttribute('data-vmo-style', style);

    // -- 繝舌ャ繧ｸ繝ｻ蜷榊燕 --
    const badge = g('vmo-style-badge');
    if (badge) badge.textContent = styleBadge;

    const pRoot = gVal('primary-root');
    const pBlood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(pRoot)?.['繝悶Λ繝・ラ蜷・] || '') : '';
    const bloodLabel = g('vmo-blood-label');
    if (bloodLabel) bloodLabel.textContent = pBlood;

    const nameEl = g('vmo-char-name');
    if (nameEl) nameEl.textContent = gVal('char-name') || '蜷咲┌縺・;
    const demonEl = g('vmo-demon-name');
    if (demonEl) { const dn = gVal('char-demon-name'); demonEl.textContent = dn ? `縲・{dn}縲疏 : ''; }
    const playerEl = g('vmo-player-name');
    if (playerEl) { const pn = gVal('player-name'); playerEl.textContent = pn ? `PL: ${pn}` : ''; }

    // -- 繧ｭ繝｣繝ｩ逕ｻ蜒・--
    const artEl = g('vmo-char-art');
    if (artEl) {
        const src = (window.isBeastMode && charData.image2) ? charData.image2 : charData.image;
        artEl.src = src || '';
        artEl.style.display = src ? 'block' : 'none';
    }

    // -- 繝ｫ繝ｼ繝・ヱ繝阪Ν --
    const rootsPanel = g('vmo-roots-panel');
    if (rootsPanel) {
        rootsPanel.innerHTML = '';
        const sRoot = gVal('secondary-root');
        const tRoot = gVal('tertiary-root');
        [[pRoot,'繝励Λ繧､繝槭Μ'],[sRoot,'繧ｻ繧ｫ繝ｳ繝繝ｪ'],[tRoot,'繧ｿ繝ｼ繧ｷ繝｣繝ｪ']].forEach(([r, role]) => {
            if (!r) return;
            const blood = (typeof BBTData !== 'undefined') ? (BBTData.getRoot(r)?.['繝悶Λ繝・ラ蜷・] || '') : '';
            const tag = document.createElement('div');
            tag.className = 'vmo-root-tag';
            tag.innerHTML = `<small>${role}</small> <strong>${blood ? blood + '/' : ''}${r}</strong>`;
            rootsPanel.appendChild(tag);
        });
    }

    // -- 蝓ｺ譛ｬ諠・ｱ --
    const profileGrid = g('vmo-profile-grid');
    if (profileGrid) {
        profileGrid.innerHTML = '';
        const PROFILE_FIELDS = [
            { label: '險ｭ螳夂噪遞ｮ譌・, inputId: null, selector: '#char-race' },
            { label: '蟷ｴ鮨｢',       inputId: null, selector: '#char-age' },
            { label: '諤ｧ蛻･',       inputId: null, selector: '#char-gender' },
            { label: '繧ｫ繝ｴ繧｡繝ｼ',   inputId: null, selector: '#char-cover' },
            { label: '蜃ｺ閾ｪ',       inputId: null, selector: '#char-origin' },
            { label: '驍る・,       inputId: null, selector: '#char-encounter' },
        ];
        // .profile-input 繧帝・分縺ｫ蜿門ｾ暦ｼ・d莉倥″繧帝勁縺乗ｱ守畑繝輔ぅ繝ｼ繝ｫ繝会ｼ・        const profileEls = Array.from(document.querySelectorAll('.profile-input'))
            .filter(el => !['char-name','char-demon-name','player-name','char-style',
                            'primary-root','secondary-root','tertiary-root','free-stat'].includes(el.id));
        const LABEL_MAP = ['險ｭ螳夂噪遞ｮ譌・,'蟷ｴ鮨｢','諤ｧ蛻･','繧ｫ繝ｴ繧｡繝ｼ','蜃ｺ閾ｪ','驍る・,'螟冶ｦ狗噪迚ｹ蠕ｴ'];
        profileEls.slice(0, 7).forEach((el, i) => {
            if (!el.value) return;
            const row = document.createElement('div');
            row.className = 'vmo-pf-row';
            row.innerHTML = `<span class="vmo-pf-label">${LABEL_MAP[i] || ''}</span><span class="vmo-pf-val">${el.value}</span>`;
            profileGrid.appendChild(row);
        });
        // 邨碁ｨ鍋せ
        const xpRow = document.createElement('div');
        xpRow.className = 'vmo-pf-row';
        xpRow.innerHTML = `<span class="vmo-pf-label">豸郁ｲｻ邨碁ｨ鍋せ</span><span class="vmo-pf-val">${gTxt('total-xp-used')}</span>`;
        profileGrid.appendChild(xpRow);
    }

    // -- 閭ｽ蜉帛､繝代ロ繝ｫ --
    const statsWrap = g('vmo-stats-wrap');
    if (statsWrap) {
        statsWrap.innerHTML = '';
        const STATS = [
            { id: 'stat-fp',       name: 'FP',   hi: true },
            { id: 'stat-humanity', name: '莠ｺ髢捺ｧ', hi: true },
            { id: 'stat-body',     name: '閧我ｽ・,  hi: false },
            { id: 'stat-tech',     name: '謚陦・,  hi: false },
            { id: 'stat-emo',      name: '諢滓ュ',  hi: false },
            { id: 'stat-div',      name: '蜉隴ｷ',  hi: false },
            { id: 'stat-soc',      name: '遉ｾ莨・,  hi: false },
            { id: 'stat-melee',    name: '逋ｽ蜈ｵ',  hi: false },
            { id: 'stat-ranged',   name: '蟆・茶',  hi: false },
            { id: 'stat-dodge',    name: '蝗樣∩',  hi: false },
            { id: 'stat-action',   name: '陦悟虚蛟､', hi: false },
            { id: 'stat-armor',    name: '繧｢繝ｼ繝槭・', hi: false },
        ];
        STATS.forEach(s => {
            const val = gTxt(s.id);
            const card = document.createElement('div');
            card.className = 'vmo-stat-card' + (s.hi ? ' highlight' : '');
            card.innerHTML = `<div class="vmo-stat-name">${s.name}</div><div class="vmo-stat-val">${val || '0'}</div>`;
            statsWrap.appendChild(card);
        });
    }

    // -- 繧｢繝ｼ繝・Μ繧ｹ繝・--
    const artsList = g('vmo-arts-list');
    if (artsList) {
        artsList.innerHTML = '';
        (window.acquiredArts || []).forEach(art => {
            const row = document.createElement('div');
            row.className = 'vmo-art-row';
            const cost = art._overrideCost !== undefined ? art._overrideCost : (art['繧ｳ繧ｹ繝・] || '-');
            const lv   = art._currentLevel !== undefined ? art._currentLevel : 1;
            row.innerHTML = `
                <div>
                    <div class="vmo-art-name">${art['繧｢繝ｼ繝・錐']} <small class="vmo-art-sub">Lv${lv} / ${art['譛螟ｧLv'] || '?'}</small></div>
                    <div class="vmo-art-sub">${art._rt || art['繝ｫ繝ｼ繝・] || ''} / ${art['遞ｮ蛻･'] || ''}</div>
                </div>
                <div class="vmo-art-timing">${art['繧ｿ繧､繝溘Φ繧ｰ'] || '-'}</div>
                <div class="vmo-art-cost">莉｣蜆・ ${cost}</div>
                <div class="vmo-art-effect">${art['蜉ｹ譫・] || ''}</div>
            `;
            artsList.appendChild(row);
        });
        const artsSection = g('vmo-arts-section');
        if (artsSection) artsSection.style.display = (window.acquiredArts||[]).length ? '' : 'none';
    }

    // -- 陬・ｙ繝ｪ繧ｹ繝・--
    const equipList = g('vmo-equip-list');
    if (equipList) {
        equipList.innerHTML = '';
        const allEquip = [
            ...(window.acquiredWeapons||[]).map(w => ({ name: w._equivalentName || w['陬・ｙ蜷・], sub: w['遞ｮ蛻･'], eff: w['蜉ｹ譫・] })),
            ...(window.acquiredArmor||[]).map(a  => ({ name: a._equivalentName || a['陬・ｙ蜷・], sub: '髦ｲ蜈ｷ',       eff: a['蜉ｹ譫・] })),
            ...(window.acquiredItems||[]).map(i  => ({ name: i._equivalentName || i['陬・ｙ蜷・], sub: i['遞ｮ蛻･'],    eff: i['蜉ｹ譫・] })),
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

    // -- 繧ｭ繝｣繝ｩ險ｭ螳・--
    const lore = document.querySelector('textarea.profile-input');
    const loreSection = g('vmo-lore-section');
    const loreText    = g('vmo-lore-text');
    if (lore && loreSection && loreText && lore.value) {
        loreText.textContent = lore.value;
        loreSection.style.display = '';
    }

    // 繝・・繝槭・繧ｿ繝ｳ蜷梧悄
    const vmoThemeBtn = g('vmo-theme-btn');
    if (vmoThemeBtn) {
        const mainTheme = g('theme-toggle');
        vmoThemeBtn.textContent = mainTheme ? mainTheme.textContent : '嫌';
        vmoThemeBtn.onclick = () => { g('theme-toggle')?.click(); vmoThemeBtn.textContent = g('theme-toggle')?.textContent || ''; };
    }

    ov.style.display = 'flex';
}

window.buildAndShowViewOverlay = buildAndShowViewOverlay;
