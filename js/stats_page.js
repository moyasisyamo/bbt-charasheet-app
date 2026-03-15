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

    // 1. スタイル分布
    const styles = { 'アタッカー': 0, 'ディフェンダー': 0, 'サポーター': 0 };
    chars.forEach(c => {
        if (styles[c.style] !== undefined) styles[c.style]++;
    });

    const styleDiv = document.getElementById('style-distribution');
    const colors = { 'アタッカー': '#ff5277', 'ディフェンダー': '#4fc3f7', 'サポーター': '#81c784' };
    
    Object.entries(styles).forEach(([name, count]) => {
        const percent = ((count / chars.length) * 100).toFixed(1);
        const item = document.createElement('div');
        item.className = 'style-item';
        item.innerHTML = `
            <div class="style-item-header">
                <span>${name}</span>
                <span>${count}人 (${percent}%)</span>
            </div>
            <div class="stat-bar-container">
                <div class="stat-bar-fill" style="width: ${percent}%; background: ${colors[name]};"></div>
            </div>
        `;
        styleDiv.appendChild(item);
    });

    // 2. 能力値平均
    // キャラクターごとの能力値を取得
    const totals = { physical: 0, tech: 0, emotion: 0, divine: 0, society: 0 };
    let validCount = 0;

    chars.forEach(c => {
        const d = c.sheetData || {};
        const st = d.stats || {};
        // 数値であることを確認
        if (st.physical !== undefined) {
            totals.physical += Number(st.physical) || 0;
            totals.tech     += Number(st.tech)     || 0;
            totals.emotion  += Number(st.emotion)  || 0;
            totals.divine   += Number(st.divine)   || 0;
            totals.society  += Number(st.society)  || 0;
            validCount++;
        }
    });

    const abilityDiv = document.getElementById('ability-averages');
    const labels = { physical: '肉体', tech: '技術', emotion: '感情', divine: '加護', society: '社会' };
    
    if (validCount > 0) {
        Object.entries(labels).forEach(([key, label]) => {
            const avg = (totals[key] / validCount).toFixed(2);
            const row = document.createElement('div');
            row.className = 'avg-stat-item';
            row.innerHTML = `
                <span class="avg-stat-name">${label}</span>
                <span class="avg-stat-val">${avg}</span>
            `;
            abilityDiv.appendChild(row);
        });
    } else {
        abilityDiv.innerHTML = '<p>有効な集計データがありません。</p>';
    }
}
