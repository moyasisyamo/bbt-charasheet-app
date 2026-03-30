/**
 * firebase.js
 * Firebase Firestore + Cloud Storage の初期化・保存・読み込みを担当する。
 * FIREBASE_CONFIG が設定されていない場合は noFirebase モードで動作する。
 */

let _db = null;
let _storage = null;
let _firebaseReady = false;

/** Firebase初期化。設定済みなら true を返す */
function bbFirebaseInit() {
    try {
        if (typeof FIREBASE_CONFIG === 'undefined') return false;
        if (FIREBASE_CONFIG.projectId === 'YOUR_PROJECT_ID') return false;
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        _db = firebase.firestore();
        // Cloud Storage 初期化
        try {
            _storage = firebase.storage();
        } catch (e) {
            console.warn('Cloud Storage初期化失敗（Storageなしで続行）:', e);
        }
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
    // Storageの画像も削除を試みる（エラーは無視）
    if (_storage) {
        const imageTypes = ['image', 'image2', 'faceIcon'];
        for (const type of imageTypes) {
            try {
                const ref = _storage.ref(`character_images/${charId}/${type}`);
                await ref.delete();
            } catch (e) {
                // ファイルが存在しない場合は無視
            }
        }
    }
    await _db.collection('characters').doc(charId).delete();
}

/**
 * 画像をCloud Storageにアップロードし、ダウンロードURLを返す
 * @param {string} charId - キャラクターID
 * @param {File|Blob} file - アップロードするファイル
 * @param {string} imageType - 画像種別 ('image', 'image2', 'faceIcon')
 * @returns {Promise<string>} ダウンロードURL
 */
async function bbFirebaseUploadImage(charId, file, imageType) {
    if (!_storage) throw new Error('Cloud Storageが利用できません');
    const path = `character_images/${charId}/${imageType}`;
    const ref = _storage.ref(path);
    const snapshot = await ref.put(file);
    return await snapshot.ref.getDownloadURL();
}

/**
 * Cloud Storage上の画像を削除する
 * @param {string} charId - キャラクターID
 * @param {string} imageType - 画像種別 ('image', 'image2', 'faceIcon')
 */
async function bbFirebaseDeleteImage(charId, imageType) {
    if (!_storage) return;
    try {
        const ref = _storage.ref(`character_images/${charId}/${imageType}`);
        await ref.delete();
    } catch (e) {
        // ファイルが存在しない場合は無視
    }
}

/** 新規ドキュメント用のIDを事前生成する */
function bbFirebaseGenerateId() {
    if (!_firebaseReady) throw new Error('Firebase未設定');
    return _db.collection('characters').doc().id;
}

window.bbFirebase = {
    init:         bbFirebaseInit,
    save:         bbFirebaseSave,
    load:         bbFirebaseLoad,
    loadAll:      bbFirebaseLoadAll,
    delete:       bbFirebaseDelete,
    uploadImage:  bbFirebaseUploadImage,
    deleteImage:  bbFirebaseDeleteImage,
    generateId:   bbFirebaseGenerateId,
    isReady:      () => _firebaseReady,
    hasStorage:   () => !!_storage,
};
