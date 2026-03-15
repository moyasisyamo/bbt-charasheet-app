/**
 * stats_page.js
 * キャラクター全員のデータを取得し、統計を表示する。
 */

document.addEventListener('DOMContentLoaded', async () => {
    // テーマ同期
    const saved = localStorage.getItem('bbt-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);

    // Firebase 初期化
    const fbReady = window.bbFirebase.init();
    if (!fbReady) {
        document.getElementById('loading-msg').innerHTML = '<p style="color:red;">Firebaseが設定されていません。</p>';
        return;
    }

    try {
        const allChars = await window.bbFirebase.loadAll();
        renderStats(allChars);
    } catch (e) {
        document.getElementById('loading-msg').innerHTML = `<p style="color:red;">エラー: ${e.message}</p>`;
    }
});

function renderStats(chars) {
    const loading = document.getElementById('loading-msg');
    const content = document.getElementById('stats-content');
    loading.style.display = 'none';
    content.style.display = 'block';

    if (chars.length === 0) {
        content.innerHTML = '<div class="panel">表示するキャラクターデータがありません。</div>';
        return;
    }

    document.getElementById('total-chars-msg').textContent = `登録キャラクター数: ${chars.length} 人`;

    // 1. スタイル分布（円グラフ）
    renderStylePieChart(chars);

    // 2. 能力値・戦闘値の集計（平均と最大値）
    renderAbilityStats(chars);

    // 3. ブラッド/ルーツランキング
    renderRankings(chars);
}

function renderStylePieChart(chars) {
    const styles = { 'アタッカー': 0, 'ディフェンダー': 0, 'サポーター': 0 };
    chars.forEach(c => {
        if (styles[c.style] !== undefined) styles[c.style]++;
    });

    const styleDiv = document.getElementById('style-distribution');
    styleDiv.innerHTML = ''; // クリア

    const colors = { 'アタッカー': '#ff5277', 'ディフェンダー': '#4fc3f7', 'サポーター': '#81c784' };
    const total = chars.length;

    // 円グラフのグラデーション計算
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
    chart.style.background = `conic-gradient(${gradientParts.join(', ')})`;
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
    
    // 最大値保持者の追跡
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
            // 集計と最大値チェック
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
            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';
            
            const mainInfo = document.createElement('div');
            mainInfo.style.display = 'flex';
            mainInfo.style.justifyContent = 'space-between';
            mainInfo.innerHTML = `<span class="avg-stat-name">${label} (平均)</span><span class="avg-stat-val">${avg}</span>`;
            item.appendChild(mainInfo);

            if (holder.val !== -Infinity) {
                const maxInfo = document.createElement('div');
                maxInfo.className = 'max-holder';
                const iconHTML = holder.icon 
                    ? `<img src="${holder.icon}" class="max-holder-icon" alt="">`
                    : `<div class="max-holder-icon" style="display:flex;align-items:center;justify-content:center;background:var(--btn-bg);font-size:0.6rem;">👤</div>`;
                
                maxInfo.innerHTML = `
                    <span class="max-holder-label">最大値 (${holder.val}):</span>
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

    chars.forEach(c => {
        // 純血ルール: プライマリとセカンダリが同じなら1回。
        // Setを使って「同じキャラクター内での重複」を排除する
        const uniqueBloods = new Set([c.primaryBlood, c.secondaryBlood, c.tertiaryBlood].filter(Boolean));
        const uniqueRoots  = new Set([c.primaryRoot,  c.secondaryRoot,  c.tertiaryRoot ].filter(Boolean));

        uniqueBloods.forEach(b => { bloodCounts[b] = (bloodCounts[b] || 0) + 1; });
        uniqueRoots.forEach(r => { rootCounts[r]   = (rootCounts[r]   || 0) + 1; });
    });

    const renderList = (containerId, counts) => {
        const div = document.getElementById(containerId);
        div.innerHTML = '';
        const sorted = Object.entries(counts)
            .filter(([name]) => name !== 'なし' && name !== '-')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sorted.length === 0) {
            div.innerHTML = '<p style="padding:10px;color:var(--text-muted);">データなし</p>';
            return;
        }

        sorted.forEach(([name, count], i) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            item.innerHTML = `
                <div class="ranking-rank">${i + 1}</div>
                <div class="ranking-name">${escHtml(name)}</div>
                <div class="ranking-count">${count}人</div>
            `;
            div.appendChild(item);
        });
    };

    renderList('blood-rankings', bloodCounts);
    renderList('root-rankings', rootCounts);
}

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
