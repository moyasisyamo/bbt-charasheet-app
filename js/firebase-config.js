/**
 * firebase-config.js
 * ★★★ このファイルを自分のFirebase設定に書き換えてください ★★★
 * 
 * 設定値の取得方法:
 * 1. https://console.firebase.google.com/ でプロジェクトを開く
 * 2. 「プロジェクトの設定」(歯車アイコン) → 「全般」タブ
 * 3. 「マイアプリ」セクションで「</>」(Web)アプリを追加
 * 4. 表示された firebaseConfig の値をコピーしてここに貼り付ける
 */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCfw35kiF5jwEDrLdXMiUQFp6A-fMhUAZ0",
    authDomain: "bbt-charasheet.firebaseapp.com",
    projectId: "bbt-charasheet",
    storageBucket: "bbt-charasheet.firebasestorage.app",
    messagingSenderId: "796364269135",
    appId: "1:796364269135:web:a56ce898308f818705ac3a"
};

// ↓任意の管理者用パスワードに変更してください（全キャラクターの強制削除が可能になります）
const ADMIN_PASSWORD = "master";
