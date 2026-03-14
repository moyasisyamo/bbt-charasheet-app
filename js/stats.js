/**
 * stats.js
 * 能力値・戦闘能力値の計算と画面表示を担当する。
 * 依存: BBTData (data.js), charData / acquiredArts / acquiredArmor / acquiredWeapons / acquiredItems (main.js で定義)
 */

// ---- 成長XP計算 ----
function calcStatGrowthXP(base, growth) {
    let cost = 0, current = base;
    for (let i = 0; i < growth; i++) { cost += current + 5; current++; }
    return cost;
}

// ---- 成長値読み取り ----
function getGrowth(id) {
    return parseInt(document.getElementById(`growth-${id}`).value) || 0;
}

// ---- 能力値をすべてリセット表示 ----
function resetStatsDisplay() {
    ['body','tech','emo','div','soc','melee','ranged','dodge','action'].forEach(id => {
        document.getElementById(`stat-${id}`).textContent = '0';
    });
    ['body','tech','emo','div','soc'].forEach(id => {
        document.getElementById(`stat-${id}-b`).textContent = '/0';
    });
    ['phys','tech','emo','div','soc'].forEach(id =>
        document.getElementById(`armor-${id}`).textContent = '0'
    );
    document.getElementById('stat-fp').textContent = '20';
    document.getElementById('stat-humanity').textContent = '0';
    document.getElementById('stat-type').textContent = '-';
}

// ---- メイン計算関数 ----
function calculateStats() {
    const styleSelect        = document.getElementById('char-style');
    const primaryRootSelect  = document.getElementById('primary-root');
    const secondaryRootSelect = document.getElementById('secondary-root');
    const freeStatSelect     = document.getElementById('free-stat');

    const styleName  = styleSelect.value;
    const pRootName  = primaryRootSelect.value;
    const sRootName  = secondaryRootSelect.value;
    const tRootName  = document.getElementById('tertiary-root').value;

    let stats = { physical: 0, tech: 0, emotion: 0, divine: 0, society: 0, humanity: 0, type: [], baseDodge: 0, actionBase: 0 };
    let cStats = { melee: 0, ranged: 0, dodge: 0, action: 0 };

    if (!styleName && !pRootName && !sRootName) return resetStatsDisplay();

    const styleData  = BBTData.getStyle(styleName);
    const pRootData  = BBTData.getRoot(pRootName);
    const sRootData  = BBTData.getRoot(sRootName);

    // ---- ブラッド能力値適用 ----
    const applyBlood = (rootData, getBloodFunc) => {
        if (!rootData) return;
        const blood = getBloodFunc(rootData['ブラッド名']);
        if (blood) {
            stats.physical += blood['肉体']  || 0;
            stats.tech     += blood['技術']  || 0;
            stats.emotion  += blood['感情']  || 0;
            stats.divine   += blood['加護']  || 0;
            stats.society  += blood['社会']  || 0;
            stats.humanity += blood['人間性'] || 0;
            if (blood['種別'] && !stats.type.includes(blood['種別'])) stats.type.push(blood['種別']);
        }
    };
    applyBlood(pRootData, BBTData.getPrimaryBlood);
    applyBlood(sRootData, BBTData.getSecondaryBlood);

    // ---- 得意能力 ----
    const usesPrimary = document.querySelector('input[name="proficiency-choice"]:checked').value === 'primary';
    const profRoot = usesPrimary ? pRootData : sRootData;
    if (profRoot && profRoot['得意能力']) {
        const map = { '肉体': 'physical', '技術': 'tech', '感情': 'emotion', '加護': 'divine', '社会': 'society' };
        if (map[profRoot['得意能力']]) stats[map[profRoot['得意能力']]] += 1;
    }

    // ---- フリー能力値 ----
    const freeStat = freeStatSelect.value;
    if (freeStat) {
        const map = { '肉体': 'physical', '技術': 'tech', '感情': 'emotion', '加護': 'divine', '社会': 'society' };
        if (map[freeStat]) stats[map[freeStat]] += 1;
    }

    // ---- 手動補正読み取り ----
    const adjSuffix = window.isBeastMode ? 'beast' : 'normal';
    const getAdj = (id) => parseInt(document.getElementById(`mod-${id}-${adjSuffix}`)?.value) || 0;

    charData.mods.body     = getAdj('body');
    charData.mods.tech     = getAdj('tech');
    charData.mods.emo      = getAdj('emo');
    charData.mods.div      = getAdj('div');
    charData.mods.soc      = getAdj('soc');
    charData.mods.melee    = getAdj('melee');
    charData.mods.ranged   = getAdj('ranged');
    charData.mods.dodge    = getAdj('dodge');
    charData.mods.action   = getAdj('action');
    charData.mods.armor    = getAdj('armor');
    charData.mods.fp       = getAdj('fp');
    charData.mods.humanity = getAdj('humanity');

    stats.physical += charData.mods.body;
    stats.tech     += charData.mods.tech;
    stats.emotion  += charData.mods.emo;
    stats.divine   += charData.mods.div;
    stats.society  += charData.mods.soc;

    // ---- 成長 ----
    let growthXP = 0;
    const gBody   = getGrowth('body');   growthXP += calcStatGrowthXP(stats.physical, gBody);   stats.physical += gBody;
    const gTech   = getGrowth('tech');   growthXP += calcStatGrowthXP(stats.tech,     gTech);   stats.tech     += gTech;
    const gEmo    = getGrowth('emo');    growthXP += calcStatGrowthXP(stats.emotion,  gEmo);    stats.emotion  += gEmo;
    const gDiv    = getGrowth('div');    growthXP += calcStatGrowthXP(stats.divine,   gDiv);    stats.divine   += gDiv;
    const gSoc    = getGrowth('soc');    growthXP += calcStatGrowthXP(stats.society,  gSoc);    stats.society  += gSoc;

    // ---- 基本能力値表示 ----
    document.getElementById('stat-body').textContent = stats.physical;
    document.getElementById('stat-tech').textContent = stats.tech;
    document.getElementById('stat-emo').textContent  = stats.emotion;
    document.getElementById('stat-div').textContent  = stats.divine;
    document.getElementById('stat-soc').textContent  = stats.society;
    document.getElementById('stat-body-b').textContent = '/' + Math.floor(stats.physical / 2);
    document.getElementById('stat-tech-b').textContent = '/' + Math.floor(stats.tech     / 2);
    document.getElementById('stat-emo-b').textContent  = '/' + Math.floor(stats.emotion  / 2);
    document.getElementById('stat-div-b').textContent  = '/' + Math.floor(stats.divine   / 2);
    document.getElementById('stat-soc-b').textContent  = '/' + Math.floor(stats.society  / 2);

    // ---- 戦闘能力値 ----
    cStats.melee  = (styleData ? styleData['白兵'] || 0 : 0) + (pRootData ? pRootData['白兵'] || 0 : 0) + (charData.mods.melee  || 0);
    cStats.ranged = (styleData ? styleData['射撃'] || 0 : 0) + (pRootData ? pRootData['射撃'] || 0 : 0) + (charData.mods.ranged || 0);
    cStats.dodge  = (styleData ? styleData['回避'] || 0 : 0) + (pRootData ? pRootData['回避'] || 0 : 0) + (charData.mods.dodge  || 0);
    cStats.action = (styleData ? styleData['行動'] || 0 : 0) + (pRootData ? pRootData['行動'] || 0 : 0) + (charData.mods.action || 0);

    const gMelee  = getGrowth('melee');  growthXP += calcStatGrowthXP(cStats.melee,  gMelee);  cStats.melee  += gMelee;
    const gRanged = getGrowth('ranged'); growthXP += calcStatGrowthXP(cStats.ranged, gRanged); cStats.ranged += gRanged;
    const gDodge  = getGrowth('dodge');  growthXP += calcStatGrowthXP(cStats.dodge,  gDodge);  cStats.dodge  += gDodge;
    const gAction = getGrowth('action'); growthXP += calcStatGrowthXP(cStats.action, gAction); cStats.action += gAction;

    document.getElementById('stat-melee').textContent  = cStats.melee;
    document.getElementById('stat-ranged').textContent = cStats.ranged;

    // ---- 装備による防具修正 ----
    let activeDodgeMod = 0, activeActionMod = 0, activeArmorA = charData.mods.armor || 0;

    function parseEqCost(str) {
        if (!str) return 0;
        const parts = String(str).split('/');
        const val = parseInt(parts[parts.length - 1]);
        return isNaN(val) ? 0 : val;
    }

    let equipCost = 0;
    acquiredWeapons.forEach(w  => equipCost += parseEqCost(w['購入']));
    acquiredArmor.forEach(armor => {
        equipCost += parseEqCost(armor['購入']);
        if ((window.isBeastMode && armor._beastEquip) || (!window.isBeastMode && armor._normalEquip)) {
            activeDodgeMod  += Number(armor['ドッジ'])   || 0;
            activeActionMod += Number(armor['行動値'])    || 0;
            activeArmorA    += Number(armor['A値'])       || 0;
        }
    });
    acquiredItems.forEach(i => equipCost += parseEqCost(i['購入']) * (i._quantity !== undefined ? parseInt(i._quantity) : 1));

    const finalDodge  = cStats.dodge  + activeDodgeMod;
    const finalAction = cStats.action + activeActionMod;

    document.getElementById('stat-dodge').innerHTML  = activeDodgeMod  !== 0 ? `${finalDodge} <small>(${cStats.dodge} ${activeDodgeMod  >= 0 ? '+' : ''}${activeDodgeMod})</small>`  : finalDodge;
    document.getElementById('stat-action').innerHTML = activeActionMod !== 0 ? `${finalAction} <small>(${cStats.action} ${activeActionMod >= 0 ? '+' : ''}${activeActionMod})</small>` : finalAction;

    // ---- 常時アーツのコスト（人間性計算用）----
    function parseArtCost(art) {
        let costStr = String(art['コスト'] || '0').trim();
        let level = parseInt(art._currentLevel) || 1;

        if (costStr.includes('Lv')) {
            // "Lv+n" or "Lv*n" or just "Lv"
            try {
                // 安全な評価のために正規表現でチェック
                if (/^Lv\s*[\+\-\*\/]\s*\d+$/.test(costStr)) {
                    let expression = costStr.replace(/Lv/g, level);
                    return eval(expression);
                } else if (costStr === 'Lv') {
                    return level;
                }
            } catch (e) {
                console.error("Failed to parse art cost:", costStr, e);
            }
        }

        let val = parseInt(costStr);
        return isNaN(val) ? 0 : val;
    }

    let alwaysArtsCost = 0;
    acquiredArts.forEach(a => {
        const timing = a['タイミング'] || '';
        const type   = a['種別'] || '';
        const cost   = parseArtCost(a);
        
        let isAlways = false;
        
        // 常時かつ「自動」種別を含まない、かつ「解放状態」を含まない
        if (timing.includes('常時') && !type.includes('自動') && !timing.includes('解放状態')) {
            isAlways = true;
        } 
        // あるいは「自動」種別を含み、かつ「常時」タイミングを含む場合
        else if (type.includes('自動') && timing.includes('常時')) {
            isAlways = true;
        }

        if (isAlways) {
            alwaysArtsCost += cost;
        }
    });

    // ---- FP / 人間性 / 種別 ----
    const fp    = stats.physical + stats.tech + stats.emotion + 20 + (charData.mods.fp       || 0);
    const human = stats.humanity + (charData.mods.humanity || 0) - alwaysArtsCost;
    document.getElementById('stat-fp').textContent        = fp;
    document.getElementById('stat-humanity').textContent  = human;
    document.getElementById('stat-type').textContent      = stats.type.length > 0 ? stats.type.join(' / ') : '-';

    // ---- アーマー値表示 ----
    document.getElementById('armor-phys').textContent = Math.floor(stats.physical / 2) + activeArmorA;
    document.getElementById('armor-tech').textContent = Math.floor(stats.tech     / 2) + activeArmorA;
    document.getElementById('armor-emo').textContent  = Math.floor(stats.emotion  / 2) + activeArmorA;
    document.getElementById('armor-div').textContent  = Math.floor(stats.divine   / 2) + activeArmorA;
    document.getElementById('armor-soc').textContent  = Math.floor(stats.society  / 2) + activeArmorA;

    // ---- 自動取得アーツ更新 ----
    updateAutoArts(pRootName, sRootName, tRootName, styleName);

    // ---- 経験点集計 ----
    let artsXP = 0, rawArtLevels = 0;
    const usedSelectRoots = {};
    let freeArtLvlPool = 5;
    if (pRootData && sRootData && pRootName !== sRootName && pRootData['ブラッド名'] === sRootData['ブラッド名']) freeArtLvlPool = 3;

    let isNextCopied = false;
    acquiredArts.forEach(a => {
        const root  = a._rt || a['ルーツ'];
        const type  = a['種別'] || '';
        let   lvl   = parseInt(a._currentLevel); if (isNaN(lvl)) lvl = 1;
        const extra = Math.max(0, lvl - 1);
        const isCopy   = type.includes('コピー');
        const isCopied = isNextCopied;

        if (!isCopied) {
            if      (type.includes('自動'))                          artsXP += extra * 5;
            else if (type.includes('選択') && !usedSelectRoots[root]) { usedSelectRoots[root] = true; artsXP += extra * 5; }
            else    rawArtLevels += lvl;
        }
        isNextCopied = isCopy;
    });
    artsXP += Math.max(0, rawArtLevels - freeArtLvlPool) * 5;

    const rootsXP  = tRootName ? 15 : 0;
    const eqCostXP = Math.max(0, equipCost - 30);
    document.getElementById('total-xp-used').textContent = rootsXP + growthXP + artsXP + eqCostXP;
}

// グローバル公開
window.calculateStats     = calculateStats;
window.resetStatsDisplay  = resetStatsDisplay;
