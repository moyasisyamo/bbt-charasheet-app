/**
 * firebase.js
 * Firebase Firestore の初期化・保存・読み込みを担当する。
 * FIREBASE_CONFIG が設定されていない場合は noFirebase モードで動作する。
 */

let _db = null;
let _firebaseReady = false;

/** Firebase初期化。設定済みなら true を返す */
function bbFirebaseInit() {
    try {
        if (typeof FIREBASE_CONFIG === 'undefined') return false;
        if (FIREBASE_CONFIG.projectId === 'YOUR_PROJECT_ID') return false;
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        _db = firebase.firestore();
        _firebaseReady = true;
        return true;
    } catch (e) {
        console.warn('Firebase初期化失敗:', e);
        return false;
    }
}

/** undefined を再帰的に null に変換（Firestoreはundefined不可） */
function sanitizeForFirestore(val) {
    if (val === undefined) return null;
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) return val.map(sanitizeForFirestore);
    const out = {};
    for (const [k, v] of Object.entries(val)) {
        out[k] = sanitizeForFirestore(v);
    }
    return out;
}

/** キャラクターをFirestoreに保存する */
async function bbFirebaseSave(charId, summary, sheetData, options = {}) {
    if (!_firebaseReady) throw new Error('Firebase未設定');
    // undefined を null に変換してから必要に応じて timestamp を付与
    const sanitized = sanitizeForFirestore({ ...summary, sheetData });
    const doc = {
        ...sanitized,
    };
    if (!options.skipTimestamp) {
        doc.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    }

    if (charId) {
        await _db.collection('characters').doc(charId).set(doc, { merge: true });
        return charId;
    } else {
        doc.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        // 新規作成時は必ず更新日時も入れる
        if (options.skipTimestamp) {
            doc.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        const ref = await _db.collection('characters').add(doc);
        return ref.id;
    }
}

/** FirestoreからキャラクターをIDで読み込む */
async function bbFirebaseLoad(charId) {
    if (!_firebaseReady) throw new Error('Firebase未設定');
    const snap = await _db.collection('characters').doc(charId).get();
    if (!snap.exists) throw new Error('キャラクターが見つかりません');
    return { id: snap.id, ...snap.data() };
}

/** 全キャラクター一覧を取得する（ロビー用） */
async function bbFirebaseLoadAll() {
    if (!_firebaseReady) throw new Error('Firebase未設定');
    const snap = await _db.collection('characters')
        .orderBy('updatedAt', 'desc')
        .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** キャラクターを削除する */
async function bbFirebaseDelete(charId) {
    if (!_firebaseReady) throw new Error('Firebase未設定');
    await _db.collection('characters').doc(charId).delete();
}

window.bbFirebase = {
    init:      bbFirebaseInit,
    save:      bbFirebaseSave,
    load:      bbFirebaseLoad,
    loadAll:   bbFirebaseLoadAll,
    delete:    bbFirebaseDelete,
    isReady:   () => _firebaseReady,
};
