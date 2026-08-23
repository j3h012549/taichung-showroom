const fs = require('fs');
const path = require('path');
// 使用 Node.js 內建的 node:sqlite 模組（Node 22.5+ 內建），
// 不需要額外安裝需要編譯的原生套件（例如 better-sqlite3），
// 在同事的電腦上安裝設定會簡單很多，不會遇到需要 Xcode Command Line Tools 才能編譯的問題。
const { DatabaseSync } = require('node:sqlite');

// 部署到雲端主機（例如 Render）時，容器的檔案系統通常不是永久保存的，
// 重新部署或重啟就會被清空。這種情況下請設定環境變數 DATA_DIR 指向掛載的永久磁碟（Disk）路徑，
// 資料庫檔案就會存在那個磁碟上，不會因為重新部署而遺失。本機使用則不用設定，預設存在 db 資料夾內。
const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'data.sqlite');
const rawDb = new DatabaseSync(dbPath);

// 包一層讓介面跟 better-sqlite3 相容，其餘程式碼不用更動
const db = {
  exec: (sql) => rawDb.exec(sql),
  pragma: (str) => { try { rawDb.exec('PRAGMA ' + str + ';'); } catch (e) { /* 忽略不支援的 pragma */ } },
  prepare: (sql) => {
    const stmt = rawDb.prepare(sql);
    return {
      run: (...args) => {
        const r = stmt.run(...args);
        return { changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) };
      },
      get: (...args) => stmt.get(...args),
      all: (...args) => stmt.all(...args)
    };
  }
};

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
