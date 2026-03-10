/**
 * loader.js
 * CSVファイルをfetch()で読み込み、グローバル変数 BBTArtsData / BBTEquipData を構築する。
 * ⚠ このファイルは http:// または https:// 経由で動作します（file:// 不可）。
 */

// -------------------------------------------------------------------
// 汎用CSVパーサー (ダブルクォート内のカンマ・改行を正しく扱う)
// -------------------------------------------------------------------
function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            row.push(field.trim()); field = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field.trim()); field = '';
            rows.push(row); row = [];
        } else {
            field += ch;
        }
    }
    if (field || row.length) { row.push(field.trim()); rows.push(row); }
    return rows;
}

// -------------------------------------------------------------------
// アーツCSV → オブジェクト配列
// CSV列: [ignore, ルーツ, アーツ名, 種別, 最大Lv, タイミング, 判定値, 対象, 射程, コスト, 効果, ...]
// -------------------------------------------------------------------
function artsCSVtoArray(rows) {
    const COLS = ['_','ルーツ','アーツ名','種別','最大Lv','タイミング','判定値','対象','射程','コスト','効果'];
    // ヘッダー行スキップ（アーツ名の列に「アーツ名」があれば）
    const startIdx = (rows[0] && rows[0][2] === 'アーツ名') ? 1 : 0;
    const result = [];
    for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[2] || !r[2].trim()) continue; // アーツ名が空なら除外
        const obj = {};
        COLS.forEach((h, idx) => { if (h !== '_') obj[h] = (r[idx] || '').trim(); });
        result.push(obj);
    }
    return result;
}

// -------------------------------------------------------------------
// 装備CSV → weapons / armor 配列に分類
// CSV列: [ignore, ルーツ, 装備名, 種別, 命中, 攻撃力, G値, ドッジ, A値, 行動値, 射程, 購入, 効果]
// -------------------------------------------------------------------
function equipCSVtoData(rows) {
    const weapons = [], armor = [];
    const startIdx = (rows[0] && rows[0][2] === '装備名') ? 1 : 0;
    for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[2] || !r[2].trim()) continue;
        const type = (r[3] || '').trim();
        if (!type) continue;
        const obj = {
            'ルーツ':   (r[1]  || '').trim(),
            '装備名':   (r[2]  || '').trim(),
            '種別':     type,
            '命中':     (r[4]  || '').trim(),
            '攻撃力':   (r[5]  || '').trim(),
            'G値':      (r[6]  || '').trim(),
            'ドッジ':   (r[7]  || '').trim(),
            'A値':      (r[8]  || '').trim(),
            '行動値':   (r[9]  || '').trim(),
            '射程':     (r[10] || '').trim(),
            '購入':     (r[11] || '').trim(),
            '効果':     (r[12] || '').trim(),
        };
        if (type.includes('防具')) armor.push(obj);
        else if (type.includes('武器') || type.includes('乗り物')) weapons.push(obj);
    }
    return { weapons, armor };
}

// -------------------------------------------------------------------
// 道具CSV → items 配列
// CSV列: [ignore, ルーツ, 道具名, 種別, タイミング, 対象, 射程, 購入, 効果]
// -------------------------------------------------------------------
function itemsCSVtoArray(rows) {
    // 先頭行がヘッダーかどうか：列[2]の値がテキストで構成されていれば（数値や効果文でなければ）スキップ
    const HEADER_KEYWORDS = ['アーツ名','道具名','装備名','ルーツ','種別','タイミング','対象','射程','購入','効果','名前'];
    const firstCellV = (rows[0] && rows[0][2]) ? rows[0][2].trim() : '';
    const startIdx = HEADER_KEYWORDS.includes(firstCellV) ? 1 : 0;
    const items = [];
    for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[2] || !r[2].trim()) continue;
        const type = (r[3] || '').trim();
        if (!type) continue;
        // ヘッダー行が途中に混入していないかチェック
        if (HEADER_KEYWORDS.includes(r[2].trim())) continue;
        items.push({
            'ルーツ':     (r[1] || '').trim(),
            '装備名':     (r[2] || '').trim(),
            '種別':       type,
            'タイミング': (r[4] || '').trim(),
            '対象':       (r[5] || '').trim(),
            '射程':       (r[6] || '').trim(),
            '購入':       (r[7] || '').trim(),
            '効果':       (r[8] || '').trim(),
        });
    }
    return items;
}

// -------------------------------------------------------------------
// fetchCSV ヘルパー
// -------------------------------------------------------------------
function fetchCSV(path) {
    return fetch(path).then(r => {
        if (!r.ok) throw new Error(`CSV取得失敗: ${path} (${r.status})`);
        return r.text();
    });
}

// -------------------------------------------------------------------
// アーツCSVのキー定義
// -------------------------------------------------------------------
const ARTS_CSV_FILES = [
    { file: 'BBT_アーツデータ - アタッカー.csv',       key: 'アタッカー' },
    { file: 'BBT_アーツデータ - ディフェンダー.csv',    key: 'ディフェンダー' },
    { file: 'BBT_アーツデータ - サポーター.csv',       key: 'サポーター' },
    { file: 'BBT_アーツデータ - イレギュラー.csv',      key: 'イレギュラー' },
    { file: 'BBT_アーツデータ - ヴァンパイア.csv',      key: 'ヴァンパイア' },
    { file: 'BBT_アーツデータ - エトランゼ.csv',       key: 'エトランゼ' },
    { file: 'BBT_アーツデータ - スピリット.csv',       key: 'スピリット' },
    { file: 'BBT_アーツデータ - セレスチャル.csv',     key: 'セレスチャル' },
    { file: 'BBT_アーツデータ - デーモン.csv',         key: 'デーモン' },
    { file: 'BBT_アーツデータ - ネイバー.csv',         key: 'ネイバー' },
    { file: 'BBT_アーツデータ - ハーミット.csv',       key: 'ハーミット' },
    { file: 'BBT_アーツデータ - フルメタル.csv',       key: 'フルメタル' },
    { file: 'BBT_アーツデータ - レジェンド.csv',       key: 'レジェンド' },
    { file: 'BBT_アーツデータ - ヴォイド.csv',         key: 'ヴォイド' },
    { file: 'BBT_アーツデータ - ストレンジャー.csv',   key: 'ストレンジャー' },
    { file: 'BBT_アーツデータ - コズミックホラー.csv', key: 'コズミックホラー' },
    { file: 'BBT_アーツデータ - ダークカルテル.csv',   key: 'ダークカルテル' },
    { file: 'BBT_アーツデータ - ジャイガント.csv',     key: 'ジャイガント' },
    { file: 'BBT_アーツデータ - 共通アーツ.csv',      key: '共通アーツ' },
];

// -------------------------------------------------------------------
// メインローダー: 全CSVを並列fetchしてグローバル変数に格納
// onSuccess() または onError(err) を呼ぶ
// -------------------------------------------------------------------
async function loadAllData(onSuccess, onError) {
    try {
        const BASE = 'data/uploads/';

        // アーツを並列フェッチ
        const artsData = {};
        await Promise.all(ARTS_CSV_FILES.map(async ({ file, key }) => {
            const text = await fetchCSV(BASE + encodeURIComponent(file));
            artsData[key] = artsCSVtoArray(parseCSV(text));
        }));

        // 装備・道具を並列フェッチ
        const [equipText, itemsText] = await Promise.all([
            fetchCSV(BASE + encodeURIComponent('BBT_アーツデータ - 装備.csv')),
            fetchCSV(BASE + encodeURIComponent('BBT_アーツデータ - 道具.csv')),
        ]);

        const { weapons, armor } = equipCSVtoData(parseCSV(equipText));
        const items = itemsCSVtoArray(parseCSV(itemsText));

        window.BBTArtsData = artsData;
        window.BBTEquipData = { weapons, armor, items };

        onSuccess();
    } catch (err) {
        onError(err);
    }
}

window.loadAllData = loadAllData;
