/**
 * stats_page.js
 * キャラクター全員のデータを取得し、統計を表示する。
 */

let allChars = [];
let lastAggregatedData = {
    blood: {},
    root: {},
    arts: {}
};

document.addEventListener('DOMContentLoaded', async () => {
    // テーマ初期化
    const savedTheme = localStorage.getItem('bbt-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // テーマ切り替えイベント
    const themeBtn = document.getElementById('theme-toggle-fixed');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('bbt-theme', next);
        });
    }

    // モーダル閉じるイベント
    const modal = document.getElementById('ranking-modal');
    const closeBtn = document.getElementById('modal-close');
    if (modal && closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // Firebase 初期化
    const fbReady = window.bbFirebase.init();
    if (!fbReady) {
        document.getElementById('loading-msg').innerHTML = '<p style="color:red;">Firebaseが設定されていません。</p>';
        return;
    }

    try {
        allChars = await window.bbFirebase.loadAll();
        initFilter(allChars);
        
        // レイアウト確定を待ってからレンダリング
        setTimeout(() => {
            renderStats(allChars);
        }, 100);
    } catch (e) {
        document.getElementById('loading-msg').innerHTML = `<p style="color:red;">エラー: ${e.message}</p>`;
    }
});

/** フィルターの初期化（プレイヤー一覧の生成） */
function initFilter(chars) {
    const filter = document.getElementById('player-filter');
    if (!filter) return;

    const players = new Set();
    chars.forEach(c => {
        if (c.playerName) players.add(c.playerName.trim());
    });

    const sortedPlayers = Array.from(players).sort();
    sortedPlayers.forEach(p => {
        if (!p) return;
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        filter.appendChild(opt);
    });

    filter.addEventListener('change', () => {
        const val = filter.value;
        if (val === 'all') {
            renderStats(allChars);
        } else {
            const filtered = allChars.filter(c => c.playerName && c.playerName.trim() === val);
            renderStats(filtered);
        }
    });
}

function renderStats(chars) {
    const loading = document.getElementById('loading-msg');
    const content = document.getElementById('stats-content');
    loading.style.display = 'none';
    content.style.display = 'block';

    const totalMsg = document.getElementById('total-chars-msg');
    if (totalMsg) totalMsg.textContent = `登録キャラクター数: ${chars.length} 人`;

    if (chars.length === 0) {
        content.innerHTML = '<div class="panel" style="text-align:center; padding:40px;">表示するキャラクターデータがありません。</div>';
        return;
    }

    // 順序通りに描画
    renderAgeVerticalBarChart(chars);
    renderGenderBandGraph(chars);
    renderStylePieChart(chars);
    renderRankings(chars);
    renderAbilityStats(chars);
}

function renderAgeVerticalBarChart(chars) {
    const buckets = [
        { label: '0-9歳', min: 0, max: 9 },
        { label: '10-19歳', min: 10, max: 19 },
        { label: '20-29歳', min: 20, max: 29 },
        { label: '30-39歳', min: 30, max: 39 },
        { label: '40-49歳', min: 40, max: 49 },
        { label: '50-59歳', min: 50, max: 59 },
        { label: '60-69歳', min: 60, max: 69 },
        { label: '70-79歳', min: 70, max: 79 },
        { label: '80-89歳', min: 80, max: 89 },
        { label: '90-99歳', min: 90, max: 99 },
        { label: '100-499歳', min: 100, max: 499 },
        { label: '500-999歳', min: 500, max: 999 },
        { label: '1000-9999歳', min: 1000, max: 9999 },
        { label: '10000歳-', min: 10000, max: Infinity }
    ];

    const counts = buckets.map(() => 0);
    let unknownCount = 0;

    chars.forEach(c => {
        const ageVal = getProfileValue(c, 'char-age');
        if (!ageVal) { unknownCount++; return; }
        const match = String(ageVal).match(/\d+/);
        if (!match) { unknownCount++; return; }
        const age = parseInt(match[0]);
        const bIndex = buckets.findIndex(b => age >= b.min && age <= b.max);
        if (bIndex !== -1) counts[bIndex]++;
        else unknownCount++;
    });

    const container = document.getElementById('age-distribution');
    if (!container) return;
    container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-chart-v-container';

    const maxVal = Math.max(...counts, 1);

    buckets.forEach((b, i) => {
        const count = counts[i];
        const percent = (count / maxVal) * 100;

        const col = document.createElement('div');
        col.className = 'bar-chart-v-col';
        col.innerHTML = `
            <div class="bar-chart-v-count">${count > 0 ? count : ''}</div>
            <div class="bar-chart-v-fill" style="height: 0%;" data-height="${percent}"></div>
            <div class="bar-chart-v-label">${b.label}</div>
        `;
        wrapper.appendChild(col);
    });

    container.appendChild(wrapper);

    // アニメーション用に遅延させて高さを設定
    setTimeout(() => {
        const fills = wrapper.querySelectorAll('.bar-chart-v-fill');
        fills.forEach(f => {
            f.style.height = f.getAttribute('data-height') + '%';
        });
    }, 50);
    
    if (unknownCount > 0) {
        const unknownInfo = document.createElement('div');
        unknownInfo.style.textAlign = 'right';
        unknownInfo.style.fontSize = '0.8rem';
        unknownInfo.style.color = 'var(--text-muted)';
        unknownInfo.style.padding = '20px 15px 0';
        unknownInfo.textContent = `※ 年齢不詳: ${unknownCount}人`;
        container.appendChild(unknownInfo);
    }
}

function renderGenderBandGraph(chars) {
    const counts = { '男性': 0, '女性': 0, '両性': 0, 'なし': 0, '不明': 0 };
    const colors = {
        '男性': '#4fc3f7',
        '女性': '#ff5277',
        '両性': '#a855f7',
        'なし': '#94a3b8',
        '不明': '#565f89'
    };

    chars.forEach(c => {
        const genVal = (getProfileValue(c, 'char-gender') || '').trim();
        let normalized = '不明';
        if (counts[genVal] !== undefined) {
            normalized = genVal;
        } else {
            if (genVal.match(/[男オス雄♂]|男性/)) normalized = '男性';
            else if (genVal.match(/[女メス雌♀]|女性/)) normalized = '女性';
            else if (genVal.match(/両性/)) normalized = '両性';
            else if (genVal.match(/無性別|無|なし/)) normalized = 'なし';
            else if (genVal.match(/不詳|不明/)) normalized = '不明';
        }
        counts[normalized]++;
    });

    const container = document.getElementById('gender-distribution');
    if (!container) return;
    container.innerHTML = '';

    const graph = document.createElement('div');
    graph.className = 'band-graph';
    
    const total = chars.length;
    Object.entries(counts).forEach(([name, count]) => {
        if (count === 0) return;
        const percent = (count / total) * 100;
        const segment = document.createElement('div');
        segment.className = 'band-segment';
        segment.style.width = `${percent}%`;
        segment.style.backgroundColor = colors[name];
        segment.textContent = count >= (total * 0.08) ? `${name}(${count})` : '';
        segment.title = `${name}: ${count}人 (${percent.toFixed(1)}%)`;
        graph.appendChild(segment);
    });

    container.appendChild(graph);

    const legend = document.createElement('div');
    legend.className = 'pie-legend';
    legend.style.flexDirection = 'row';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '15px';
    legend.style.marginTop = '15px';

    Object.entries(counts).forEach(([name, count]) => {
        if (count === 0) return;
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background:${colors[name]}"></div>
            <span>${name}: ${count}</span>
        `;
        legend.appendChild(item);
    });
    container.appendChild(legend);
}

function renderStylePieChart(chars) {
    const styles = { 'アタッカー': 0, 'ディフェンダー': 0, 'サポーター': 0 };
    chars.forEach(c => {
        if (styles[c.style] !== undefined) styles[c.style]++;
    });

    const styleDiv = document.getElementById('style-distribution');
    if (!styleDiv) return;
    styleDiv.innerHTML = '';

    const colors = { 'アタッカー': '#ff5277', 'ディフェンダー': '#4fc3f7', 'サポーター': '#81c784' };
    const total = chars.length;

    let lastPercent = 0;
    const gradientParts = [];
    Object.entries(styles).forEach(([name, count]) => {
        if (count === 0) return;
        const percent = (count / total) * 100;
        gradientParts.push(`${colors[name]} ${lastPercent}% ${lastPercent + percent}%`);
        lastPercent += percent;
    });

    const container = document.createElement('div');
    container.className = 'pie-chart-container';
    
    const chart = document.createElement('div');
    chart.className = 'pie-chart';
    if (gradientParts.length > 0) {
        chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    } else {
        chart.style.background = 'var(--btn-bg)';
    }
    container.appendChild(chart);

    const legend = document.createElement('div');
    legend.className = 'pie-legend';
    Object.entries(styles).forEach(([name, count]) => {
        const percent = ((count / total) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <div class="legend-color" style="background:${colors[name]}"></div>
            <span>${name}: ${count}人 (${percent}%)</span>
        `;
        legend.appendChild(item);
    });

    styleDiv.appendChild(container);
    styleDiv.appendChild(legend);
}

function renderAbilityStats(chars) {
    const abilityLabels = { physical: '肉体', tech: '技術', emotion: '感情', divine: '加護', society: '社会' };
    const combatLabels  = { melee: '白兵', ranged: '射撃', dodge: '回避', action: '行動' };

    const abilityTotals = { physical: 0, tech: 0, emotion: 0, divine: 0, society: 0 };
    const combatTotals  = { melee: 0, ranged: 0, dodge: 0, action: 0 };
    
    const maxHolders = {};
    [...Object.keys(abilityLabels), ...Object.keys(combatLabels)].forEach(k => {
        maxHolders[k] = { val: -Infinity, name: '-', icon: null };
    });

    let validCount = 0;
    chars.forEach(c => {
        const d = c.sheetData || {};
        const st = d.stats || {};
        if (st.physical !== undefined) {
            validCount++;
            Object.keys(abilityLabels).forEach(k => {
                const val = Number(st[k]) || 0;
                abilityTotals[k] += val;
                if (val > maxHolders[k].val) {
                    maxHolders[k] = { val, name: c.name || '名無し', icon: c.faceIcon };
                }
            });
            Object.keys(combatLabels).forEach(k => {
                const val = Number(st[k]) || 0;
                combatTotals[k] += val;
                if (val > maxHolders[k].val) {
                    maxHolders[k] = { val, name: c.name || '名無し', icon: c.faceIcon };
                }
            });
        }
    });

    const renderGroup = (containerId, labels, totals) => {
        const div = document.getElementById(containerId);
        if (!div) return;
        div.innerHTML = '';
        if (validCount === 0) {
            div.innerHTML = '<p>有効な集計データがありません。</p>';
            return;
        }

        Object.entries(labels).forEach(([key, label]) => {
            const avg = (totals[key] / validCount).toFixed(2);
            const holder = maxHolders[key];
            
            const item = document.createElement('div');
            item.className = 'avg-stat-item';
            
            const mainInfo = document.createElement('div');
            mainInfo.style.display = 'flex';
            mainInfo.style.justifyContent = 'space-between';
            mainInfo.style.alignItems = 'center';
            mainInfo.innerHTML = `<span class="avg-stat-name">${label} (平均)</span><span class="avg-stat-val">${avg}</span>`;
            item.appendChild(mainInfo);

            if (holder.val !== -Infinity) {
                const maxInfo = document.createElement('div');
                maxInfo.className = 'max-holder';
                const iconHTML = holder.icon 
                    ? `<img src="${holder.icon}" class="max-holder-icon" alt="">`
                    : `<div class="max-holder-icon" style="display:flex;align-items:center;justify-content:center;background:var(--btn-bg);font-size:0.6rem;">👤</div>`;
                
                maxInfo.innerHTML = `
                    <span class="max-holder-label">最大 (${holder.val}):</span>
                    ${iconHTML}
                    <span class="max-holder-name">${escHtml(holder.name)}</span>
                `;
                item.appendChild(maxInfo);
            }
            
            div.appendChild(item);
        });
    };

    renderGroup('ability-averages', abilityLabels, abilityTotals);
    renderGroup('combat-averages', combatLabels, combatTotals);
}

function renderRankings(chars) {
    const bloodCounts = {};
    const rootCounts  = {};
    const artsCounts  = {};

    chars.forEach(c => {
        const uniqueBloods = new Set([c.primaryBlood, c.secondaryBlood, c.tertiaryBlood].filter(Boolean));
        const uniqueRoots  = new Set([c.primaryRoot,  c.secondaryRoot,  c.tertiaryRoot ].filter(Boolean));
        uniqueBloods.forEach(b => { bloodCounts[b] = (bloodCounts[b] || 0) + 1; });
        uniqueRoots.forEach(r => { rootCounts[r]   = (rootCounts[r]   || 0) + 1; });

        const d = c.sheetData || {};
        const arts = d.arts || [];
        const uniqueArts = new Set();
        arts.forEach(a => {
            const name = a['アーツ名'];
            const type = a['種別'] || '';
            if (name && !type.includes('自動')) {
                uniqueArts.add(name);
            }
        });
        uniqueArts.forEach(a => { artsCounts[a] = (artsCounts[a] || 0) + 1; });
    });

    // 人気アーツのみ、1人しか持っていないものは除外する
    const filteredArtsCounts = {};
    Object.entries(artsCounts).forEach(([name, count]) => {
        if (count > 1) {
            filteredArtsCounts[name] = count;
        }
    });

    // 次回ポップアップ用に記録
    lastAggregatedData.blood = bloodCounts;
    lastAggregatedData.root = rootCounts;
    lastAggregatedData.arts = filteredArtsCounts;

    const renderList = (containerId, counts, typeName) => {
        const div = document.getElementById(containerId);
        if (!div) return;
        div.innerHTML = '';
        
        const validEntries = Object.entries(counts)
            .filter(([name]) => name !== 'なし' && name !== '-' && name !== '不明');
        
        const sorted = [...validEntries].sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            div.innerHTML = '<p style="padding:10px;color:var(--text-muted);">データなし</p>';
            return;
        }

        // 順位計算(競技順位方式)
        let currentRank = 1;
        let lastCount = -1;
        sorted.forEach(([name, count], i) => {
            if (i >= 5) return; // TOP5のみ描画

            if (count !== lastCount) {
                currentRank = i + 1;
            }
            lastCount = count;

            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <div class="ranking-rank">${currentRank}</div>
                <div class="ranking-name">${escHtml(name)}</div>
                <div class="ranking-count">${count}人</div>
            `;
            div.appendChild(item);
        });

        if (validEntries.length > 5) {
            const btnWrap = document.createElement('div');
            btnWrap.style.textAlign = 'right';
            btnWrap.style.marginTop = '10px';
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.fontSize = '0.75rem';
            btn.style.padding = '4px 8px';
            btn.textContent = 'すべて見る ≫';
            btn.onclick = () => showRankingModal(typeName, counts);
            btnWrap.appendChild(btn);
            div.appendChild(btnWrap);
        }
    };

    renderList('blood-rankings', bloodCounts, '人気ブラッド');
    renderList('root-rankings', rootCounts, '人気ルーツ');
    renderList('arts-rankings', filteredArtsCounts, '人気アーツ');
}

/** ランキング全件表示モーダル */
function showRankingModal(title, counts) {
    const modal = document.getElementById('ranking-modal');
    const titleEl = document.getElementById('modal-title');
    const listEl = document.getElementById('modal-ranking-list');
    
    if (!modal || !titleEl || !listEl) return;

    titleEl.textContent = `${title} 全ランキング`;
    listEl.innerHTML = '';

    const sorted = Object.entries(counts)
        .filter(([name]) => name !== 'なし' && name !== '-' && name !== '不明')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30); // 上位30位まで表示

    const wrapper = document.createElement('div');
    wrapper.className = 'ranking-list';
    
    let currentRank = 1;
    let lastCount = -1;
    sorted.forEach(([name, count], i) => {
        if (count !== lastCount) {
            currentRank = i + 1;
        }
        lastCount = count;

        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.style.padding = '12px';
        item.innerHTML = `
            <div class="ranking-rank">${currentRank}</div>
            <div class="ranking-name" style="font-size: 1rem;">${escHtml(name)}</div>
            <div class="ranking-count" style="font-size: 0.9rem;">${count}人</div>
        `;
        wrapper.appendChild(item);
    });

    listEl.appendChild(wrapper);
    modal.style.display = 'flex';
}

function getProfileValue(c, id) {
    const data = c.sheetData || {};
    const profile = data.profileData || [];
    const item = profile.find(p => p.id === id);
    return item ? item.val : null;
}

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
